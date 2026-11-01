import { useEffect, useState } from 'react'
import { AlertTriangle, CloudSun, LoaderCircle, MapPin, Route, Wind } from 'lucide-react'
import type { Hub, Shipment } from '../types'

type RouteRisk = { distance: number; duration: number; peak: number; exposure: number; hotPoints: number; heatwavePoints: number }
type RouteResponse = { routes?: { distance: number; duration: number; geometry: { coordinates: [number, number][] } }[] }
type WeatherPoint = { hourly?: { time: string[]; temperature_2m: (number | null)[] } }

const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast'
const OSRM_URL = 'https://router.project-osrm.org/route/v1/driving'

function heatLimit(category?: string) {
  const key = (category ?? '').toUpperCase()
  return key === 'PHARMA' || key === 'BIOLOGIC' ? 8 : key === 'DAIRY' ? 6 : 5
}

function sampleRoute(coords: [number, number][], count = 5) {
  if (coords.length <= count) return coords
  return Array.from({ length: count }, (_, i) => coords[Math.round(i * (coords.length - 1) / (count - 1))])
}

async function assessRoute(route: NonNullable<RouteResponse['routes']>[number], limit: number): Promise<RouteRisk> {
  const points = sampleRoute(route.geometry.coordinates)
  const params = new URLSearchParams({
    latitude: points.map(([, lat]) => lat.toFixed(4)).join(','),
    longitude: points.map(([longitude]) => longitude.toFixed(4)).join(','),
    hourly: 'temperature_2m', forecast_days: '2', timezone: 'UTC',
  })
  const response = await fetch(`${WEATHER_URL}?${params}`)
  if (!response.ok) throw new Error('Weather forecast is temporarily unavailable.')
  const body = await response.json() as WeatherPoint | WeatherPoint[]
  const locations = Array.isArray(body) ? body : [body]
  const departureHour = new Date(); departureHour.setMinutes(0, 0, 0)
  const etaHours = route.duration / 3600
  const temps = locations.map((location, index) => {
    const forecast = location.hourly
    if (!forecast) return null
    const arrivalAtPoint = new Date(departureHour.getTime() + etaHours * index / Math.max(1, locations.length - 1) * 3_600_000)
    const nearest = forecast.time.reduce((best, time, i) =>
      Math.abs(new Date(time).getTime() - arrivalAtPoint.getTime()) < Math.abs(new Date(forecast.time[best]).getTime() - arrivalAtPoint.getTime()) ? i : best, 0)
    return forecast.temperature_2m[nearest] ?? null
  }).filter((value): value is number => value != null && Number.isFinite(value))
  if (!temps.length) throw new Error('No hourly weather data was returned for this route.')
  const segmentHours = etaHours / Math.max(1, temps.length - 1)
  const exposure = temps.reduce((sum, temp) => sum + Math.max(0, temp - limit) * segmentHours, 0)
  return { distance: route.distance / 1000, duration: etaHours, peak: Math.max(...temps), exposure, hotPoints: temps.filter((temp) => temp > limit).length, heatwavePoints: temps.filter((temp) => temp >= 35).length }
}

export function WeatherRouteRisk({ shipment, hubs }: { shipment: Shipment; hubs: Hub[] }) {
  const eligible = hubs.filter((hub) => Number.isFinite(hub.lat) && Number.isFinite(hub.lon))
  const [hubId, setHubId] = useState('')
  const [risks, setRisks] = useState<RouteRisk[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [scanned, setScanned] = useState(false)
  const threshold = heatLimit(shipment.category)
  const hub = eligible.find((item) => item.id === hubId)

  useEffect(() => {
    if (!eligible.length) return
    setHubId((current) => current && eligible.some((item) => item.id === current) ? current : eligible[0].id)
  }, [shipment.id, hubs])

  const scan = async () => {
    if (shipment.current_lat == null || shipment.current_lon == null || !hub) {
      setError('Route scan needs a shipment GPS position and a hub location.')
      return
    }
    setBusy(true); setError(''); setScanned(false); setRisks([])
    try {
      const path = `${shipment.current_lon},${shipment.current_lat};${hub.lon},${hub.lat}`
      const response = await fetch(`${OSRM_URL}/${path}?alternatives=2&overview=full&geometries=geojson`)
      if (!response.ok) throw new Error('OSRM route lookup failed.')
      const result = await response.json() as RouteResponse
      if (!result.routes?.length) throw new Error('No drivable route alternatives were found.')
      const assessed = await Promise.all(result.routes.map((route) => assessRoute(route, threshold)))
      setRisks(assessed.sort((a, b) => a.exposure - b.exposure))
      setScanned(true)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not assess route weather.')
    } finally { setBusy(false) }
  }

  return <section className="weather-route-panel" aria-label="Weather-aware route risk">
    <div className="weather-route-head"><span className="weather-icon"><CloudSun size={17} /></span><div><strong>Weather-aware route risk</strong><small>OSRM alternatives + hourly Open-Meteo forecast</small></div><button className="secondary-button weather-scan-button" onClick={scan} disabled={busy || !eligible.length}>{busy ? <LoaderCircle size={14} className="spin" /> : <Route size={14} />}{busy ? 'Scanning' : 'Scan routes'}</button></div>
    {eligible.length > 0 && <label className="weather-hub-select">Compare route to<select value={hubId} onChange={(event) => setHubId(event.target.value)}>{eligible.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}
    <p className="weather-explain">Screens each available road alternative for forecast heat above the {threshold}°C category limit, using temperatures sampled along the route. The lowest-exposure option is advisory and does not change the shipment or decision engine.</p>
    {error && <div className="weather-error"><AlertTriangle size={14} />{error}</div>}
    {scanned && risks.length > 0 && <div className="weather-results"><div className="weather-best"><Wind size={15} /><span><b>Lowest heat exposure</b><small>{risks[0].peak.toFixed(1)}°C peak · {risks[0].exposure.toFixed(1)} degree-hours above limit · {risks[0].heatwavePoints} heatwave sample points ≥35°C</small></span><em>Route 1</em></div>{risks.map((risk, index) => <div className="weather-route-row" key={`${risk.distance}-${risk.duration}-${index}`}><span><Route size={13} />Route {index + 1}{index === 0 && <b className="route-recommended">LOWEST HEAT</b>}</span><span>{risk.duration.toFixed(1)} h · {Math.round(risk.distance)} km</span><span><MapPin size={12} />{risk.hotPoints} high-risk samples · {risk.heatwavePoints} heatwave samples · peak {risk.peak.toFixed(1)}°C</span></div>)}</div>}
    <small className="weather-disclaimer">Forecast is an ambient-air screening estimate, not cargo temperature or validated quality advice. Weather lookup requires internet access.</small>
  </section>
}
