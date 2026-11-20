import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity, AlertCircle, ArrowDownToLine, ArrowLeft, ArrowRight, Bell, CheckCircle2,
  ChevronDown, CircleHelp, ClipboardList, DoorOpen, Gavel, LayoutDashboard, LogOut,
  Menu, Package, ReceiptText, RefreshCw, Scale, Search, Settings, ShieldCheck,
  Users, Wallet, X, FileBarChart, Truck, UserCog, Eye, Printer
} from 'lucide-react';
import { api, getSession, setSession, clearSession, money, number, dateTime } from './api.js';

const roles = {
  admin: 'Administrator',
  gate: 'Gate Operator',
  auction: 'Auction Operator',
  weighment: 'Weighment Operator',
  accounts: 'Accounts Officer',
  inspector: 'Inspector'
};
const navigation = [
  { id: 'dashboard', label: 'ડેશબોર્ડ', sub: 'Dashboard', icon: LayoutDashboard, roles: Object.keys(roles) },
  { id: 'gate', label: 'ગેટ એન્ટ્રી', sub: 'Gate Entry', icon: DoorOpen, roles: ['admin','gate','auction','weighment','accounts','inspector'] },
  { id: 'auction', label: 'હરાજી / ભાવ-કાપલી', sub: 'Auction & Tickets', icon: Gavel, roles: ['admin','auction','accounts','inspector'] },
  { id: 'weighment', label: 'વજન કાંટો', sub: 'Weighment', icon: Scale, roles: ['admin','weighment','accounts','inspector'] },
  { id: 'sales', label: 'વેચાણ બિલ', sub: 'Sale Bills', icon: ReceiptText, roles: ['admin','accounts','inspector'] },
  { id: 'payments', label: 'ચુકવણી', sub: 'Payments & Settlement', icon: Wallet, roles: ['admin','accounts'] },
  { id: 'buyerledger', label: 'વેપારી ખાતું', sub: 'Buyer Ledger & Credit', icon: Users, roles: ['admin','accounts'] },
  { id: 'gatepass', label: 'ગેટ પાસ / નિકાલ', sub: 'Gate Pass & Dispatch', icon: Truck, roles: ['admin','gate','inspector'] },
  { id: 'disputes', label: 'ફરિયાદ / વિવાદ', sub: 'Complaints', icon: CircleHelp, roles: Object.keys(roles) },
  { id: 'reports', label: 'રિપોર્ટ્સ', sub: 'Reports & MIS', icon: FileBarChart, roles: Object.keys(roles) },
  { id: 'audit', label: 'ઓડિટ ટ્રેલ', sub: 'Audit Trail', icon: Activity, roles: ['admin','inspector'] },
  { id: 'users', label: 'સ્ટાફ / યુઝર્સ', sub: 'Staff & Roles', icon: UserCog, roles: ['admin'] },
  { id: 'settings', label: 'સેટિંગ્સ', sub: 'Yard Settings', icon: Settings, roles: ['admin'] }
];

const pageConfig = {
  gate: {
    title: 'Gate Entry Register', subtitle: 'ખેડૂત / વેચનાર, પાક, વાહન અને yard arrival નો રેકોર્ડ.',
    endpoint: '/yard/lots', createLabel: 'નવી ગેટ એન્ટ્રી', createRoles: ['admin','gate'],
    columns: [
      ['lotNumber','LOT ID'],['farmerName','ખેડૂત / વેચનાર'],['sellerType','Seller type'],
      ['commodity','પાક'],['bags','બેગ'],['vehicle','વાહન નંબર'],['village','ગામ'],['status','Stage'],['arrivalAt','આવક સમય']
    ]
  },
  auction: {
    title: 'Auction & Digital Price Tickets', subtitle: 'ખુલ્લી હરાજી / e-auction નો સ્વીકારેલો ભાવ ticket સાથે lock કરો.',
    endpoint: '/yard/tickets', createLabel: 'નવી ભાવ-કાપલી', createRoles: ['admin','auction'],
    columns: [['ticketNumber','Ticket No.'],['lot.lotNumber','LOT ID'],['lot.farmerName','ખેડૂત'],['buyer.name','ખરીદદાર'],['quantity','જથ્થો (Q)'],['rate','ભાવ / Q'],['createdAt','Ticket સમય']]
  },
  weighment: {
    title: 'Weighbridge & Weighment', subtitle: 'Gross − tare = net. દરેક reading operator અને scale reference સાથે સાચવો.',
    endpoint: '/yard/weighments', createLabel: 'વજન નોંધો', createRoles: ['admin','weighment'],
    columns: [['lot.lotNumber','LOT ID'],['lot.farmerName','ખેડૂત'],['gross','Gross Q'],['tare','Tare Q'],['net','Net Q'],['scaleId','Scale ID'],['slipRef','Slip Ref'],['createdAt','સમય']]
  },
  sales: {
    title: 'Sale Bill Register', subtitle: 'Verified weighment અને auction ticket પરથી server-generated bill.',
    endpoint: '/yard/bills', columns: [
      ['billNumber','Bill No.'],['lot.lotNumber','LOT ID'],['farmerName','ખેડૂત'],['buyer.name','ખરીદદાર'],
      ['netWeight','Net Q'],['rate','ભાવ / Q'],['grossAmount','Gross રકમ'],['farmerNetPayable','ખેડૂત payable'],['status','સ્થિતિ']
    ]
  },
  payments: {
    title: 'Payments & Farmer Settlement', subtitle: 'Farmer settlement, trader purchase અને buyer-side dues અલગ ledgers માં નોંધો.',
    endpoint: '/yard/payments', createLabel: 'ચુકવણી નોંધો', createRoles: ['admin','accounts'],
    columns: [['receiptNumber','Receipt'],['bill.billNumber','Bill'],['type','Ledger type'],['amount','રકમ'],['mode','માધ્યમ'],['reference','UTR / Ref'],['receivedAt','ચુકવણી સમય']]
  },
  buyerledger: {
    title: 'Buyer Ledger & Credit Control', subtitle: 'Trader registration, approved purchase limit, credit days અને outstanding.',
    endpoint: '/yard/buyers', createLabel: 'નવો વેપારી', createRoles: ['admin','accounts'],
    columns: [['name','વેપારી'],['registrationNo','Licence / Reg ID'],['creditDays','Credit days'],['purchaseLimit','Purchase limit'],['ledger.gross','ખરીદ કિંમત'],['ledger.paid','ચૂકવેલ'],['active','Active']]
  },
  gatepass: {
    title: 'Gate Pass & Dispatch Control', subtitle: 'Farmer settlement અને buyer dues clear થયા પછી જ yard exit pass.',
    endpoint: '/yard/gate-passes', createLabel: 'Gate Pass issue કરો', createRoles: ['admin','gate'],
    columns: [['passNumber','Pass No.'],['lot.lotNumber','LOT ID'],['lot.farmerName','ખેડૂત'],['buyer.name','ખરીદદાર'],['vehicle','વાહન'],['status','સ્થિતિ'],['issuedAt','Issued'],['dispatchAt','Dispatch']]
  },
  disputes: {
    title: 'Complaint & Dispute Register', subtitle: 'વજન, ગુણવત્તા, auction rate અને payment dispute નું resolution trail.',
    endpoint: '/yard/complaints', createLabel: 'નવી ફરિયાદ', createRoles: Object.keys(roles),
    columns: [['complaintNumber','Complaint ID'],['complainant','ફરિયાદી'],['type','પ્રકાર'],['lot.lotNumber','LOT ID'],['status','સ્થિતિ'],['createdAt','નોંધ સમય']]
  },
  audit: {
    title: 'Append-only Audit Trail', subtitle: 'કોણે, ક્યારે અને કઈ business action કરી તેનો server-side record.',
    endpoint: '/yard/audit',
    columns: [['createdAt','Timestamp'],['actorName','User'],['role','Role'],['action','Action'],['resource','Module'],['resourceId','Reference'],['reason','Reason']]
  },
  users: {
    title: 'Staff & Role Administration', subtitle: 'દરેક employee ને અલગ login અને minimum required permissions આપો.',
    endpoint: '/yard/users', createLabel: 'નવો staff user', createRoles: ['admin'],
    columns: [['name','નામ'],['email','Email'],['role','Role'],['active','Active'],['lastLoginAt','Last login']]
  }
};

const field = (key,label,type='text',extra={}) => ({key,label,type,...extra});
const labelFor = value => ({
  arrived:'આવક નોંધાઈ',auctioned:'હરાજી પૂર્ણ',weighed:'તોલ પૂર્ણ',payment_pending:'ચુકવણી બાકી',
  part_paid:'આંશિક ચુકવણી',paid:'ચુકવણી પૂર્ણ',dispatched:'માલ રવાના',held:'Hold',
  open:'ખુલ્લી',investigating:'તપાસમાં',resolved:'ઉકેલાઈ',rejected:'નામંજૂર',
  farmer_settlement:'ખેડૂત ચુકવણી',buyer_purchase:'વેપારી ખરીદ',buyer_fee:'Buyer dues',
  open_outcry:'જાહેર હરાજી',e_auction:'e-Auction',approved_negotiated:'મંજૂર Negotiated'
}[value] || String(value ?? '—'));
const getPath = (obj,path) => path.split('.').reduce((v,k)=>v?.[k],obj);
const textValue = (value,key) => {
  if (value === null || value === undefined || value === '') return '—';
  if (key.toLowerCase().includes('amount') || ['grossAmount','farmerNetPayable','purchaseLimit','gross','rate','amount','ledger.gross','ledger.paid'].includes(key)) return money(value);
  if (key.toLowerCase().includes('at') || key === 'lastLoginAt') return dateTime(value);
  if (key === 'active') return value ? 'હા' : 'ના';
  if (key === 'sellerType') return value === 'trader' ? 'વેપારી' : 'ખેડૂત';
  if (key === 'status' || key === 'type' || key === 'role' || key === 'method') return labelFor(value);
  if (typeof value === 'number') return number(value);
  return String(value);
};

function Modal({title,children,onClose,wide=false}) {
  useEffect(()=>{const onKey=e=>e.key==='Escape'&&onClose();window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey)},[onClose]);
  return <div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&onClose()}>
    <section className={wide?'modal-card wide':'modal-card'} role="dialog" aria-modal="true">
      <header className="modal-heading"><div><span className="eyebrow">APMC YARDOS</span><h2>{title}</h2></div><button className="icon-btn" onClick={onClose} aria-label="Close"><X size={19}/></button></header>
      {children}
    </section>
  </div>;
}

function FormDialog({title,fields,initialValues={},onClose,onSubmit,submitLabel='સાચવો',busy=false}) {
  const initial = Object.fromEntries(fields.map(f=>[f.key,initialValues[f.key] === undefined ? (f.defaultValue ?? (f.type==='checkbox'?false:'')) : (f.type==='select' ? String(initialValues[f.key]) : initialValues[f.key])]));
  const [values,setValues] = useState(initial);
  const [error,setError] = useState('');
  const change=(key,value)=>setValues(old=>({...old,[key]:value}));
  const submit=async e=>{
    e.preventDefault();setError('');
    try{await onSubmit(values);onClose()}catch(err){setError(err.message)}
  };
  return <Modal title={title} onClose={onClose} wide>
    <form className="record-form" onSubmit={submit}>
      <div className="form-grid">
        {fields.map(f=><label className={f.full?'field full':'field'} key={f.key}>
          <span>{f.label}{f.required&&<em> *</em>}</span>
          {f.type==='textarea' ? <textarea rows={3} required={f.required} maxLength={f.maxLength} placeholder={f.placeholder||''} value={values[f.key]} onChange={e=>change(f.key,e.target.value)}/>
          : f.type==='select' ? <select required={f.required} value={values[f.key]} onChange={e=>change(f.key,e.target.value)}>
              <option value="">પસંદ કરો</option>{(f.options||[]).map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          : <input type={f.type==='number'?'number':f.type==='password'?'password':f.type==='email'?'email':'text'} required={f.required} min={f.min} max={f.max} step={f.step} maxLength={f.maxLength} placeholder={f.placeholder||''} value={values[f.key]} onChange={e=>change(f.key,f.type==='checkbox'?e.target.checked:e.target.value)}/>}
          {f.hint&&<small>{f.hint}</small>}
        </label>)}
      </div>
      {error&&<div className="inline-error"><AlertCircle size={15}/>{error}</div>}
      <div className="form-actions"><button type="button" className="btn ghost" onClick={onClose}>રદ કરો</button><button className="btn primary" disabled={busy}>{busy?'સાચવી રહ્યું છે…':submitLabel}<ArrowRight size={15}/></button></div>
    </form>
  </Modal>;
}

function Login({onLogin}) {
  const [email,setEmail]=useState('');const [password,setPassword]=useState('');const [busy,setBusy]=useState(false);const [error,setError]=useState('');
  const submit=async e=>{e.preventDefault();setBusy(true);setError('');try{const data=await api('/auth/login',{method:'POST',body:{email,password}});setSession(data);onLogin(data.user)}catch(err){setError(err.message)}finally{setBusy(false)}};
  return <main className="login-page">
    <div className="login-art"><div className="login-brand"><span className="brand-logo">A</span><div><b>APMC YardOS</b><small>Market Yard Digital Management</small></div></div><div className="login-message"><span className="eyebrow">SMART MARKET YARD</span><h1>એક જ વ્યવસ્થા.<br/>દરેક વ્યવહારનો<br/><i>વિશ્વસનીય રેકોર્ડ.</i></h1><p>Gate entry થી auction, weighment, settlement અને dispatch સુધી—એક connected workflow.</p></div><div className="login-foot">Secure staff access · Role-based operations</div></div>
    <div className="login-panel"><form className="login-form" onSubmit={submit}><span className="eyebrow">STAFF PORTAL</span><h2>Welcome back</h2><p>તમારા અધિકૃત APMC account થી sign in કરો.</p>
      <label className="field"><span>Email address</span><input type="email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@apmc.in"/></label>
      <label className="field"><span>Password</span><input type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="તમારો password"/></label>
      {error&&<div className="inline-error"><AlertCircle size={15}/>{error}</div>}
      <button className="btn primary login-submit" disabled={busy}>{busy?'Signing in…':'Sign in securely'}<ArrowRight size={16}/></button>
      <small className="login-help"><ShieldCheck size={14}/> Access is controlled by your assigned staff role.</small>
    </form></div>
  </main>;
}

function StatCard({label,value,note,icon:Icon,tone=''}) {
  return <article className="metric-card"><div className="metric-top"><span>{label}</span><span className={'metric-icon '+tone}><Icon size={18}/></span></div><strong>{value}</strong><small>{note}</small></article>;
}

function Dashboard({user,onNavigate}) {
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

function DataTable({columns,rows,onRowAction,actionLabel,compact=false,empty='કોઈ રેકોર્ડ મળ્યો નથી.'}) {
  if(!rows?.length)return <div className="empty-state"><div className="empty-icon"><ClipboardList size={23}/></div><b>{empty}</b><span>નવી એન્ટ્રી ઉમેરો અથવા search બદલો.</span></div>;
  return <div className="table-wrap"><table className={compact?'compact-table':''}><thead><tr>{columns.map(([key,label])=><th key={key}>{label}</th>)}{onRowAction&&<th>Action</th>}</tr></thead><tbody>{rows.map((item,index)=><tr key={item._id||item.id||index}>{columns.map(([key])=>{
    const value=getPath(item,key);
    const isStatus=key==='status'||key==='active';
    return <td key={key}>{isStatus?<span className={'status-pill '+(value==='paid'||value==='dispatched'||value==='resolved'||value===true?'good':value==='open'||value==='payment_pending'||value===false?'warn':'neutral')}>{textValue(value,key)}</span>:textValue(value,key)}</td>;
  })}{onRowAction&&<td><button className="row-action" onClick={()=>onRowAction(item)}>{actionLabel||'ખોલો'} <ArrowRight size={13}/></button></td>}</tr>)}</tbody></table></div>;
}

function FormFieldsFor(page,options) {
  if(page==='gate') return [
    field('sellerType','વેચનારનો પ્રકાર','select',{required:true,options:[{value:'farmer',label:'ખેડૂત'},{value:'trader',label:'વેપારી / Registered seller'}],defaultValue:'farmer'}),
    field('farmerName','ખેડૂત / વેચનારનું નામ','text',{required:true}),
    field('mobile','મોબાઇલ નંબર','text',{required:true,placeholder:'10 અંકનો નંબર'}),
    field('state','રાજ્ય','text',{defaultValue:'Gujarat'}),field('district','જિલ્લો'),field('taluka','તાલુકો'),field('village','ગામ'),
    field('farmerRegistryId','Farmer Registry ID'),field('landRecordType','Land record પ્રકાર','select',{options:['7/12','8A','Khasra / Khatauni','RTC / Pahani','Patta','RoR / Survey','Not available'].map(x=>({value:x,label:x}))}),
    field('landRecordNo','Survey / Land Record નંબર'),field('traderRegistrationNo','Trader Registration / Licence ID'),
    field('commodity','પાક / Commodity','select',{required:true,options:options.commodities||[]}),
    field('bags','બેગની સંખ્યા','number',{required:true,min:1,step:1,defaultValue:1}),field('vehicle','વાહન નંબર','text',{placeholder:'GJ-05-XX-0000'}),
    field('estimated','અંદાજિત વજન (Q)','number',{min:0,step:0.01,defaultValue:0}),field('quality','પ્રાથમિક ગુણવત્તા','select',{options:['FAQ','Grade A','Grade B','તપાસ બાકી'].map(x=>({value:x,label:x})),defaultValue:'FAQ'}),
    field('notes','નોંધ / વિશેષ ઓળખ','textarea',{full:true})
  ];
  if(page==='auction') return [
    field('lotId','Auction માટે Lot પસંદ કરો','select',{required:true,options:options.lots||[]}),
    field('buyerId','Registered buyer પસંદ કરો','select',{required:true,options:options.buyers||[]}),
    field('rate','હરાજી ભાવ (₹ / Q)','number',{required:true,min:0.01,step:0.01}),
    field('quantity','જથ્થો (Q)','number',{required:true,min:0.001,step:0.001}),
    field('quality','Quality / Grade','text',{defaultValue:'FAQ'}),
    field('method','હરાજી રીત','select',{options:[{value:'open_outcry',label:'જાહેર હરાજી'},{value:'e_auction',label:'e-Auction'},{value:'approved_negotiated',label:'Approved negotiated'}],defaultValue:'open_outcry'}),
    field('notes','Bid reference / નોંધ','textarea',{full:true})
  ];
  if(page==='weighment') return [
    field('lotId','Weighment માટે Lot','select',{required:true,options:options.lots||[]}),
    field('gross','Gross weight (Q)','number',{required:true,min:0.001,step:0.001}),
    field('tare','Tare weight (Q)','number',{required:true,min:0,step:0.001}),
    field('scaleId','Scale / Machine ID'),field('slipRef','Weighment slip reference'),
    field('correctionReason','Correction reason (admin only)','textarea',{full:true,hint:'પહેલાં weighment નોંધાયું હોય તો administrator માટે reason ફરજિયાત.'}),
    field('notes','Operator notes','textarea',{full:true})
  ];
  if(page==='payments') return [
    field('billId','Sale bill પસંદ કરો','select',{required:true,options:options.bills||[]}),
    field('type','ચુકવણીનો ledger','select',{required:true,options:[{value:'farmer_settlement',label:'Farmer settlement'},{value:'buyer_purchase',label:'Trader purchase collection'},{value:'buyer_fee',label:'Buyer-side fees / dues'}]}),
    field('amount','ચુકવણી રકમ (₹)','number',{required:true,min:0.01,step:0.01}),
    field('mode','માધ્યમ','select',{required:true,options:['NEFT','RTGS','IMPS','UPI','BANK_TRANSFER','CASH_APPROVED'].map(x=>({value:x,label:x}))}),
    field('reference','UTR / Transaction reference','text',{required:true}),field('notes','નોંધ','textarea',{full:true})
  ];
  if(page==='buyerledger') return [
    field('name','વેપારીનું નામ','text',{required:true}),field('registrationNo','APMC Registration / Licence ID','text',{required:true}),
    field('creditDays','Credit days','number',{required:true,min:0,max:90,step:1,defaultValue:5}),
    field('purchaseLimit','Maximum purchase outstanding (₹)','number',{min:0,step:1,defaultValue:0}),
    field('notes','નોંધ','textarea',{full:true})
  ];
  if(page==='gatepass') return [
    field('lotId','Dispatch માટે paid Lot','select',{required:true,options:options.lots||[]}),
    field('overrideReason','Deadline override reason (admin only)','textarea',{full:true,hint:'Dispatch deadline વટાવી હોય તો admin override માટે reason જરૂરી.'})
  ];
  if(page==='disputes') return [
    field('complainant','ફરિયાદીનું નામ','text',{required:true}),field('mobile','સંપર્ક નંબર'),
    field('type','ફરિયાદનો પ્રકાર','select',{required:true,options:['હરાજી દર અંગે','વજનમાં તફાવત','ગુણવત્તા અંગે','ચુકવણી વિલંબ','Gate / dispatch','અન્ય'].map(x=>({value:x,label:x}))}),
    field('lotId','Lot / Transaction link','select',{options:[{value:'',label:'Unlinked complaint'},...(options.lots||[])]}),
    field('details','ફરિયાદની વિગત','textarea',{required:true,full:true}),field('evidenceReferences','Evidence / slip reference','text',{full:true})
  ];
  if(page==='users') return [
    field('name','Staff name','text',{required:true}),field('email','Staff email','email',{required:true}),
    field('password','Temporary password','password',{required:true,hint:'Minimum 12 characters. Share securely, not over public chat.'}),
    field('role','Assigned role','select',{required:true,options:Object.entries(roles).map(([value,label])=>({value,label}))})
  ];
  return [];
}

function exportCsv(rows,columns,filename) {
  const csv=[columns.map(([,label])=>label),...rows.map(row=>columns.map(([key])=>getPath(row,key)??''))]
    .map(line=>line.map(value=>'"'+String(value).replace(/"/g,'""')+'"').join(',')).join('\r\n');
  const url=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url);
}

function ModuleScreen({page,user,notify}) {
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
    {detail&&<DetailModal detail={detail} onClose={()=>setDetail(null)}/>}
  </div>;
}

function DetailModal({detail,onClose}) {
  const {kind,data}=detail;
  let title='Transaction detail';
  if(kind==='lot')title='Lot traceability · '+data.item.lotNumber;
  if(kind==='ticket')title='Auction ticket · '+data.ticketNumber;
  if(kind==='bill')title='Sale statement · '+data.billNumber;
  if(kind==='complaint')title='Complaint case · '+data.complaintNumber;
  const item=kind==='lot'?data.item:data;
  const rows=kind==='lot'?[
    ['Seller',item.farmerName],['Mobile',item.mobile],['Commodity',item.commodity],['Quantity / bags',item.bags],
    ['Vehicle',item.vehicle],['Arrival',dateTime(item.arrivalAt)],['Status',labelFor(item.status)],
    ['Ticket',data.ticket?.ticketNumber],['Buyer',data.ticket?.buyer?.name],['Rate',data.ticket?money(data.ticket.rate)+' / Q':null],
    ['Gross / Tare / Net',data.weighments?.length?number(data.weighments.at(-1).gross)+' / '+number(data.weighments.at(-1).tare)+' / '+number(data.weighments.at(-1).net)+' Q':null],
    ['Bill',data.bill?.billNumber],['Farmer payable',data.bill?money(data.bill.farmerNetPayable):null],['Gate pass',data.pass?.passNumber]
  ]:kind==='ticket'?[
    ['Ticket number',item.ticketNumber],['Lot',item.lot?.lotNumber],['Farmer',item.lot?.farmerName],['Buyer',item.buyer?.name],
    ['Quantity',number(item.quantity)+' Q'],['Rate',money(item.rate)+' / Q'],['Gross value',money(item.quantity*item.rate)],['Issued at',dateTime(item.createdAt)]
  ]:kind==='complaint' ? [
    ['Complaint number',item.complaintNumber],['Complainant',item.complainant],['Type',item.type],['Lot',item.lot?.lotNumber],['Status',labelFor(item.status)],['Details',item.details],['Opened at',dateTime(item.createdAt)],['Resolution',item.resolution]
  ]:[
    ['Bill number',item.billNumber],['Lot',item.lot?.lotNumber],['Farmer',item.farmerName],['Buyer',item.buyer?.name],
    ['Net weight',number(item.netWeight)+' Q'],['Rate',money(item.rate)+' / Q'],['Gross amount',money(item.grossAmount)],
    ['Seller approved deduction',money(item.sellerDeduction)],['Farmer net payable',money(item.farmerNetPayable)],
    ['Farmer paid',money(item.farmerPaid)],['Farmer balance',money(item.farmerNetPayable-item.farmerPaid)],
    ['Trader purchase paid',money(item.buyerPurchasePaid)],['Buyer-side dues',money(item.buyerMarketFee+item.buyerOtherDues)]
  ];
  return <Modal title={title} onClose={onClose} wide><div className="detail-grid">{rows.filter(([,v])=>v!==undefined&&v!==null&&v!=='').map(([k,v])=><div className="detail-cell" key={k}><small>{k}</small><b>{v}</b></div>)}</div>
    {kind==='lot'&&<><h3 className="subsection-title">Transaction Timeline</h3><div className="timeline-list">{[['Gate entry',true],['Auction ticket',!!data.ticket],['Weighment',!!data.weighments?.length],['Sale bill',!!data.bill],['Farmer settlement',data.bill?.status==='paid'],['Gate pass',!!data.pass],['Dispatch',data.pass?.status==='dispatched']].map(([name,done])=><div key={name}><span className={done?'timeline-dot done':'timeline-dot'}/><b>{name}</b><small>{done?'Completed':'Pending'}</small></div>)}</div></>}
    <div className="form-actions"><button className="btn ghost" onClick={onClose}>Close</button><button className="btn primary" onClick={()=>window.print()}><Printer size={15}/> Print</button></div>
  </Modal>;
}

function SettingsScreen({notify}) {
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

function ReportsScreen() {
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

function Workspace({user,onLogout,notify}) {
  const [page,setPage]=useState('dashboard');const [mobileMenu,setMobileMenu]=useState(false);const [search,setSearch]=useState('');
  const accessible=navigation.filter(n=>n.roles.includes(user.role));
  const selected=navigation.find(n=>n.id===page)||navigation[0];
  const goto=id=>{setPage(id);setMobileMenu(false);setSearch('')};
  return <div className="app-layout">
    {mobileMenu&&<button className="mobile-overlay" onClick={()=>setMobileMenu(false)} aria-label="Close menu"/>}
    <aside className={'sidebar '+(mobileMenu?'sidebar-open':'')}>
      <div className="sidebar-brand"><span className="brand-logo">A</span><div><b>APMC YardOS</b><small>Digital Management</small></div><button className="icon-btn sidebar-close" onClick={()=>setMobileMenu(false)}><X size={18}/></button></div>
      <div className="yard-tag">MARKET YARD · OPERATIONS</div>
      <nav className="side-nav">{accessible.map(item=><button key={item.id} className={page===item.id?'nav-link active':'nav-link'} onClick={()=>goto(item.id)}><item.icon size={18}/><span><b>{item.label}</b><small>{item.sub}</small></span>{page===item.id&&<i/>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="user-mini"><span className="user-avatar">{user.name.slice(0,1).toUpperCase()}</span><div><b>{user.name}</b><small>{roles[user.role]}</small></div></div><button onClick={onLogout} className="logout-btn"><LogOut size={16}/> Sign out</button></div>
    </aside>
    <main className="workspace-main">
      <header className="topbar"><button className="icon-btn mobile-trigger" onClick={()=>setMobileMenu(true)}><Menu size={20}/></button><div className="breadcrumb"><span>APMC YardOS</span><i>/</i><b>{selected.sub}</b></div><div className="topbar-right"><span className="server-indicator"><i/> Authenticated</span><span className="top-user">{user.name}</span><span className="user-avatar small">{user.name.slice(0,1).toUpperCase()}</span><button onClick={onLogout} className="icon-btn desktop-logout" title="Sign out"><LogOut size={17}/></button></div></header>
      <div className="workspace-content">
        {page==='dashboard'?<Dashboard user={user} onNavigate={goto}/>
        :page==='settings'?<SettingsScreen notify={notify}/>
        :page==='reports'?<ReportsScreen/>
        :<ModuleScreen page={page} user={user} notify={notify}/>}
        <footer className="app-footer">APMC YardOS · Operational records are stored on the configured server database.</footer>
      </div>
    </main>
  </div>;
}

export default function App() {
  const [session,setSessionState]=useState(()=>getSession());
  const [user,setUser]=useState(()=>getSession()?.user||null);
  const [checking,setChecking]=useState(Boolean(getSession()?.token));
  const [toast,setToast]=useState(null);
  useEffect(()=>{
    const expired=()=>{setSessionState(null);setUser(null);setChecking(false);setToast({message:'Session expired. Please sign in again.',type:'error'});};
    window.addEventListener('apmc:auth-expired',expired);
    return()=>window.removeEventListener('apmc:auth-expired',expired);
  },[]);
  useEffect(()=>{
    if(!session?.token){setChecking(false);return;}
    let active=true;
    api('/auth/me').then(data=>{if(active)setUser(data.user)}).catch(()=>{if(active){setUser(null);setSessionState(null)}}).finally(()=>{if(active)setChecking(false)});
    return()=>{active=false};
  },[]);
  const notify=(message,type='success')=>{setToast({message,type});window.setTimeout(()=>setToast(null),3500)};
  const login=userData=>{setUser(userData);setSessionState(getSession());notify('સફળતાપૂર્વક sign in થયું.')};
  const logout=()=>{clearSession();setSessionState(null);setUser(null);notify('તમે sign out થયા.')};
  if(checking)return <div className="boot-screen"><span className="brand-logo">A</span><b>APMC YardOS</b><small>Secure workspace loading…</small></div>;
  return <>{user?<Workspace user={user} onLogout={logout} notify={notify}/>:<Login onLogin={login}/>}
    {toast&&<div className={'toast-message '+(toast.type==='error'?'toast-error':'')}><span>{toast.type==='error'?<AlertCircle size={16}/>:<CheckCircle2 size={16}/>}</span>{toast.message}</div>}
  </>;
}
