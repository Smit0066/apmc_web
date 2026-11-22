import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Gavel, Package, ReceiptText, Users, Wallet, FileBarChart } from 'lucide-react';
import { labelFor, money, number } from '../../utils/format.js';
import { api, downloadFile } from '../../services/api.js';
import { StatCard } from '../../components/common/StatCard.jsx';
import { DataTable } from '../../components/common/DataTable.jsx';

const REPORTS = [['lots','Gate arrival register','Excel / CSV','lots'],['tickets','Auction & ticket register','Ticket-wise','tickets'],['weighments','Weighment register','Gross / tare / net','weighments'],['bills','Sale & settlement','Gross / deductions / net','bills'],['payments','Payment ledger','UTR / receipts','payments'],['complaints','Complaint register','Ageing / resolution','complaints'],['audit','Audit trail','Actor / timestamp','audit']];

export function ReportsScreen({user,notify}) {
  const [catalog,setCatalog]=useState(null);
  useEffect(()=>{api('/yard/reports/catalog').then(setCatalog).catch(()=>{})},[]);
  const reports=REPORTS.filter(r=>r[0]!=='audit'||['admin','inspector'].includes(user?.role));
  const exportOne=async key=>{try{await downloadFile('/yard/reports/export/'+key,key+'.csv');notify?.('CSV export તૈયાર છે.')}catch(e){notify?.(e.message,'error')}};
  const exportAll=async()=>{for(const [key] of reports){await exportOne(key);await new Promise(r=>setTimeout(r,350))}};
  const [data,setData]=useState(null);const [from,setFrom]=useState(new Date().toISOString().slice(0,10));const [to,setTo]=useState(new Date().toISOString().slice(0,10));const [error,setError]=useState('');
  const run=useCallback(async()=>{setError('');try{setData(await api('/yard/reports/summary?from='+from+'&to='+to))}catch(e){setError(e.message)}},[from,to]);
  useEffect(()=>{run()},[run]);
  return <div className="page-stack"><div className="page-head"><div><span className="eyebrow">MANAGEMENT INFORMATION SYSTEM</span><h1>Reports & Analysis</h1><p>Selected date-range પર database-based operational report.</p></div><div className="page-actions"><button className="btn primary" onClick={exportAll}>બધા ડેટા Export</button></div></div>
    {catalog&&<><div className="metrics-grid"><StatCard label="કુલ lot" value={number(catalog.counts.lots)} note="Arrival register" icon={Package}/><StatCard label="હરાજી ભાવ સરેરાશ" value={money(catalog.kpis.averageRate)} note="પ્રતિ ક્વિન્ટલ" icon={Gavel} tone="blue"/><StatCard label="Gross sale value" value={money(catalog.kpis.grossSales)} note="Sale bill register" icon={ReceiptText}/><StatCard label="Pending payable" value={money(catalog.kpis.pendingPayable)} note="Farmer settlement" icon={Wallet} tone="amber"/></div>
    <section className="surface-card"><div className="section-title"><div><h2>રિપોર્ટ સેન્ટર</h2><p>પસંદગીનો report CSVમાં export કરો</p></div></div><div className="table-wrap"><table><thead><tr><th>રિપોર્ટ</th><th>Records</th><th>મુખ્ય વિગત</th><th></th></tr></thead><tbody>{reports.map(([key,label,detail,countKey])=><tr key={key}><td>{label}</td><td>{number(catalog.counts[countKey])}</td><td>{detail}</td><td><button className="row-action" onClick={()=>exportOne(key)}>CSV export</button></td></tr>)}</tbody></table></div></section></>}
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
