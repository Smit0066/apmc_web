import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowDownToLine, RefreshCw, Scale, Search, Wallet, Truck } from 'lucide-react';
import { roles } from '../../constants/roles.js';
import { pageConfig } from '../../constants/pageConfig.js';
import { labelFor, money, number } from '../../utils/format.js';
import { exportCsv } from '../../utils/csv.js';
import { api } from '../../services/api.js';
import { FormDialog } from '../../components/common/FormDialog.jsx';
import { DataTable } from '../../components/common/DataTable.jsx';
import { FormFieldsFor, field } from './FormFields.jsx';
import { DetailModal } from './DetailModal.jsx';

export function ModuleScreen({page,user,notify}) {
  const cfg=pageConfig[page];const [rows,setRows]=useState([]);const [options,setOptions]=useState({});const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');const [query,setQuery]=useState('');const [formOpen,setFormOpen]=useState(false);const [busy,setBusy]=useState(false);const [pageNum,setPageNum]=useState(1);const [total,setTotal]=useState(0);
  const [detail,setDetail]=useState(null);const [editRow,setEditRow]=useState(null);
  const load=useCallback(async()=>{
    setLoading(true);setError('');
    try{
      const paged = cfg.endpoint + '?page=' + pageNum + '&limit=25' + (query && ['gate','sales','buyerledger'].includes(page) ? '&search=' + encodeURIComponent(query) : '');
      const [data,...extra]=await (async()=>{
        if(page==='auction')return Promise.all([api('/yard/tickets?page='+pageNum+'&limit=25'),api('/yard/lots?status=arrived&limit=100'),api('/yard/buyers?active=true&limit=100')]);
        if(page==='weighment')return Promise.all([api('/yard/weighments?page='+pageNum+'&limit=25'),api('/yard/lots?limit=100')]);
        if(page==='payments')return Promise.all([api('/yard/payments?page='+pageNum+'&limit=25'),api('/yard/bills?limit=100')]);
        if(page==='gatepass')return Promise.all([api('/yard/gate-passes?page='+pageNum+'&limit=25'),api('/yard/lots?status=paid&limit=100')]);
        if(page==='disputes')return Promise.all([api('/yard/complaints?page='+pageNum+'&limit=25'),api('/yard/lots?limit=100')]);
        if(page==='gate')return Promise.all([api(paged),api('/yard/settings')]);
        return [await api(paged)];
      })();
      const source=data.items||[];
      setRows(source);setTotal(Number(data.total ?? source.length));
      if(page==='auction')setOptions({lots:extra[0].items.map(x=>({value:x._id,label:x.lotNumber+' · '+x.farmerName+' · '+x.commodity})),buyers:extra[1].items.filter(x=>x.active).map(x=>({value:x._id,label:x.name+' · '+x.registrationNo}))});
      if(page==='weighment')setOptions({lots:extra[0].items.filter(x=>['auctioned','weighed'].includes(x.status)).map(x=>({value:x._id,label:x.lotNumber+' · '+x.farmerName+' · '+labelFor(x.status)}))});
      if(page==='payments')setOptions({bills:extra[0].items.filter(x=>x.status!=='cancelled').map(x=>({value:x._id,label:x.billNumber+' · '+x.farmerName+' · payable '+money(x.farmerNetPayable)}))});
      if(page==='gatepass')setOptions({lots:extra[0].items.map(x=>({value:x._id,label:x.lotNumber+' · '+x.farmerName+' · '+number(x.netWeight)+' Q'}))});
      if(page==='disputes')setOptions({lots:extra[0].items.map(x=>({value:x._id,label:x.lotNumber+' · '+x.farmerName}))});
      if(page==='gate')setOptions({commodities:(extra[0].item?.commodities||extra[0].commodities||[]).map(x=>({value:x,label:x}))});
    }catch(e){setError(e.message)}finally{setLoading(false)}
  },[page,cfg.endpoint,pageNum,query]);
  useEffect(()=>{load()},[load]);
  const filtered=useMemo(()=>query && !['gate','sales','buyerledger'].includes(page) ? rows.filter(item=>JSON.stringify(item).toLowerCase().includes(query.toLowerCase())) : rows,[rows,query,page]);
  const fields = page==='users' && editRow ? [
    field('role','Assigned role','select',{required:true,options:Object.entries(roles).map(([value,label])=>({value,label}))}),
    field('active','Account status','select',{required:true,options:[{value:'true',label:'Active'},{value:'false',label:'Inactive'}]}),
    field('password','Reset password (optional)','password',{required:false,hint:'Leave blank to keep the current password. New password must be at least 12 characters.'})
  ] : FormFieldsFor(page,options);
  const create=async values=>{
    setBusy(true);
    try{
      if(page==='gatepass')await api('/yard/gate-passes/'+values.lotId+'/issue',{method:'POST',body:{overrideReason:values.overrideReason}});
      else if(page==='buyerledger' && editRow) await api('/yard/buyers/'+editRow._id,{method:'PATCH',body:values});
      else if(page==='users' && editRow) await api('/yard/users/'+editRow._id,{method:'PATCH',body:values});
      else await api(cfg.endpoint,{method:'POST',body:values});
      notify(editRow?'વેપારીની વિગતો update થઈ.':'રેકોર્ડ સફળતાપૂર્વક સાચવાયો.');
      setEditRow(null); await load();
    }finally{setBusy(false)}
  };
  const rowAction=async item=>{
    try{
      if(page==='gate'){const detailData=await api('/yard/lots/'+item._id);setDetail({kind:'lot',data:detailData});return;}
      if(page==='auction'){setDetail({kind:'ticket',data:item});return;}
      if(page==='sales'){setDetail({kind:'bill',data:item});return;}
      if(page==='gatepass'&&item.status==='issued'){
        if(!window.confirm('આ vehicle નો yard exit confirm કરવો છે?'))return;
        await api('/yard/gate-passes/'+item._id+'/dispatch',{method:'POST',body:{}});
        notify('Vehicle exit record નોંધાયો.');await load();return;
      }
      if(page==='disputes'){
        if(!['admin','inspector'].includes(user.role)){setDetail({kind:'complaint',data:item});return;}
        const nextStatus=item.status==='open'?'investigating':'resolved';
        let resolution='';
        if(nextStatus==='resolved'){resolution=window.prompt('ફરિયાદ ઉકેલવાનો reason લખો (ફરજિયાત):')||'';if(resolution.trim().length<3)return;}
        await api('/yard/complaints/'+item._id,{method:'PATCH',body:{status:nextStatus,...(resolution?{resolution}: {})}});
        notify('Complaint status update થયો.');await load();return;
      }
      if(page==='buyerledger'){setEditRow(item);setFormOpen(true);return;}
      if(page==='users'){
        if(String(item._id)===String(user.id)){notify('તમારા પોતાના account ની role/status બદલી શકાતી નથી.','error');return;}
        setEditRow(item);setFormOpen(true);return;
      }
    }catch(e){notify(e.message,'error')}
  };
  const onExport=async()=>{
    try {
      const all=[];
      let current=1, pageTotal=1;
      do {
        const url=cfg.endpoint+'?page='+current+'&limit=100'+(query&&['gate','sales','buyerledger'].includes(page)?'&search='+encodeURIComponent(query):'');
        const response=await api(url);
        all.push(...(response.items||[]));
        pageTotal=Math.max(1,Math.ceil(Number(response.total??all.length)/100));
        current++;
      } while(current<=pageTotal && current<=100);
      exportCsv(all,cfg.columns,(page==='gate'?'apmc-lot-register':page)+'-export.csv');
      notify('CSV export તૈયાર છે ('+all.length+' records).');
    } catch(error) { notify(error.message,'error'); }
  };
  return <div className="page-stack">
    <div className="page-head"><div><span className="eyebrow">YARD OPERATIONS · {cfg.endpoint.toUpperCase()}</span><h1>{cfg.title}</h1><p>{cfg.subtitle}</p></div><div className="page-actions">
      {cfg.createLabel&&cfg.createRoles.includes(user.role)&&<button className="btn primary" onClick={()=>setFormOpen(true)}>＋ {cfg.createLabel}</button>}
      <button className="btn ghost" onClick={load}><RefreshCw size={15}/> Refresh</button>
      <button className="btn ghost" onClick={onExport} disabled={!rows.length}><ArrowDownToLine size={15}/> CSV</button>
    </div></div>
    <section className="surface-card">
      <div className="table-toolbar"><div className="table-info"><b>{cfg.title}</b><span>{filtered.length} records · Server database</span></div><label className="search-box"><Search size={15}/><input placeholder="રેકોર્ડ શોધો..." value={query} onChange={e=>{setQuery(e.target.value);setPageNum(1)}}/></label></div>
      {error&&<div className="inline-error"><AlertCircle size={15}/>{error}</div>}
      {loading?<div className="loading-panel"><RefreshCw className="spin" size={17}/> Records લાવી રહ્યા છીએ…</div>
      :<><DataTable columns={cfg.columns} rows={filtered} onRowAction={['gate','auction','sales','gatepass','disputes','users','buyerledger'].includes(page)?rowAction:null} actionLabel={page==='gatepass'?'Exit confirm':page==='disputes'?'Review / Resolve':page==='users'?'Edit role / access':page==='buyerledger'?'Edit credit':'વિગત'}/>
        {total>25&&<div className="pagination"><span>{(pageNum-1)*25+1}–{Math.min(pageNum*25,total)} of {total} records</span><div><button className="btn ghost" disabled={pageNum<=1} onClick={()=>setPageNum(v=>Math.max(1,v-1))}>Previous</button><button className="btn ghost" disabled={pageNum>=Math.ceil(total/25)} onClick={()=>setPageNum(v=>v+1)}>Next</button></div></div>}
      </>}
    </section>
    {page==='weighment'&&<div className="notice-panel"><Scale size={17}/> Scale hardware હજુ connect નથી. હાલ certified machine reading ને operator manually દાખલ કરે છે; productionમાં device protocol, calibration certificate અને signed slip verification જોઈએ.</div>}
    {page==='payments'&&<div className="notice-panel"><Wallet size={17}/> Payment entry actual money transfer કરતી નથી. UTR / external transaction reference verify કર્યા પછી જ receipt નોંધો.</div>}
    {page==='gatepass'&&<div className="notice-panel"><Truck size={17}/> Statutory transit permit અલગ requirement હોઈ શકે છે. આ module yard exit control record આપે છે; APMC-approved permit processનું replacement નથી.</div>}
    {formOpen&&<FormDialog title={editRow?(page==='users'?'Staff role / access સુધારો':'વેપારી credit policy સુધારો'):cfg.createLabel} fields={fields} initialValues={editRow||{}} onClose={()=>{setFormOpen(false);setEditRow(null)}} onSubmit={create} busy={busy} submitLabel="સાચવો"/>}
    {detail&&<DetailModal detail={detail} user={user} onClose={()=>setDetail(null)} onVoidTicket={async(ticket,reason)=>{await api('/yard/tickets/'+ticket._id+'/void',{method:'POST',body:{reason}});notify('Auction ticket cancel થઈ. Lot ફરી auction queue માં ઉપલબ્ધ છે.');setDetail(null);await load();}}/>}
  </div>;
}
