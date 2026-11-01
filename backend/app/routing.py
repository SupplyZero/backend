import asyncio
import json
import logging
from bisect import bisect_left
from datetime import datetime, timezone
from math import asin, cos, radians, sin, sqrt
from typing import Any

import httpx
from redis.asyncio import Redis

logger = logging.getLogger(__name__)


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance for a resilient routing estimate."""
    dlat, dlon = radians(lat2 - lat1), radians(lon2 - lon1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    return 6371.0088 * 2 * asin(min(1.0, sqrt(a)))


class WeatherClient:
    """Open-Meteo hourly forecast client for sampled route coordinates."""

    def __init__(self, base_url: str = "https://api.open-meteo.com/v1/forecast",
                 timeout_seconds: float = 2.5, heatwave_threshold_c: float = 35.0):
        self.base_url = base_url
        self.timeout = timeout_seconds
        self.heatwave_threshold_c = heatwave_threshold_c

    async def temperatures(self, points: list[tuple[float, float]],
                           point_travel_hours: list[float]) -> list[float] | None:
        if not points:
            return None
        try:
            params = {
                "latitude": ",".join(f"{lat:.4f}" for lat, _ in points),
                "longitude": ",".join(f"{lon:.4f}" for _, lon in points),
                "hourly": "temperature_2m",
                "forecast_days": min(7, max(2, int(max(point_travel_hours, default=0) / 24) + 2)),
                "timezone": "GMT",
            }
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(self.base_url, params=params)
                response.raise_for_status()
                body = response.json()
            locations = body if isinstance(body, list) else [body]
            now = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
            target_times = [now.timestamp() + hours * 3600 for hours in point_travel_hours]
            result = []
            for location, target in zip(locations, target_times, strict=True):
                hourly = location["hourly"]
                times = [datetime.fromisoformat(value).replace(tzinfo=timezone.utc).timestamp()
                         for value in hourly["time"]]
                index = min(bisect_left(times, target), len(times) - 1)
                value = hourly["temperature_2m"][index]
                if value is None:
                    return None
                result.append(float(value))
            return result
        except Exception as exc:
            logger.warning("weather_forecast_unavailable", error=str(exc))
            return None

    def summarize(self, temps: list[float], threshold_c: float,
                  duration_h: float,
                  points: list[tuple[float, float]]) -> dict[str, Any]:
        hot_zones = [{"lat": round(lat, 4), "lon": round(lon, 4), "temp_c": round(temp, 1)}
                     for (lat, lon), temp in zip(points, temps, strict=True)
                     if temp > threshold_c]
        stress = (sum(max(0.0, temp - threshold_c) for temp in temps)
                  / max(1, len(temps)) * duration_h)
        return {
            "available": True,
            "sampled_points": len(temps),
            "mean_temp_c": round(sum(temps) / len(temps), 1),
            "peak_temp_c": round(max(temps), 1),
            "hot_zone_count": len(hot_zones),
            "hot_zones": hot_zones,
            "heatwave_exposure": any(temp >= self.heatwave_threshold_c for temp in temps),
            "thermal_stress_degree_hours": round(stress, 2),
            "temperature_limit_c": threshold_c,
            "heatwave_threshold_c": self.heatwave_threshold_c,
        }


class RouteClient:
    def __init__(self, base_url: str, timeout_seconds: float = 1.2,
                 redis: Redis | None = None, cache_ttl: int = 60,
                 weather: WeatherClient | None = None, weather_enabled: bool = True):
        self.base_url = base_url.rstrip("/")
        self.timeout = min(timeout_seconds, 1.49)
        self.redis = redis
        self.cache_ttl = cache_ttl
        self.weather = (weather or WeatherClient()) if weather_enabled else None
        self._failures = 0
        self._open_until = 0.0
        self._lock = asyncio.Lock()

    async def route(self, origin: tuple[float, float], destination: tuple[float, float]) -> dict[str, Any]:
        key = "route:" + ":".join(f"{v:.3f}" for v in (*origin, *destination))
        if self.redis:
            try:
                cached = await self.redis.get(key)
                if cached:
                    return json.loads(cached)
            except Exception:
                logger.warning("route_cache_unavailable", exc_info=True)
        now = asyncio.get_running_loop().time()
        if now < self._open_until:
            return self._fallback(origin, destination, "circuit_open")
        try:
            url = (f"{self.base_url}/route/v1/driving/{origin[1]},{origin[0]};"
                   f"{destination[1]},{destination[0]}")
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(url, params={"overview": "false"})
                response.raise_for_status()
                route = response.json()["routes"][0]
                result = {"distance_km": route["distance"] / 1000,
                          "duration_h": route["duration"] / 3600, "fallback": False}
            async with self._lock:
                self._failures = 0
            if self.redis:
                try:
                    await self.redis.set(key, json.dumps(result), ex=self.cache_ttl)
                except Exception:
                    logger.warning("route_cache_write_failed", exc_info=True)
            return result
        except Exception as exc:
            await self._record_failure()
            logger.warning("osrm_failed_using_haversine", error=str(exc))
            return self._fallback(origin, destination, type(exc).__name__)

    async def route_many(self, origin: tuple[float, float],
                         destinations: list[tuple[float, float]],
                         heat_threshold_c: float = 8.0) -> list[dict[str, Any]]:
        """Choose the least heat-exposed OSRM alternative for each destination."""
        if not destinations:
            return []
        key = "route-matrix:" + ":".join(
            f"{v:.3f}" for pair in (origin, *destinations) for v in pair)
        key += f":heat:{heat_threshold_c:.1f}"
        if self.redis:
            try:
                cached = await self.redis.get(key)
                if cached:
                    return json.loads(cached)
            except Exception:
                logger.warning("route_matrix_cache_unavailable", exc_info=True)
        if asyncio.get_running_loop().time() < self._open_until:
            return [self._fallback(origin, destination, "circuit_open")
                    for destination in destinations]

        async def fetch(destination: tuple[float, float]) -> list[dict[str, Any]]:
            url = (f"{self.base_url}/route/v1/driving/{origin[1]},{origin[0]};"
                   f"{destination[1]},{destination[0]}")
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(url, params={
                    "alternatives": "2", "overview": "full", "geometries": "geojson"})
                response.raise_for_status()
                body = response.json()
            return [{"distance_km": route["distance"] / 1000,
                     "duration_h": route["duration"] / 3600, "fallback": False,
                     "geometry": route.get("geometry", {}).get("coordinates", [])}
                    for route in body["routes"]]

        try:
            alternatives = await asyncio.gather(*(fetch(destination) for destination in destinations))
            candidate_routes = [route for alternatives_for_destination in alternatives
                                for route in alternatives_for_destination]
            route_points = [self._sample_geometry(route.get("geometry", []))
                            for route in candidate_routes]
            point_counts = [len(points) for points in route_points]
            flat_points = [point for points in route_points for point in points]
            point_travel_hours = []
            for route, count in zip(candidate_routes, point_counts, strict=True):
                point_travel_hours.extend(route["duration_h"] * i / max(1, count - 1)
                                          for i in range(count))
            temperatures = (await self.weather.temperatures(flat_points, point_travel_hours)
                            if self.weather else None)
            if temperatures is not None and len(temperatures) == len(flat_points):
                offset = 0
                for route, points, count in zip(candidate_routes, route_points, point_counts, strict=True):
                    temps = temperatures[offset:offset + count]
                    offset += count
                    route["weather_risk"] = self.weather.summarize(
                        temps, heat_threshold_c, route["duration_h"], points)
                selected = []
                cursor = 0
                for alternatives_for_destination in alternatives:
                    scored = candidate_routes[cursor:cursor + len(alternatives_for_destination)]
                    cursor += len(alternatives_for_destination)
                    selected.append(min(scored, key=lambda route: (
                        route["weather_risk"]["thermal_stress_degree_hours"],
                        route["duration_h"])))
            else:
                selected = [routes[0] for routes in alternatives]
                for route in selected:
                    route["weather_risk"] = {"available": False}
            for route in selected:
                route.pop("geometry", None)
            async with self._lock:
                self._failures = 0
            if self.redis:
                try:
                    await self.redis.set(key, json.dumps(selected), ex=self.cache_ttl)
                except Exception:
                    logger.warning("route_matrix_cache_write_failed", exc_info=True)
            return selected
        except Exception as exc:
            await self._record_failure()
            logger.warning("osrm_matrix_failed_using_haversine", error=str(exc))
            return [self._fallback(origin, destination, type(exc).__name__)
                    for destination in destinations]

    @staticmethod
    def _sample_geometry(coordinates: list[list[float]], samples: int = 5) -> list[tuple[float, float]]:
        if not coordinates:
            return []
        count = min(samples, len(coordinates))
        indices = sorted({round(i * (len(coordinates) - 1) / max(1, count - 1))
                          for i in range(count)})
        return [(coordinates[index][1], coordinates[index][0]) for index in indices]

    async def _record_failure(self) -> None:
        async with self._lock:
            self._failures += 1
            if self._failures >= 3:
                self._open_until = asyncio.get_running_loop().time() + 15
                self._failures = 0

    @staticmethod
    def _fallback(origin: tuple[float, float], destination: tuple[float, float],
                  reason: str) -> dict[str, Any]:
        km = haversine_km(*origin, *destination) * 1.3
        return {"distance_km": km, "duration_h": km / 45.0, "fallback": True,
                "fallback_reason": reason, "weather_risk": {"available": False}}
