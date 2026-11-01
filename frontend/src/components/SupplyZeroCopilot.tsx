import { useMemo, useState } from 'react'
import { Bot, ChevronDown, CornerDownLeft, Sparkles, X } from 'lucide-react'
import type { ImpactSummary, Recommendation, Shipment } from '../types'

type Message = { from: 'assistant' | 'user'; text: string }
const money = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)

function answer(question: string, shipments: Shipment[], recommendations: Recommendation[], impact?: ImpactSummary) {
  const query = question.toLowerCase()
  const id = shipments.find((item) => query.includes(item.id.toLowerCase()))
  if (id) {
    const pending = recommendations.filter((item) => item.shipment_id === id.id && item.status === 'PENDING')
    const temp = id.current_temp == null ? 'temperature unavailable' : `${id.current_temp.toFixed(1)}°C`
    const rsl = id.state?.rsl_h == null ? 'RSL unavailable' : `${id.state.rsl_h.toFixed(1)} hours remaining (${Math.round(id.state.rsl_pct ?? 0)}%)`
    const action = pending[0] ? ` Pending action: ${pending[0].action}${pending[0].target_hub_name ? ` to ${pending[0].target_hub_name}` : ''}. ${pending[0].rationale ?? ''}` : ' There is no pending recommendation for this shipment.'
    return `${id.id} (${id.product ?? id.category ?? 'shipment'}) is ${id.state?.health ?? 'awaiting status'} at ${temp}; ${rsl}.${action}`
  }
  if (/risk|critical|attention|alert/.test(query)) {
    const risky = shipments.filter((item) => item.state?.health === 'RED' || item.state?.health === 'AMBER')
    if (!risky.length) return 'No amber or red shipments are currently reported in the loaded fleet data.'
    return `${risky.length} shipment${risky.length === 1 ? '' : 's'} need attention: ${risky.slice(0, 5).map((item) => `${item.id} (${item.state?.health}, ${item.state?.rsl_h?.toFixed(1) ?? '—'}h RSL)`).join('; ')}.`
  }
  if (/recommend|pending|decision/.test(query)) {
    const pending = recommendations.filter((item) => item.status === 'PENDING')
    if (!pending.length) return 'There are no pending recommendations in the loaded dashboard data.'
    return `${pending.length} recommendation${pending.length === 1 ? '' : 's'} await review. ${pending.slice(0, 4).map((item) => `${item.action} for ${item.shipment_id}${item.target_hub_name ? ` to ${item.target_hub_name}` : ''} (${money(item.saving ?? 0)} estimated saving)`).join('; ')}.`
  }
  if (/impact|saved|saving|co.?2|divert/.test(query)) {
    return `Recorded approved-decision impact: ${money(impact?.value_saved ?? 0)} saved, ${(impact?.kg_diverted ?? 0).toLocaleString('en-IN')} kg diverted, and ${(impact?.co2e_avoided_kg ?? 0).toLocaleString('en-IN')} kg CO₂e avoided. Treat these as demo figures if your fleet data is seeded.`
  }
  if (/help|what can|question/.test(query)) return 'Ask about a shipment ID, which loads are at risk, pending recommendations, or recorded impact. I answer from the data currently loaded in this dashboard.'
  return 'I can answer from the dashboard’s loaded shipment, recommendation, and impact data. Try asking “Which shipments are at risk?” or enter a shipment ID.'
}

export function SupplyZeroCopilot({ shipments, recommendations, impact }: { shipments: Shipment[]; recommendations: Recommendation[]; impact?: ImpactSummary }) {
  const [open, setOpen] = useState(false)
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState<Message[]>([{ from: 'assistant', text: 'Hi, I can help you explore the shipment data on this dashboard. Ask about a shipment, current risks, pending actions, or recorded impact.' }])
  const suggestions = useMemo(() => ['Which shipments are at risk?', 'Show pending recommendations', 'What is our recorded impact?'], [])
  const ask = (text = question) => {
    const prompt = text.trim()
    if (!prompt) return
    setMessages((current) => [...current, { from: 'user', text: prompt }, { from: 'assistant', text: answer(prompt, shipments, recommendations, impact) }])
    setQuestion('')
  }
  return <div className="copilot-root">
    {open && <section className="copilot-panel" aria-label="SupplyZero Copilot"><header><span className="copilot-avatar"><Bot size={17} /></span><span><b>SupplyZero Copilot</b><small><i />Using live dashboard data</small></span><button className="icon-button" onClick={() => setOpen(false)} aria-label="Minimize copilot"><ChevronDown size={17} /></button><button className="icon-button" onClick={() => { setMessages([messages[0]]); setOpen(false) }} aria-label="Close copilot"><X size={16} /></button></header><div className="copilot-messages" aria-live="polite">{messages.map((message, index) => <div className={`copilot-message ${message.from}`} key={`${index}-${message.from}`}><span>{message.text}</span></div>)}</div>{messages.length === 1 && <div className="copilot-suggestions">{suggestions.map((item) => <button key={item} onClick={() => ask(item)}>{item}</button>)}</div>}<form className="copilot-input" onSubmit={(event) => { event.preventDefault(); ask() }}><input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask about your shipments…" aria-label="Ask the SupplyZero Copilot" /><button type="submit" disabled={!question.trim()} aria-label="Send question"><CornerDownLeft size={16} /></button></form><small className="copilot-note"><Sparkles size={12} />Answers use loaded dashboard data; no external AI service.</small></section>}
    <button className={`copilot-launcher ${open ? 'is-open' : ''}`} onClick={() => setOpen((value) => !value)} aria-label={open ? 'Close SupplyZero Copilot' : 'Open SupplyZero Copilot'}>{open ? <X size={19} /> : <><Sparkles size={17} /><span>Ask SupplyZero</span></>}</button>
  </div>
}
