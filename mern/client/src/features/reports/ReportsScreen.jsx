import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Gavel, Package, ReceiptText, Users, Wallet, FileBarChart } from 'lucide-react';
import { labelFor, money, number } from '../../utils/format.js';
import { api } from '../../services/api.js';
import { StatCard } from '../../components/common/StatCard.jsx';
import { DataTable } from '../../components/common/DataTable.jsx';

export function ReportsScreen() {
  const [data,setData]=useState(null);const [from,setFrom]=useState(new Date().toISOString().slice(0,10));const [to,setTo]=useState(new Date().toISOString().slice(0,10));const [error,setError]=useState('');
  const run=useCallback(async()=>{setError('');try{setData(await api('/yard/reports/summary?from='+from+'&to='+to))}catch(e){setError(e.message)}},[from,to]);
  useEffect(()=>{run()},[run]);
  return <div className="page-stack"><div className="page-head"><div><span className="eyebrow">MANAGEMENT INFORMATION SYSTEM</span><h1>Reports & Analysis</h1><p>Selected date-range પર database-based operational report.</p></div></div>
    <section className="surface-card report-filter"><label className="field"><span>From</span><input type="date" value={from} onChange={e=>setFrom(e.target.value)}/></label><label className="field"><span>To</span><input type="date" value={to} onChange={e=>setTo(e.target.value)}/></label><button className="btn primary" onClick={run}><FileBarChart size={15}/> Generate report</button></section>
    {error&&<div className="inline-error"><AlertCircle size={15}/>{error}</div>}
    {data&&<><div className="metrics-grid">
      <StatCard label="Gate arrivals" value={number(data.lots)} note="Lots received in period" icon={Package}/>
      <StatCard label="Auction tickets" value={number(data.tickets)} note="Ticket issue date" icon={Gavel}/>
      <StatCard label="Sale bills" value={number(data.bills.bills)} note="Bills generated" icon={ReceiptText}/>
      <StatCard label="Gross sales" value={money(data.bills.gross)} note="Auction × net weight" icon={Wallet}/>
      <StatCard label="Farmer payable" value={money(data.bills.farmerPayable)} note="Approved bill amount" icon={Users}/>
      <StatCard label="Farmer paid" value={money(data.bills.farmerPaid)} note="Payment records" icon={CheckCircle2}/>
      <StatCard label="Complaints" value={number(data.complaints)} note="Complaints opened" icon={AlertCircle}/>
    </div><section className="surface-card"><div className="section-title"><div><h2>Payment collections by ledger</h2><p>Selected reporting period</p></div></div><DataTable columns={ [[' _id','Ledger type'],['count','Receipts'],['amount','Collected amount']] .map(([a,b])=>[a.trim(),b])} rows={data.payments.map(x=>({...x,_id:labelFor(x._id)}))} empty="આ સમયગાળામાં payment receipt નથી."/></section>
    <div className="notice-panel"><FileBarChart size={17}/> CSV exports માટે સંબંધિત module માં CSV button ઉપલબ્ધ છે. Excel/PDF financial statements માટે APMC-approved print templates હજી configure કરવાની રહેશે.</div></>}
  </div>;
}
