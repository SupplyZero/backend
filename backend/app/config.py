from functools import lru_cache

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore", env_ignore_empty=True)

    database_url: str = "sqlite+aiosqlite:///./supplyzero.db"
    redis_url: str = "redis://localhost:6379/0"
    mqtt_host: str = "localhost"
    mqtt_port: int = 1883
    mqtt_username: str | None = None
    mqtt_password: str | None = None
    mqtt_enabled: bool = False
    osrm_base_url: str = "https://router.project-osrm.org"
    osrm_timeout_seconds: float = 1.2
    weather_enabled: bool = True
    weather_api_base_url: str = "https://api.open-meteo.com/v1/forecast"
    weather_timeout_seconds: float = 2.5
    weather_heatwave_threshold_c: float = 35.0
    gemini_api_key: SecretStr | None = None
    gemini_api_base_url: str = "https://generativelanguage.googleapis.com/v1beta"
    gemini_model: str = "gemini-3.8-flash"
    telemetry_gap_seconds: int = 300
    gap_degradation_factor: float = 3.0
    safety_margin_hours: float = 2.0
    auto_execute: bool = False
    route_cache_ttl_seconds: int = 60


@lru_cache
def get_settings() -> Settings:
    return Settings()
