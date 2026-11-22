import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, ArrowRight, RefreshCw, Settings, ShieldCheck } from 'lucide-react';
import { api } from '../../services/api.js';
import { field } from '../yard/FormFields.jsx';

export function SettingsScreen({notify}) {
  const [value,setValue]=useState(null);const [busy,setBusy]=useState(false);const [error,setError]=useState('');
  const load=useCallback(async()=>{setError('');try{const data=await api('/yard/settings');setValue({...data.item,commodities:(data.item.commodities||[]).join('\n')})}catch(e){setError(e.message)}},[]);
  useEffect(()=>{load()},[load]);
  const set=(key,v)=>setValue(old=>({...old,[key]:v}));
  const save=async e=>{e.preventDefault();setBusy(true);setError('');try{
    const body={...value,commodities:value.commodities.split(/\r?\n|,/).map(x=>x.trim()).filter(Boolean)};
    for(const k of ['farmerPaymentDays','dispatchDays','defaultBuyerCreditDays','sellerApprovedDeduction','buyerMarketFee','buyerOtherDues'])body[k]=Number(body[k]);
    await api('/yard/settings',{method:'PATCH',body});notify('Yard settings સાચવાઈ.');await load();
  }catch(e){setError(e.message)}finally{setBusy(false)}};
  if(!value&&!error)return <div className="loading-panel">Settings લાવી રહ્યા છીએ…</div>;
  return <div className="page-stack"><div className="page-head"><div><span className="eyebrow">ADMINISTRATION</span><h1>Yard Configuration</h1><p>Master data, identifiers, deadlines અને APMC-approved fee rules.</p></div><button className="btn ghost" onClick={load}><RefreshCw size={15}/> Refresh</button></div>
    {error&&<div className="inline-error"><AlertCircle size={15}/>{error}</div>}
    {value&&<form className="surface-card settings-form" onSubmit={save}>
      <h2>Committee & Yard Identity</h2><div className="form-grid">
        {field('committeeName','Market committee name')&&<label className="field"><span>Market committee name</span><input value={value.committeeName||''} onChange={e=>set('committeeName',e.target.value)}/></label>}
        <label className="field"><span>Market yard code</span><input value={value.yardCode||''} onChange={e=>set('yardCode',e.target.value)}/></label>
        <label className="field"><span>Timezone</span><input value={value.timezone||'Asia/Kolkata'} onChange={e=>set('timezone',e.target.value)}/></label>
        <label className="field"><span>Ticket prefix</span><input value={value.ticketPrefix||''} onChange={e=>set('ticketPrefix',e.target.value)}/></label>
        <label className="field"><span>Bill prefix</span><input value={value.billPrefix||''} onChange={e=>set('billPrefix',e.target.value)}/></label>
        <label className="field"><span>Gate pass prefix</span><input value={value.passPrefix||''} onChange={e=>set('passPrefix',e.target.value)}/></label>
        <label className="field"><span>Complaint prefix</span><input value={value.complaintPrefix||''} onChange={e=>set('complaintPrefix',e.target.value)}/></label>
      </div><hr/>
      <h2>Yard Workflow Rules</h2><p className="form-description">આ defaults ને APMC resolution / approved bye-laws પ્રમાણે જ ગોઠવો; અહીં કોઈ statutory rule hard-code કરેલો નથી.</p><div className="form-grid">
        {[
          ['farmerPaymentDays','Farmer payment days'],['dispatchDays','Dispatch days'],['defaultBuyerCreditDays','Default trader credit days'],
          ['sellerApprovedDeduction','Approved seller deduction (₹ / bill)'],['buyerMarketFee','Buyer market fee (₹ / bill)'],['buyerOtherDues','Other buyer dues (₹ / bill)']
        ].map(([key,label])=><label className="field" key={key}><span>{label}</span><input type="number" min="0" step={key.toLowerCase().includes('days')?'1':'0.01'} value={value[key]??0} onChange={e=>set(key,e.target.value)}/></label>)}
      </div><hr/><h2>Commodity Master</h2><label className="field"><span>દરેક line માં એક પાકનું નામ</span><textarea rows={6} value={value.commodities||''} onChange={e=>set('commodities',e.target.value)}/></label>
      <div className="notice-panel"><ShieldCheck size={17}/> Fee, seller deductions, market operations deadlines અને statutory rules ને actual APMC bye-laws અને committee approval વિના production માં લાગુ ન કરશો.</div>
      <div className="form-actions"><button className="btn primary" disabled={busy}>{busy?'Saving…':'Save configuration'} <ArrowRight size={15}/></button></div>
    </form>}</div>;
}
