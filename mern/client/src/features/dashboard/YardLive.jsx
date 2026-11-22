import { Activity, CheckCircle2, Clock, Receipt, Scale, Truck } from 'lucide-react';
import { StatCard } from '../../components/common/StatCard.jsx';
import { labelFor, money, number, dateTime } from '../../utils/format.js';
import { deadlineLabel, isOverdue } from '../../utils/time.js';

function MiniTable({ columns, rows, empty }) {
  if (!rows.length) return <div className="empty-state"><b>{empty}</b></div>;
  return <div className="table-wrap"><table className="compact-table"><thead><tr>{columns.map(([label]) => <th key={label}>{label}</th>)}</tr></thead>
    <tbody>{rows.map((row, i) => <tr key={row._id || row.reference || row.buyerId || i}>{columns.map(([label, render]) => <td key={label}>{render(row)}</td>)}</tr>)}</tbody></table></div>;
}

const Due = ({ value }) => <span className={'status-pill ' + (isOverdue(value) ? 'warn' : 'neutral')}>{deadlineLabel(value)}</span>;

/** Real arrivals-per-hour bars for today (replaces the prototype's static sample chart). */
function ArrivalsChart({ data }) {
  const hours = data.filter(h => h.hour >= 5 && h.hour <= 21);
  const max = Math.max(1, ...hours.map(h => h.lots));
  const w = 600, h = 170, bar = w / hours.length;
  return <svg className="arrivals-chart" viewBox={`0 0 ${w} ${h + 22}`} role="img" aria-label="Today's arrivals per hour">
    {hours.map((p, i) => { const bh = (p.lots / max) * h; return <g key={p.hour}>
      <rect x={i * bar + 6} y={h - bh} width={bar - 12} height={bh} rx="3" className="chart-bar"><title>{p.hour}:00 — {p.lots} lots</title></rect>
      {p.lots > 0 && <text x={i * bar + bar / 2} y={h - bh - 4} textAnchor="middle" className="chart-num">{p.lots}</text>}
      <text x={i * bar + bar / 2} y={h + 15} textAnchor="middle" className="chart-hour">{String(p.hour).padStart(2, '0')}</text></g>; })}
  </svg>;
}

export function YardLive({ live, onNavigate }) {
  const { status, stock, farmerDues, traderDues, farmerTotals, arrivalsByHour, activity } = live;
  return <>
    <div className="section-title"><div><h2>યાર્ડની હાલની સ્થિતિ · Current Yard Status</h2><p>આવકથી માલ નિકાલ સુધીનો live snapshot</p></div></div>
    <div className="metrics-grid">
      <StatCard label="હરાજી બાકી" value={number(status.auctionPending) + ' lot'} note="હજુ હરાજી થવાની છે" icon={Clock} tone="amber"/>
      <StatCard label="Gate Pass જારી" value={number(status.passesIssued) + ' પાસ'} note="પાસ નંબર બનેલ" icon={Receipt} tone="blue"/>
      <StatCard label="માલ રવાના" value={number(status.dispatched) + ' lot'} note="Exit confirmation થયેલ" icon={Truck} tone="blue"/>
      <StatCard label="યાર્ડમાં હાલ stock" value={number(status.inYard) + ' lot'} note={number(status.quintalsInside) + ' ક્વિન્ટલ અંદર'} icon={Scale}/>
    </div>
    <div className="dashboard-grid">
      <section className="surface-card"><div className="section-title"><div><h2>આજની આવક (કલાક પ્રમાણે)</h2><p>Gate entries જે આજે નોંધાઈ</p></div></div><ArrivalsChart data={arrivalsByHour}/></section>
      <section className="surface-card"><div className="section-title"><div><h2>તાજેતરની પ્રવૃત્તિ</h2><p>Audit trail (admin / inspector)</p></div><Activity size={18}/></div>
        {activity.length ? <div className="activity-list">{activity.map(a => <div className="activity-item" key={a._id}><CheckCircle2 size={15}/><div><b>{a.action}</b><small>{a.actorName} · {a.resourceId}</small></div><time>{dateTime(a.createdAt)}</time></div>)}</div>
          : <div className="empty-state"><b>આ role માટે activity feed ઉપલબ્ધ નથી</b></div>}</section>
    </div>
    <section className="surface-card"><div className="section-title"><div><h2>યાર્ડમાં હાલ કોનો કેટલો માલ જમા છે?</h2><p>Dispatch ન થયેલા Lot · માલિક, પાક, વાહન, stage અને નિકાલ deadline</p></div></div>
      <MiniTable empty="યાર્ડમાં કોઈ stock નથી" rows={stock} columns={[
        ['LOT ID', r => r.lotNumber], ['માલિક / ખેડૂત', r => <>{r.farmerName}<small className="cell-sub">{r.sellerType === 'trader' ? 'વેપારી' : 'ખેડૂત'} · {r.village || '—'}</small></>],
        ['પાક', r => r.commodity], ['જથ્થો', r => number(r.netWeight || r.estimated || 0) + ' Q'], ['વાહન', r => r.vehicle || '—'],
        ['સ્થિતિ', r => labelFor(r.status)], ['ખરીદદાર', r => r.buyerId?.name || 'હરાજી બાકી'], ['નિકાલ deadline', r => r.dispatchDueAt ? <Due value={r.dispatchDueAt}/> : '—']]}/></section>
    <div className="dashboard-grid">
      <section className="surface-card"><div className="section-title"><div><h2>ખેડૂતનું બાકી ચુકવણું</h2><p>Payable {money(farmerTotals.payable)} · Paid {money(farmerTotals.paid)} · બાકી {money(farmerTotals.due)} · Provisional {money(farmerTotals.provisional)}</p></div><button className="text-btn" onClick={() => onNavigate('payments')}>ચુકવણી ખોલો</button></div>
        <MiniTable empty="ખેડૂતની કોઈ ચુકવણી બાકી નથી." rows={farmerDues} columns={[
          ['ખેડૂત', r => r.farmer], ['Bill / Ticket', r => <>{r.reference}{r.kind === 'provisional' && <small className="cell-sub">Provisional · weighment બાકી</small>}</>],
          ['Payable', r => money(r.payable)], ['Paid', r => money(r.paid)], ['Balance', r => <b>{money(r.balance)}</b>], ['Due', r => <Due value={r.dueAt}/>]]}/></section>
      <section className="surface-card"><div className="section-title"><div><h2>વેપારીનું બાકી ખરીદ ખાતું</h2><p>Buyer-wise outstanding અને credit status</p></div><button className="text-btn" onClick={() => onNavigate('buyerledger')}>વેપારી ખાતું</button></div>
        <MiniTable empty="વેપારીની ખરીદ ચુકવણી બાકી નથી." rows={traderDues} columns={[
          ['વેપારી', r => <>{r.name}<small className="cell-sub">{r.registrationNo || 'Registration ID બાકી'}</small></>], ['Credit', r => r.creditDays + ' દિવસ'],
          ['Paid', r => money(r.paid)], ['Balance', r => <b>{money(r.due)}</b>], ['Status', r => <span className={'status-pill ' + (r.overdue ? 'warn' : 'neutral')}>{r.overdue ? 'Credit overdue' : 'વસૂલાત બાકી'}</span>]]}/></section>
    </div>
  </>;
}
