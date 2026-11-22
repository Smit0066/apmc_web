import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, ArrowRight, DoorOpen, Gavel, Package, RefreshCw, ShieldCheck, Users, Wallet, Truck } from 'lucide-react';
import { roles } from '../../constants/roles.js';
import { navigation } from '../../constants/navigation.js';
import { pageConfig } from '../../constants/pageConfig.js';
import { money, number } from '../../utils/format.js';
import { api } from '../../services/api.js';
import { StatCard } from '../../components/common/StatCard.jsx';
import { DataTable } from '../../components/common/DataTable.jsx';

export function Dashboard({user,onNavigate}) {
  const [stats,setStats]=useState(null);const [lots,setLots]=useState([]);const [error,setError]=useState('');const [loading,setLoading]=useState(true);
  const load=useCallback(async()=>{setLoading(true);setError('');try{const [summary,latest]=await Promise.all([api('/yard/overview'),api('/yard/lots?limit=6')]);setStats(summary.stats);setLots(latest.items)}catch(e){setError(e.message)}finally{setLoading(false)}},[]);
  useEffect(()=>{load()},[load]);
  const values=stats||{};
  return <div className="page-stack">
    <div className="welcome-row"><div><span className="eyebrow">YARD OPERATIONS · LIVE OVERVIEW</span><h1>નમસ્કાર, {user.name.split(' ')[0]}</h1><p>આજના yard operations અને pending settlement ની સ્થિતિ.</p></div><div className="welcome-actions"><span className="role-pill"><ShieldCheck size={13}/>{roles[user.role]}</span><button className="btn ghost" onClick={load}><RefreshCw size={15}/> Refresh</button></div></div>
    {error&&<div className="inline-error"><AlertCircle size={16}/>{error}</div>}
    {loading&&!stats?<div className="loading-panel">Dashboard data લાવી રહ્યા છીએ…</div>:<>
      <div className="metrics-grid">
        <StatCard label="કુલ Lot" value={number(values.totalLots)} note="સર્વર પર નોંધાયેલ" icon={Package}/>
        <StatCard label="હરાજી માટે બાકી" value={number(values.arrived)} note="Gate entry પછી" icon={DoorOpen} tone="amber"/>
        <StatCard label="Auction completed" value={number(values.totalTickets)} note="Active price tickets" icon={Gavel} tone="blue"/>
        <StatCard label="Dispatch completed" value={number(values.dispatched)} note="Gate exit confirm" icon={Truck}/>
        <StatCard label="ખેડૂતને બાકી" value={money(values.farmerDue)} note="Farmer settlement balance" icon={Wallet} tone="amber"/>
        <StatCard label="વેપારી પાસેથી બાકી" value={money(values.traderDue)} note="Purchase collection" icon={Users} tone="blue"/>
        <StatCard label="Open complaints" value={number(values.openComplaints)} note="Investigation required" icon={AlertCircle} tone="red"/>
        <StatCard label="Active buyers" value={number(values.activeBuyers)} note="Registered trader master" icon={Users}/>
      </div>
      <div className="dashboard-grid">
        <section className="surface-card">
          <div className="section-title"><div><h2>તાજેતરની Gate Entries</h2><p>નવીનતમ arrival records</p></div><button className="text-btn" onClick={()=>onNavigate('gate')}>બધા જુઓ <ArrowRight size={14}/></button></div>
          <DataTable columns={pageConfig.gate.columns.slice(0,6)} rows={lots} compact empty="હજુ gate entry નથી."/>
        </section>
        <section className="surface-card finance-card"><div className="section-title"><div><h2>Financial Snapshot</h2><p>Settlement overview</p></div><Wallet size={19}/></div>
          <div className="finance-row"><span>Farmer payable</span><b>{money(values.farmerPayable)}</b></div>
          <div className="finance-row"><span>Farmer paid</span><b className="positive">{money(values.farmerPaid)}</b></div>
          <div className="finance-row"><span>Farmer outstanding</span><b className="attention">{money(values.farmerDue)}</b></div>
          <div className="finance-row"><span>Trader purchase due</span><b>{money(values.traderDue)}</b></div>
          <div className="finance-row"><span>Buyer-side dues pending</span><b>{money(Math.max(0,(values.buyerDues||0)-(values.buyerDuesPaid||0)))}</b></div>
          <button className="btn secondary full-width" onClick={()=>onNavigate('payments')}>Open settlement ledger <ArrowRight size={15}/></button>
        </section>
      </div>
      <section className="surface-card"><div className="section-title"><div><h2>Quick Actions</h2><p>તમારા role પ્રમાણે ઉપલબ્ધ કામ</p></div></div><div className="quick-actions">
        {navigation.filter(n=>n.id!=='dashboard'&&n.roles.includes(user.role)).slice(0,6).map(n=><button key={n.id} onClick={()=>onNavigate(n.id)}><n.icon size={19}/><span>{n.sub}</span><ArrowRight size={14}/></button>)}
      </div></section>
    </>}
  </div>;
}
