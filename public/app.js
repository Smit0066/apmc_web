(() => {
"use strict";
const STORE = "yardos_demo_v1";
const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const rupee = n => "₹" + Number(n || 0).toLocaleString("en-IN",{maximumFractionDigits:2});
const num = n => Number(n || 0).toLocaleString("en-IN",{maximumFractionDigits:2});
const today = () => new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});
const now = () => new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"});
const uid = (prefix) => prefix + "-" + Math.random().toString(36).slice(2,7).toUpperCase();
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const money = n => rupee(Math.round(Number(n || 0)));
const fmtWeight = n => num(n) + " ક્વિન્ટલ";
const statusMeta = {
  arrived:["આવક નોંધાઈ","info"], auctioned:["હરાજી પૂર્ણ","success"], weighed:["તોલ પૂર્ણ","info"],
  payment_pending:["ચુકવણી બાકી","warning"], paid:["ચુકવણી પૂર્ણ","success"], dispatched:["માલ રવાના","neutral"],
  open:["ખુલ્લી","warning"], investigating:["તપાસમાં","info"], resolved:["ઉકેલાઈ","success"]
};
const seed = () => ({
  nextLot: 126, nextTicket: 48, nextBill: 29, nextPass: 18, nextComplaint: 12,
  language:"gu", role:"Administrator",
  commodities:["ઘઉં","કપાસ","જીરું","મગફળી","ડાંગર","બાજરી","ડુંગળી","લીલા શાકભાજી"],
  buyers:["શ્રી ગણેશ ટ્રેડર્સ","પટેલ એગ્રો","મહાવીર કમિશન એજન્ટ","જય અંબે ટ્રેડર્સ","કૃષ્ણા ટ્રેડર્સ"],
  deductions:{sellerApproved:0,buyerMarketFee:0,buyerOther:0},
  lots:[
    {id:"LOT-261103-125",farmer:"રમેશભાઈ ચૌધરી",mobile:"98795 12041",village:"કામરેજ",commodity:"કપાસ",bags:42,vehicle:"GJ-05-AB-4821",arrival:"08:42",status:"arrived",quality:"FAQ",estimated:18.5},
    {id:"LOT-261103-124",farmer:"મહેશભાઈ પટેલ",mobile:"98251 44320",village:"ઓલપાડ",commodity:"મગફળી",bags:35,vehicle:"GJ-19-CC-1108",arrival:"08:18",status:"auctioned",quality:"FAQ",estimated:22,ticketNo:"APMC-26-00047",buyer:"શ્રી ગણેશ ટ્રેડર્સ",rate:6250,provisional:137500},
    {id:"LOT-261103-123",farmer:"કિરીટભાઈ વસાવા",mobile:"98980 34567",village:"બારડોલી",commodity:"ઘઉં",bags:28,vehicle:"GJ-05-XY-2290",arrival:"07:56",status:"payment_pending",quality:"FAQ",estimated:15.2,net:14.82,ticketNo:"APMC-26-00046",buyer:"પટેલ એગ્રો",rate:2480,billNo:"SB-26-00028",gross:36754,netPayable:36754,paid:0},
    {id:"LOT-261103-122",farmer:"દિપકભાઈ ગામીત",mobile:"97244 87650",village:"માંડવી",commodity:"જીરું",bags:19,vehicle:"GJ-05-PP-5571",arrival:"07:40",status:"paid",quality:"FAQ",estimated:9.5,net:9.26,ticketNo:"APMC-26-00045",buyer:"મહાવીર કમિશન એજન્ટ",rate:21800,billNo:"SB-26-00027",gross:201868,netPayable:198868,paid:198868,paymentRef:"UTR202611030820",passNo:"GP-26-00017"},
    {id:"LOT-261103-121",farmer:"શૈલેષભાઈ રાઠોડ",mobile:"98989 22334",village:"પલસાણા",commodity:"ડાંગર",bags:50,vehicle:"GJ-05-MN-9912",arrival:"07:22",status:"dispatched",quality:"FAQ",estimated:25,net:24.7,ticketNo:"APMC-26-00044",buyer:"જય અંબે ટ્રેડર્સ",rate:2320,billNo:"SB-26-00026",gross:57304,netPayable:56304,paid:56304,paymentRef:"UTR202611030701",passNo:"GP-26-00016"},
    {id:"LOT-261103-120",farmer:"પ્રવિણભાઈ દેસાઈ",mobile:"98256 11109",village:"ચોર્યાસી",commodity:"ડુંગળી",bags:61,vehicle:"GJ-05-RT-6578",arrival:"07:04",status:"arrived",quality:"Grade A",estimated:30}
  ],
  tickets:[
    {ticketNo:"APMC-26-00047",lotId:"LOT-261103-124",farmer:"મહેશભાઈ પટેલ",buyer:"શ્રી ગણેશ ટ્રેડર્સ",commodity:"મગફળી",quality:"FAQ",bags:35,quantity:22,rate:6250,created:"08:36",date:"03 Nov 2026",createdBy:"હરાજી ઓપરેટર"},
    {ticketNo:"APMC-26-00046",lotId:"LOT-261103-123",farmer:"કિરીટભાઈ વસાવા",buyer:"પટેલ એગ્રો",commodity:"ઘઉં",quality:"FAQ",bags:28,quantity:15.2,rate:2480,created:"08:02",date:"03 Nov 2026",createdBy:"હરાજી ઓપરેટર"},
    {ticketNo:"APMC-26-00045",lotId:"LOT-261103-122",farmer:"દિપકભાઈ ગામીત",buyer:"મહાવીર કમિશન એજન્ટ",commodity:"જીરું",quality:"FAQ",bags:19,quantity:9.5,rate:21800,created:"07:46",date:"03 Nov 2026",createdBy:"હરાજી ઓપરેટર"},
    {ticketNo:"APMC-26-00044",lotId:"LOT-261103-121",farmer:"શૈલેષભાઈ રાઠોડ",buyer:"જય અંબે ટ્રેડર્સ",commodity:"ડાંગર",quality:"FAQ",bags:50,quantity:25,rate:2320,created:"07:29",date:"03 Nov 2026",createdBy:"હરાજી ઓપરેટર"}
  ],
  bills:[
    {billNo:"SB-26-00028",lotId:"LOT-261103-123",farmer:"કિરીટભાઈ વસાવા",buyer:"પટેલ એગ્રો",weight:14.82,rate:2480,gross:36754,deductions:0,net:36754,status:"payment_pending"},
    {billNo:"SB-26-00027",lotId:"LOT-261103-122",farmer:"દિપકભાઈ ગામીત",buyer:"મહાવીર કમિશન એજન્ટ",weight:9.26,rate:21800,gross:201868,deductions:0,net:201868,status:"paid",paid:201868,buyerMarketFee:0,buyerOther:0,buyerFeePaid:0,buyerTotalDue:0,buyerFeeStatus:"paid"},
    {billNo:"SB-26-00026",lotId:"LOT-261103-121",farmer:"શૈલેષભાઈ રાઠોડ",buyer:"જય અંબે ટ્રેડર્સ",weight:24.7,rate:2320,gross:57304,deductions:0,net:57304,status:"paid",paid:57304,buyerMarketFee:0,buyerOther:0,buyerFeePaid:0,buyerTotalDue:0,buyerFeeStatus:"paid"}
  ],
  complaints:[
    {id:"CMP-26-00011",lotId:"LOT-261103-123",type:"વજનમાં તફાવત",by:"કિરીટભાઈ વસાવા",details:"ખેડૂત પાસે રહેલી slip અને scale ticket વચ્ચે 0.18 ક્વિન્ટલનો તફાવત.",status:"open",date:"03 Nov 2026"},
    {id:"CMP-26-00010",lotId:"LOT-261103-124",type:"હરાજી દર અંગે",by:"મહેશભાઈ પટેલ",details:"જાહેર કરેલો ભાવ અને ticket પરનો ભાવ ફરીથી ચકાસવા વિનંતી.",status:"investigating",date:"03 Nov 2026"},
    {id:"CMP-26-00009",lotId:"LOT-261103-120",type:"ગુણવત્તા અંગે",by:"પ્રવિણભાઈ દેસાઈ",details:"Grade A નોંધવા અંગે તપાસ.",status:"open",date:"03 Nov 2026"},
    {id:"CMP-26-00008",lotId:"LOT-261103-119",type:"ચુકવણી વિલંબ",by:"અશોકભાઈ પટેલ",details:"બેંક રેફરન્સની પુષ્ટિ બાકી.",status:"resolved",date:"02 Nov 2026"}
  ],
  audit:[
    {time:"09:12:44",actor:"પ્રશાસક",action:"ડેમો ડેશબોર્ડ ખોલ્યું",ref:"SYSTEM"},
    {time:"08:42:10",actor:"ગેટ ઓપરેટર",action:"ગેટ એન્ટ્રી નોંધાઈ",ref:"LOT-261103-125"},
    {time:"08:36:22",actor:"હરાજી ઓપરેટર",action:"હરાજી ભાવ-કાપલી બનાવી",ref:"APMC-26-00047"},
    {time:"08:18:05",actor:"ગેટ ઓપરેટર",action:"ગેટ એન્ટ્રી નોંધાઈ",ref:"LOT-261103-124"},
    {time:"08:02:50",actor:"હરાજી ઓપરેટર",action:"હરાજી ભાવ-કાપલી બનાવી",ref:"APMC-26-00046"},
    {time:"07:58:13",actor:"તોલ કાંટા ઓપરેટર",action:"નેટ વજન નોંધ્યું",ref:"LOT-261103-123"},
    {time:"07:50:06",actor:"એકાઉન્ટ્સ",action:"Sale bill જનરેટ કર્યું",ref:"SB-26-00028"}
  ]
});
let data;
try { data = JSON.parse(localStorage.getItem(STORE)) || seed(); } catch(e){ data=seed(); }
if(!data || !Array.isArray(data.lots)) data=seed();
if(!data.deductions || !Object.prototype.hasOwnProperty.call(data.deductions,"sellerApproved")) data.deductions={sellerApproved:0,buyerMarketFee:0,buyerOther:0};
data.bills.forEach(b=>{if(b.buyerMarketFee===undefined)b.buyerMarketFee=0;if(b.buyerOther===undefined)b.buyerOther=0;if(b.buyerFeePaid===undefined)b.buyerFeePaid=0;if(b.buyerTotalDue===undefined)b.buyerTotalDue=b.buyerMarketFee+b.buyerOther;if(!b.buyerFeeStatus)b.buyerFeeStatus=b.buyerTotalDue>0?"payment_pending":"paid";});
let currentView = "dashboard", ticketForPrint = null, activeFilter = "all", searchTerm = "";
const root = $("#viewRoot"), modal = $("#modalBackdrop"), modalBody = $("#modalBody");
function save(){ try{localStorage.setItem(STORE,JSON.stringify(data));}catch(e){} }
function log(action,ref){ data.audit.unshift({time:now()+":00",actor:roleLabel(),action,ref}); data.audit=data.audit.slice(0,150); save(); }
function roleLabel(){return ({Administrator:"પ્રશાસક",Gate:"ગેટ ઓપરેટર",Auction:"હરાજી ઓપરેટર",Weighment:"તોલ ઓપરેટર",Accounts:"એકાઉન્ટ્સ",Inspector:"નિરીક્ષક"})[data.role]||"પ્રશાસક";}
function allowed(action){const rules={settings:["Administrator"],audit:["Administrator","Inspector"],payments:["Administrator","Accounts"],sales:["Administrator","Accounts"],gatepass:["Administrator","Gate"],gate:["Administrator","Gate"],auction:["Administrator","Auction"],weighment:["Administrator","Weighment"],disputes:["Administrator","Inspector"]};return !rules[action]||rules[action].includes(data.role);}
function requireRole(action){if(!allowed(action)){toast("આ કામગીરી માટે આ role ને પરવાનગી નથી.","error");return false;}return true;}
function toast(message,type="ok",sub=""){const node=document.createElement("div");node.className="toast "+(type==="error"?"error":"");node.innerHTML=esc(message)+(sub?'<span class="toast-sub">'+esc(sub)+'</span>':"");$("#toastStack").append(node);setTimeout(()=>node.remove(),3400);}
function statusChip(status){const [label,kind]=statusMeta[status]||[status,"neutral"];return '<span class="status '+kind+'">'+esc(label)+'</span>';}
function moneyField(n){return money(n).replace("₹","₹ ");}
function pageHead(kicker,title,subtitle,actions=""){return '<div class="page-head"><div><div class="eyebrow">'+kicker+'</div><h1>'+title+'</h1><p>'+subtitle+'</p></div><div class="head-actions">'+actions+'</div></div>';}
function btn(label,action,kind="soft",icon=""){return '<button class="btn '+kind+'" data-action="'+action+'">'+(icon?'<svg><use href="#i-'+icon+'"/></svg>':"")+label+'</button>';}
function stat(label,value,foot,icon,kind="",trend=""){return '<article class="stat-card"><div class="stat-top"><span>'+label+'</span><span class="stat-icon '+kind+'"><svg><use href="#i-'+icon+'"/></svg></span></div><div class="stat-value">'+value+'</div><div class="stat-foot"><span class="'+(trend?"trend":"")+'">'+(trend||"")+'</span>'+foot+'</div></article>';}
function tableShell(title,subtitle,inner,tools=""){return '<section class="table-panel"><div class="panel-head"><div><h3>'+title+'</h3><p>'+subtitle+'</p></div><div class="table-tools">'+tools+'</div></div><div class="table-scroll">'+inner+'</div></section>';}
function lotById(id){return data.lots.find(x=>x.id===id);}
function ticketByLot(id){return data.tickets.find(x=>x.lotId===id);}
function billByLot(id){return data.bills.find(x=>x.lotId===id);}
function rowAction(label,action,ref){return '<button class="btn small soft" data-action="'+action+'" data-ref="'+esc(ref)+'">'+label+'</button>';}
function noRows(msg){return '<tr><td colspan="9"><div class="empty-state"><strong>'+msg+'</strong><p>નવી એન્ટ્રી ઉમેરો અથવા filter બદલો.</p></div></td></tr>';}
function navTo(view){currentView=view;$$(".nav-item").forEach(n=>n.classList.toggle("active",n.dataset.view===view));const name=({"dashboard":"ડેશબોર્ડ","gate":"ગેટ એન્ટ્રી / આવક","auction":"હરાજી અને ભાવ-કાપલી","weighment":"વજન કાંટો","sales":"વેચાણ બિલ","payments":"ચુકવણી / ખેડૂત ખાતું","gatepass":"ગેટ પાસ / માલ રવાના","disputes":"ફરિયાદ / વિવાદ","reports":"રિપોર્ટ્સ અને વિશ્લેષણ","audit":"ઓડિટ ટ્રેલ","settings":"માસ્ટર અને સેટિંગ્સ"})[view]||"ડેશબોર્ડ";$("#crumbCurrent").textContent=name;render();}
function render(){if(!root)return;const methods={dashboard:renderDashboard,gate:renderGate,auction:renderAuction,weighment:renderWeighment,sales:renderSales,payments:renderPayments,gatepass:renderGatepass,disputes:renderDisputes,reports:renderReports,audit:renderAudit,settings:renderSettings};root.innerHTML=(methods[currentView]||renderDashboard)();$("#disputeNavCount").textContent=data.complaints.filter(c=>c.status!=="resolved").length;}
function renderDashboard(){
 const lots=data.lots, arrived=lots.filter(l=>l.status==="arrived").length, sold=lots.filter(l=>["auctioned","weighed","payment_pending","paid","dispatched"].includes(l.status)).length, pending=data.bills.filter(b=>b.status==="payment_pending").reduce((s,b)=>s+b.net,0), disputes=data.complaints.filter(c=>c.status!=="resolved").length;
 const actions='<button class="btn" data-action="quick-report"><svg><use href="#i-download"/></svg>દૈનિક રિપોર્ટ</button>'+btn("નવી ગેટ એન્ટ્રી","new-entry","primary","plus");
 const tx=lots.slice(0,5).map(l=>'<tr><td><button class="id-link" data-action="lot-detail" data-ref="'+l.id+'">'+l.id+'</button></td><td><span class="cell-title">'+esc(l.farmer)+'</span><span class="cell-sub">'+esc(l.village)+'</span></td><td>'+esc(l.commodity)+'</td><td>'+l.bags+' બેગ</td><td>'+esc(l.arrival)+'</td><td>'+statusChip(l.status)+'</td><td>'+rowAction("જુઓ","lot-detail",l.id)+'</td></tr>').join("");
 return pageHead("TUESDAY · 03 NOVEMBER 2026","સુપ્રભાત, Yard Administrator 👋","આજના માર્કેટ યાર્ડની કામગીરીનો live-style demo overview.",actions)
 +'<div class="stats-grid">'+stat("આજની કુલ આવક",lots.length+" લોટ","આજની નમૂનાની એન્ટ્રી","truck","","↗") + stat("હરાજી પૂર્ણ",data.tickets.length+" કાપલી","ટિકિટ ક્રમાંક સાથે રેકોર્ડ","auction","") + stat("ચુકવણી બાકી",money(pending),"ખેડૂત ચુકવણી pending","wallet","amber") + stat("ખુલ્લી ફરિયાદ",disputes,"તપાસ / જવાબ બાકી","alert","red")+'</div>'
 +'<div class="content-grid"><section class="panel"><div class="panel-head"><div><h3>દૈનિક હરાજી કામગીરી</h3><p>આજના demo transaction progress</p></div><span class="role-pill">03 NOV 2026</span></div><div class="panel-body"><div class="chart-wrap"><svg viewBox="0 0 600 190" preserveAspectRatio="none"><defs><linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#4f9b71" stop-opacity=".22"/><stop offset="1" stop-color="#4f9b71" stop-opacity="0"/></linearGradient></defs><path class="chart-grid" d="M35 25H585M35 65H585M35 105H585M35 145H585"/><text x="2" y="28" class="chart-label">40</text><text x="2" y="68" class="chart-label">30</text><text x="2" y="108" class="chart-label">20</text><text x="2" y="148" class="chart-label">10</text><path class="chart-fill" d="M35 140 L95 118 L155 124 L215 87 L275 100 L335 59 L395 70 L455 42 L515 58 L575 24 L575 160 L35 160Z"/><path class="chart-line" d="M35 140 L95 118 L155 124 L215 87 L275 100 L335 59 L395 70 L455 42 L515 58 L575 24"/><circle class="chart-point" cx="95" cy="118" r="4"/><circle class="chart-point" cx="215" cy="87" r="4"/><circle class="chart-point" cx="335" cy="59" r="4"/><circle class="chart-point" cx="455" cy="42" r="4"/><circle class="chart-point" cx="575" cy="24" r="4"/><g class="chart-label"><text x="30" y="181">07:00</text><text x="145" y="181">08:00</text><text x="260" y="181">09:00</text><text x="375" y="181">10:00</text><text x="490" y="181">11:00</text></g></svg></div><div class="chart-legend"><span><i class="legend-dot"></i>કુલ લોટ (નમૂનાત્મક)</span><span>સમય પ્રમાણે આવક</span></div></div></section><section class="panel"><div class="panel-head"><div><h3>તાજેતરની પ્રવૃત્તિ</h3><p>સિસ્ટમમાં થયેલી નોંધ</p></div><button class="link-btn" data-view="audit">બધું જુઓ ↗</button></div><div class="panel-body"><div class="activity-list">'+data.audit.slice(0,4).map((a,i)=>'<div class="activity-item"><div class="activity-bullet '+(i===1?"amber":i===2?"blue":"")+'"><svg><use href="#i-'+(i===0?"check":i===1?"truck":"receipt")+'"/></svg></div><div class="activity-text"><strong>'+esc(a.action)+'</strong><small>'+esc(a.actor)+' · '+esc(a.ref)+'</small></div><span class="activity-time">'+esc(a.time)+'</span></div>').join("")+'</div></div></section></div>'
 +'<div class="panel-head" style="padding:0 1px 10px"><div><h3>ઝડપી કામગીરી</h3><p>દરરોજના મુખ્ય workflow સુધી સીધી પહોંચ</p></div></div><div class="quick-grid"><button class="quick-action" data-action="new-entry"><span class="qa-icon"><svg><use href="#i-truck"/></svg></span><span><strong>ગેટ એન્ટ્રી</strong><small>નવો લોટ નોંધો</small></span></button><button class="quick-action" data-view="auction"><span class="qa-icon"><svg><use href="#i-auction"/></svg></span><span><strong>ભાવ-કાપલી</strong><small>હરાજી રેકોર્ડ કરો</small></span></button><button class="quick-action" data-view="weighment"><span class="qa-icon"><svg><use href="#i-scale"/></svg></span><span><strong>વજન નોંધો</strong><small>Net weight મેળવો</small></span></button><button class="quick-action" data-view="payments"><span class="qa-icon"><svg><use href="#i-wallet"/></svg></span><span><strong>ચુકવણી</strong><small>ખેડૂત ખાતું જુઓ</small></span></button></div>'
 +'<div style="height:15px"></div>'+tableShell("તાજેતરના લોટ","Yard gate પર નોંધાયેલા છેલ્લા lots",'<table><thead><tr><th>LOT ID</th><th>ખેડૂત</th><th>જથ્થો</th><th>બેગ</th><th>સમય</th><th>સ્થિતિ</th><th>વિગત</th></tr></thead><tbody>'+tx+'</tbody></table>',btn("બધા લોટ","go-gate","small"));
}
function renderGate(){
 let rows=data.lots.filter(l=>!searchTerm||[l.id,l.farmer,l.village,l.commodity,l.vehicle].join(" ").toLowerCase().includes(searchTerm.toLowerCase())).map(l=>'<tr><td><button class="id-link" data-action="lot-detail" data-ref="'+l.id+'">'+l.id+'</button></td><td><span class="cell-title">'+esc(l.farmer)+'</span><span class="cell-sub">'+esc(l.village)+' · '+esc(l.mobile)+'</span></td><td>'+esc(l.commodity)+'</td><td>'+l.bags+'</td><td>'+esc(l.vehicle)+'</td><td>'+esc(l.arrival)+'</td><td>'+statusChip(l.status)+'</td><td>'+rowAction("વિગત","lot-detail",l.id)+'</td></tr>').join("")||noRows("કોઈ લોટ મળ્યો નથી");
 return pageHead("YARD OPERATIONS","ગેટ એન્ટ્રી અને આવક","ખેડૂત, વાહન, પાક અને માલના દરેક લોટને unique Lot ID આપો.",btn("નવી ગેટ એન્ટ્રી","new-entry","primary","plus"))+
 '<div class="stats-grid">'+stat("આજની આવક",data.lots.length+" લોટ","ગેટ register માં નોંધાયેલ","truck")+stat("હરાજી માટે તૈયાર",data.lots.filter(l=>l.status==="arrived").length+" લોટ","હરાજી queue","auction","amber")+stat("આજે વાહન",data.lots.length+" વાહન","નમૂનાના gate records","truck","blue")+stat("અપૂર્ણ પ્રક્રિયા",data.lots.filter(l=>l.status!=="dispatched").length+" લોટ","હજી yard માં","clock","red")+'</div>'+
 tableShell("આવક રજિસ્ટર","Gate operator દ્વારા દાખલ થયેલી તમામ arrival entries",'<table><thead><tr><th>LOT ID</th><th>ખેડૂતની વિગતો</th><th>પાક</th><th>બેગ</th><th>વાહન નંબર</th><th>સમય</th><th>સ્ટેજ</th><th></th></tr></thead><tbody>'+rows+'</tbody></table>','<input class="filter-input" id="tableSearch" placeholder="લોટ / ખેડૂત શોધો..." value="'+esc(searchTerm)+'">')+
 '<div class="notice" style="margin-top:13px">દરેક ગેટ એન્ટ્રી પર સમય, user અને Lot ID આપમેળે નોંધાય છે. Duplicate vehicle અથવા farmer entry માટે production versionમાં duplicate warning અને document verification ઉમેરવી.</div>';
}
function renderAuction(){
 const eligible=data.lots.filter(l=>["arrived","auctioned"].includes(l.status));
 const rows=data.tickets.filter(t=>!searchTerm||[t.ticketNo,t.lotId,t.farmer,t.buyer,t.commodity].join(" ").toLowerCase().includes(searchTerm.toLowerCase())).map(t=>'<tr><td><button class="id-link" data-action="view-ticket" data-ref="'+t.ticketNo+'">'+t.ticketNo+'</button><span class="cell-sub">'+t.created+' · '+t.date+'</span></td><td><span class="cell-title">'+esc(t.farmer)+'</span><span class="cell-sub">'+t.lotId+'</span></td><td>'+esc(t.commodity)+' <span class="cell-sub">'+esc(t.quality)+'</span></td><td>'+esc(t.buyer)+'</td><td>'+money(t.rate)+'<span class="cell-sub">પ્રતિ ક્વિન્ટલ</span></td><td>'+num(t.quantity)+' Q</td><td>'+money(t.rate*t.quantity)+'</td><td>'+rowAction("પ્રિન્ટ","view-ticket",t.ticketNo)+'</td></tr>').join("")||noRows("હજુ ticket ઉપલબ્ધ નથી");
 return pageHead("PRICE DISCOVERY","હરાજી અને ભાવ-કાપલી","હરાજીના અંતિમ ભાવને unique serial સાથે રેકોર્ડ કરો; ખેડૂત અને ખરીદદાર બંનેને નકલ આપો.",btn("નવી ભાવ-કાપલી","new-ticket","primary","plus"))+
 '<div class="notice" style="margin-bottom:14px"><strong>પ્રસ્તાવિત નિયંત્રણ:</strong> ticket એકવાર issue થયા પછી overwrite નહીં થાય. ભૂલ સુધારવા માટે correction / cancellation entry અને reason ફરજિયાત રાખો. Original ticket audit trailમાં જળવાશે.</div>'+
 '<div class="stats-grid">'+stat("જારી થયેલી કાપલી",data.tickets.length,"આજે demo tickets","receipt")+stat("હરાજી માટે તૈયાર",eligible.filter(l=>l.status==="arrived").length,"Queue માં રાહ જુએ છે","auction","amber")+stat("સરેરાશ ભાવ",money(data.tickets.length?data.tickets.reduce((s,t)=>s+t.rate,0)/data.tickets.length:0),"નમૂનાના પાકનો સરેરાશ","chart","blue")+stat("કાપલી વગરના lots",data.lots.filter(l=>l.status==="arrived").length,"Ticket issue બાકી","alert","red")+'</div>'+
 tableShell("ડિજિટલ હરાજી રજિસ્ટર","ટિકિટ નંબર, પાક, ખરીદદાર અને final bid rate",'<table><thead><tr><th>ટિકિટ નંબર</th><th>ખેડૂત / Lot ID</th><th>પાક / ગ્રેડ</th><th>ખરીદદાર</th><th>હરાજી ભાવ</th><th>જથ્થો</th><th>અંદાજિત રકમ</th><th></th></tr></thead><tbody>'+rows+'</tbody></table>','<input class="filter-input" id="tableSearch" placeholder="Ticket / ખેડૂત શોધો..." value="'+esc(searchTerm)+'">')+
 '<div class="notice warn" style="margin-top:13px">ભાવ-કાપલીનો હેતુ હરાજીનો પુરાવો છે; અંતિમ ચૂકવવાની રકમ final verified weighment અને મંજૂર deductions પછીના sale billમાં નક્કી થશે.</div>';
}
function renderWeighment(){
 const eligible=data.lots.filter(l=>l.ticketNo&&!l.net&&l.status==="auctioned");
 const rows=eligible.map(l=>'<tr><td><button class="id-link" data-action="lot-detail" data-ref="'+l.id+'">'+l.id+'</button></td><td><span class="cell-title">'+esc(l.farmer)+'</span><span class="cell-sub">'+esc(l.commodity)+'</span></td><td>'+esc(l.ticketNo||"—")+'</td><td>'+num(l.estimated)+' Q</td><td>'+ (l.net?num(l.net)+" Q":"—")+'</td><td>'+statusChip(l.status)+'</td><td>'+rowAction(l.net?"વજન સુધારો":"વજન નોંધો","weigh-lot",l.id)+'</td></tr>').join("")||noRows("વજન માટે હરાજી પૂર્ણ થયેલો લોટ નથી");
 return pageHead("WEIGHBRIDGE","વજન કાંટા વ્યવસ્થાપન","હરાજી ticket સાથે actual gross, tare અને net weight જોડો.",btn("વજન નોંધો","choose-weigh","primary","plus"))+
 '<div class="stats-grid">'+stat("તોલ માટે બાકી",eligible.filter(l=>!l.net).length+" લોટ","હરાજી પૂર્ણ","scale","amber")+stat("વજન પૂર્ણ",eligible.filter(l=>l.net).length+" લોટ","Net weight નોંધાયેલ","check")+stat("આજનું net વજન",num(data.lots.reduce((s,l)=>s+(l.net||0),0))+" Q","નમૂનાના records","chart","blue")+stat("Scale sync","Manual","Hardware integration બાકી","settings","red")+'</div>'+
 tableShell("Weighment queue","Gross – tare = net; calibrated scale reference અને operator નોંધો",'<table><thead><tr><th>LOT ID</th><th>ખેડૂત / પાક</th><th>હરાજી ટિકિટ</th><th>અંદાજિત વજન</th><th>Net weight</th><th>સ્થિતિ</th><th></th></tr></thead><tbody>'+rows+'</tbody></table>')+
 '<div class="notice" style="margin-top:13px">Production માટે: scale serial/device ID, calibration due date, timestamp, operator login, gross/tare readings, second weighment reason અને signed scale slip capture કરો. Hardware interface vendor અને weighing instrumentની મંજૂરી પ્રમાણે જ જોડવો.</div>';
}
function renderSales(){
 const rows=data.bills.filter(b=>!searchTerm||[b.billNo,b.lotId,b.farmer,b.buyer].join(" ").toLowerCase().includes(searchTerm.toLowerCase())).map(b=>'<tr><td><span class="cell-title">'+b.billNo+'</span><span class="cell-sub">'+b.lotId+'</span></td><td>'+esc(b.farmer)+'</td><td>'+esc(b.buyer)+'</td><td>'+num(b.weight)+' Q</td><td>'+money(b.rate)+'</td><td>'+money(b.gross)+'</td><td>'+money(b.net)+'</td><td>'+statusChip(b.status)+'</td><td>'+rowAction("ખોલો","bill-detail",b.billNo)+'</td></tr>').join("")||noRows("કોઈ sale bill મળ્યું નથી");
 const sum=data.bills.reduce((s,b)=>s+b.gross,0), totalNet=data.bills.reduce((s,b)=>s+b.net,0);
 return pageHead("SALE SETTLEMENT","વેચાણ બિલ અને હિસાબ","Verified net weight અને accepted auction rate પરથી sale statement તૈયાર કરો.",'<span class="role-pill">વજન પૂર્ણ થયા પછી બિલ આપમેળે બને છે</span>')+
 '<div class="stats-grid">'+stat("કુલ વેચાણ",money(sum),"ડેમો બિલનું gross value","receipt")+stat("ખેડૂતને ચૂકવવાનું",money(totalNet),"Net payable (demo)","wallet","blue")+stat("ખેડૂત તરફની મંજૂર કપાત",money(sum-totalNet),"માત્ર માન્ય seller deductions","chart","amber")+stat("બિલોની સંખ્યા",data.bills.length+" બિલ","Generated statements","receipt")+'</div>'+
 tableShell("Sale bill register","દરેક billમાં auction ticket અને verified weighmentનો linkage",'<table><thead><tr><th>બિલ નંબર / LOT</th><th>ખેડૂત</th><th>ખરીદદાર</th><th>Net વજન</th><th>ભાવ / Q</th><th>Gross રકમ</th><th>Net payable</th><th>સ્થિતિ</th><th></th></tr></thead><tbody>'+rows+'</tbody></table>','<input class="filter-input" id="tableSearch" placeholder="Bill / ખેડૂત શોધો..." value="'+esc(searchTerm)+'">')+
 '<div class="notice warn" style="margin-top:13px">ખેડૂતનું net payable અને buyer-side market fee અલગ ledgersમાં છે. સામાન્ય ખેડૂત વેચાણમાં market fee ખેડૂતની રકમમાંથી કપાત તરીકે ન ગણવી; વાસ્તવિક fee, અન્ય charges અને exceptions માટે current law / bye-laws ચકાસવાના.</div>';
}
function renderPayments(){
 const rows=data.bills.map(b=>'<tr><td>'+b.billNo+'<span class="cell-sub">'+b.lotId+'</span></td><td><span class="cell-title">'+esc(b.farmer)+'</span></td><td>'+money(b.net)+'</td><td>'+(b.paid?money(b.paid):money(0))+'</td><td>'+money(b.net-(b.paid||0))+'</td><td>'+(b.paymentRef?'<span class="cell-sub">'+esc(b.paymentRef)+'</span>':"—")+'</td><td>'+statusChip(b.status)+'</td><td>'+ (b.status==="payment_pending"?rowAction("ચુકવણી નોંધો","record-payment",b.billNo):rowAction("વિગત","bill-detail",b.billNo))+'</td></tr>').join("")||noRows("ચુકવણી record નથી");
 const due=data.bills.filter(b=>b.status!=="paid").reduce((s,b)=>s+(b.net-(b.paid||0)),0);
 return pageHead("FARMER SETTLEMENT","ચુકવણી અને ખેડૂત ખાતું","Bill-wise payable, paid amount, UTR/reference અને outstanding track કરો.",'<button class="btn" data-action="export-payments"><svg><use href="#i-download"/></svg>Export CSV</button>')+
 '<div class="stats-grid">'+stat("કુલ બાકી",money(due),"બધા unpaid bills","wallet","amber")+stat("ચુકવાયેલ",money(data.bills.reduce((s,b)=>s+(b.paid||0),0)),"Payment records","check")+stat("બાકી bills",data.bills.filter(b=>b.status!=="paid").length,"પુષ્ટિ કરવી બાકી","receipt","red")+stat("Payment mode","NEFT / RTGS","UPI / bank integration future","wallet","blue")+'</div>'+
 tableShell("ખેડૂત ચુકવણી રજિસ્ટર","એક જ bill પર duplicate payment અટકાવવા unique reference ચકાસો",'<table><thead><tr><th>બિલ / લોટ</th><th>ખેડૂત</th><th>ચૂકવવાપાત્ર</th><th>ચૂકવેલ</th><th>બાકી</th><th>UTR / reference</th><th>સ્થિતિ</th><th></th></tr></thead><tbody>'+rows+'</tbody></table>')+
 tableShell("ખરીદદારનું Market fee / અન્ય dues ledger","ખેડૂતની ચુકવણીથી અલગ buyer-side liability; buyer-wise collection track કરો",'<table><thead><tr><th>Bill / Lot</th><th>ખરીદદાર</th><th>Market fee</th><th>અન્ય dues</th><th>કુલ dues</th><th>ચૂકવેલ</th><th>બાકી</th><th></th></tr></thead><tbody>'+data.bills.filter(b=>(b.buyerTotalDue||0)>0).map(b=>'<tr><td>'+b.billNo+'<span class="cell-sub">'+b.lotId+'</span></td><td>'+esc(b.buyer)+'</td><td>'+money(b.buyerMarketFee||0)+'</td><td>'+money(b.buyerOther||0)+'</td><td>'+money(b.buyerTotalDue||0)+'</td><td>'+money(b.buyerFeePaid||0)+'</td><td>'+money((b.buyerTotalDue||0)-(b.buyerFeePaid||0))+'</td><td>'+((b.buyerTotalDue||0)>(b.buyerFeePaid||0)?rowAction("Buyer payment નોંધો","record-buyer-fee",b.billNo):statusChip("paid"))+'</td></tr>').join("")||noRows("આ demoમાં buyer dues configure થયા નથી.")+'</tbody></table>')+
 '<div class="notice" style="margin-top:13px">Productionમાં payment integration bank statement / maker-checker approval સાથે કરવું. આ prototypeમાં payment button માત્ર local demo record નોંધે છે; કોઈ real money transfer થતો નથી.</div>';
}
function renderGatepass(){
 const rows=data.lots.filter(l=>l.status==="paid"||l.status==="dispatched").map(l=>'<tr><td>'+esc(l.passNo||"—")+'</td><td><span class="cell-title">'+l.id+'</span></td><td>'+esc(l.farmer)+'</td><td>'+esc(l.buyer||"—")+'</td><td>'+num(l.net||0)+' Q</td><td>'+esc(l.vehicle)+'</td><td>'+statusChip(l.status)+'</td><td>'+rowAction(l.passNo?"પાસ જુઓ":"પાસ બનાવો",l.passNo?"view-pass":"create-pass",l.id)+'</td></tr>').join("")||noRows("Gate pass માટે eligible lot નથી");
 return pageHead("EXIT CONTROL","ગેટ પાસ અને માલ રવાના","Sale record, payment/approval અને vehicle dispatch વચ્ચે control રાખો.",btn("નવો gate pass","choose-pass","primary","plus"))+
 '<div class="stats-grid">'+stat("Dispatch માટે તૈયાર",data.lots.filter(l=>l.status==="paid").length+" લોટ","Payment confirmed","check")+stat("રવાના થયેલ",data.lots.filter(l=>l.status==="dispatched").length+" લોટ","Gate exit recorded","exit","blue")+stat("પાસ જારી",data.lots.filter(l=>l.passNo).length+" પાસ","Unique pass number","receipt")+stat("અટકાવેલા lots",data.lots.filter(l=>l.status==="payment_pending").length+" લોટ","Unpaid – hold","alert","red")+'</div>'+
 tableShell("Dispatch register","Gate pass lot ID, bill, weight અને vehicle સાથે જોડાયેલો",'<table><thead><tr><th>Gate pass</th><th>Lot ID</th><th>ખેડૂત</th><th>ખરીદદાર</th><th>Net વજન</th><th>વાહન</th><th>સ્થિતિ</th><th></th></tr></thead><tbody>'+rows+'</tbody></table>')+
 '<div class="notice warn" style="margin-top:13px">Gate pass actual statutory permitનું સ્થાન આપમેળે લેતો નથી. Applicable permit format, transport documents અને statutory conditions APMC પ્રમાણે configure કરવાના રહેશે.</div>';
}
function renderDisputes(){
 const rows=data.complaints.filter(c=>!searchTerm||[c.id,c.lotId,c.by,c.type].join(" ").toLowerCase().includes(searchTerm.toLowerCase())).map(c=>'<tr><td><span class="cell-title">'+c.id+'</span><span class="cell-sub">'+c.date+'</span></td><td>'+esc(c.by)+'</td><td>'+esc(c.type)+'</td><td><button class="id-link" data-action="lot-detail" data-ref="'+c.lotId+'">'+c.lotId+'</button></td><td>'+esc(c.details)+'</td><td>'+statusChip(c.status)+'</td><td>'+rowAction("તપાસ","complaint-detail",c.id)+'</td></tr>').join("")||noRows("કોઈ complaint નથી");
 return pageHead("GRIEVANCE REDRESSAL","ફરિયાદ અને વિવાદ વ્યવસ્થાપન","વજન, ગુણવત્તા, auction rate અથવા payment વિવાદને transaction proof સાથે link કરો.",btn("ફરિયાદ નોંધો","new-complaint","primary","plus"))+
 '<div class="stats-grid">'+stat("કુલ ફરિયાદ",data.complaints.length+" ફરિયાદ","Demo complaints","alert")+stat("ખુલ્લી",data.complaints.filter(c=>c.status==="open").length+" ફરિયાદ","Action required","clock","red")+stat("તપાસમાં",data.complaints.filter(c=>c.status==="investigating").length+" ફરિયાદ","Evidence review","chart","amber")+stat("ઉકેલાઈ",data.complaints.filter(c=>c.status==="resolved").length+" ફરિયાદ","Closed with notes","check")+'</div>'+
 tableShell("ફરિયાદ રજિસ્ટર","Complaint ID, transaction link, evidence, assigned officer અને resolution",'<table><thead><tr><th>ફરિયાદ ID</th><th>ફરિયાદી</th><th>પ્રકાર</th><th>Lot ID</th><th>વિગત</th><th>સ્થિતિ</th><th></th></tr></thead><tbody>'+rows+'</tbody></table>','<input class="filter-input" id="tableSearch" placeholder="Complaint / ખેડૂત શોધો..." value="'+esc(searchTerm)+'">')+
 '<div class="notice" style="margin-top:13px">દરેક ફરિયાદ માટે complaint receipt, hearing date, assigned officer, attachment evidence, નિર્ણયનો reason અને appeal/escalation status રાખવો.</div>';
}
function renderReports(){
 const total=data.lots.length, avg=data.tickets.length?data.tickets.reduce((s,t)=>s+t.rate,0)/data.tickets.length:0;
 const rows=[["Gate arrival register",total+" lots","Excel / CSV"],["Auction & ticket register",data.tickets.length+" tickets","Ticket-wise"],["Weighment variance",data.lots.filter(l=>l.net).length+" weighments","Gross / tare / net"],["Sale & settlement",data.bills.length+" bills","Gross / deductions / net"],["Farmer payment ledger",data.bills.filter(b=>b.status==="paid").length+" paid","UTR / outstanding"],["Complaint register",data.complaints.length+" cases","Ageing / resolution"],["Audit trail",data.audit.length+" events","Actor / timestamp"]].map((r,i)=>'<tr><td><span class="cell-title">'+r[0]+'</span></td><td>'+r[1]+'</td><td>'+r[2]+'</td><td>'+rowAction("CSV export","report-csv",String(i))+'</td></tr>').join("");
 return pageHead("MANAGEMENT INFORMATION","રિપોર્ટ્સ અને વિશ્લેષણ","તમામ operationsમાંથી એક જ source of truth પર આધારિત MIS reports.",'<button class="btn primary" data-action="export-all"><svg><use href="#i-download"/></svg>બધા ડેટા Export</button>')+
 '<div class="stats-grid">'+stat("કુલ lot",total,"Demo arrival register","truck")+stat("હરાજી ભાવ સરેરાશ",money(avg),"પ્રતિ ક્વિન્ટલ","chart","blue")+stat("Gross sale value",money(data.bills.reduce((s,b)=>s+b.gross,0)),"Sale bill register","receipt")+stat("Pending payable",money(data.bills.filter(b=>b.status!=="paid").reduce((s,b)=>s+b.net-(b.paid||0),0)),"Farmer settlement","wallet","amber")+'</div>'+
 tableShell("રિપોર્ટ સેન્ટર","પસંદગીનો report CSVમાં export કરો; વાસ્તવિક Excel/PDF formats productionમાં ઉમેરવા",'<table><thead><tr><th>રિપોર્ટ</th><th>Records</th><th>મુખ્ય વિગત</th><th></th></tr></thead><tbody>'+rows+'</tbody></table>')+
 '<div class="panel" style="margin-top:14px"><div class="panel-head"><div><h3>આગળના MIS સૂચકાંકો</h3><p>Management committee માટે ઉપયોગી KPI</p></div></div><div class="panel-body"><div class="form-grid"><div class="inline-metric"><small>ખેડૂત દીઠ સરેરાશ waiting time</small><strong>—</strong><small>Gate entryથી auction સુધી timestamps જરૂરી</small></div><div class="inline-metric"><small>Buyer-wise purchase volume</small><strong>—</strong><small>Trader dashboard + sale records પરથી</small></div><div class="inline-metric"><small>Weighment variance rate</small><strong>—</strong><small>Arrival estimate સામે certified net weight</small></div><div class="inline-metric"><small>Complaint resolution time</small><strong>—</strong><small>Complaint open/close timestamps જરૂરી</small></div></div></div></div>';
}
function renderAudit(){
 const rows=data.audit.map(a=>'<tr><td><span class="cell-title">'+esc(a.time)+'</span><span class="cell-sub">03 Nov 2026</span></td><td>'+esc(a.actor)+'</td><td>'+esc(a.action)+'</td><td><span class="id-link">'+esc(a.ref)+'</span></td><td><span class="status info">Record logged</span></td></tr>').join("");
 return pageHead("SYSTEM GOVERNANCE","ઓડિટ ટ્રેલ અને activity log","કોણે, ક્યારે, કયા transaction પર કઈ action કરી તેનો append-only demo history.",'<button class="btn" data-action="export-audit"><svg><use href="#i-download"/></svg>Export log</button>')+
 '<div class="notice warn" style="margin-bottom:14px">આ prototypeમાં browser-local log છે. Productionમાં audit events server-side append-only, role-restricted અને tamper-evident storageમાં રાખવા; correction માટે old value + new value + reason ફરજિયાત.</div>'+
 tableShell("સંપૂર્ણ audit history","દરેક workflowની timestamp સાથે નોંધ",'<table><thead><tr><th>સમય</th><th>USER / ROLE</th><th>EVENT</th><th>REFERENCE</th><th>LOG STATUS</th></tr></thead><tbody>'+rows+'</tbody></table>');
}
function renderSettings(){
 return pageHead("CONFIGURATION","માસ્ટર ડેટા અને સેટિંગ્સ","Yard-specific master data, licenses, rates અને user permissionsનું નિયંત્રણ.",'<span class="role-note">Signed in as <b class="role-pill">'+esc(data.role)+'</b></span>')+
 '<div class="content-grid"><section class="panel"><div class="panel-head"><div><h3>Yard configuration</h3><p>આ ડેમોનું setup</p></div></div><div class="panel-body"><div class="form-grid"><div class="field"><label>Market committee name</label><input value="Surat APMC (Demo)" disabled></div><div class="field"><label>Market yard code</label><input value="SRT-DEMO-01" disabled></div><div class="field"><label>Timezone</label><input value="Asia/Kolkata" disabled></div><div class="field"><label>Ticket prefix</label><input value="APMC-26" disabled></div></div><p class="notice" style="margin-top:13px">Actual committee name, notified commodities, market area, yard code અને document formats અધિકૃત APMC દ્વારા verify કરીને ભરવાના.</p></div></section><section class="panel"><div class="panel-head"><div><h3>Role-based access</h3><p>કામ પ્રમાણે permissions</p></div></div><div class="panel-body"><div class="activity-list">'+[["Administrator","All modules · configuration · approvals"],["Gate","Arrival · vehicle · gate pass"],["Auction","Auction entry · ticket issue"],["Weighment","Gross / tare / net weight"],["Accounts","Sale bill · settlement"],["Inspector","Dispute · audit review"]].map(x=>'<div class="activity-item"><div class="activity-bullet"><svg><use href="#i-check"/></svg></div><div class="activity-text"><strong>'+x[0]+'</strong><small>'+x[1]+'</small></div></div>').join("")+'</div><button class="btn soft" data-action="switch-role" style="margin-top:12px">Demo role બદલો</button></div></section></div>'+
 '<div class="content-grid"><section class="panel"><div class="panel-head"><div><h3>Commodity master</h3><p>યાર્ડમાં મંજૂર પાકની યાદી</p></div><button class="btn small soft" data-action="add-commodity">+ ઉમેરો</button></div><div class="panel-body"><div style="display:flex;gap:7px;flex-wrap:wrap">'+data.commodities.map(c=>'<span class="role-pill">'+esc(c)+'</span>').join("")+'</div></div></section><section class="panel"><div class="panel-head"><div><h3>Trade deductions configuration</h3><p>દર હાલ શૂન્ય રાખવામાં આવ્યો છે</p></div></div><div class="panel-body"><div class="notice warn">કપાતના દર legal/bye-law approval પછી જ અહીં configure કરવા. Prototype કોઈ market rate નિર્ધારિત કરતું નથી.</div><button class="btn soft" data-action="edit-deductions" style="margin-top:11px">કપાતના દર configure કરો</button></div></section></div>'+
 '<div class="panel"><div class="panel-head"><div><h3>Production readiness checklist</h3><p>Live deployment પહેલાં અધિકૃત લોકો સાથે close કરવાના મુદ્દા</p></div><span class="status warning">Approval જરૂરી</span></div><div class="panel-body"><div class="form-grid">'+["Current Gujarat Act / Rules / notified amendments અને APMC bye-lawsનું legal review","Official fee, charges, permitted deductions અને receipt formatsની મંજૂરી","Weighbridge vendor/device API, calibration અને device identity","e-NAM integration scope, API access અને duplicate data policy","Farmer / trader / commission agent KYC અને licence validation","Digital signatures, e-record evidence, retention અને access policy","SMS / WhatsApp / printer vendor and consent / delivery logs","Disaster recovery, offline queue, backups અને security testing"].map(x=>'<div class="activity-item"><div class="activity-bullet amber">!</div><div class="activity-text"><strong>'+x+'</strong><small>Pending verification before production use</small></div></div>').join("")+'</div></div></div>';
}

// Forms and modal workflows
function openModal(title,eyebrow,body,foot=""){ $("#modalTitle").textContent=title;$("#modalEyebrow").textContent=eyebrow;modalBody.innerHTML=body+(foot?'<div class="modal-foot">'+foot+'</div>':"");const f=modalBody.querySelector("form");const submit=modalBody.querySelector('.modal-foot button[type="submit"]');if(f&&submit&&f.id)submit.setAttribute("form",f.id);modal.hidden=false;document.body.style.overflow="hidden"; }
function closeModal(){modal.hidden=true;document.body.style.overflow="";}
function formFooter(cancel="રદ કરો",submit="સાચવો"){return '<button class="btn" type="button" data-action="close-modal">'+cancel+'</button><button class="btn primary" type="submit">'+submit+' <svg><use href="#i-arrow"/></svg></button>';}
function showEntryForm(){
 if(!requireRole("gate"))return;
 openModal("નવી ગેટ એન્ટ્રી","GATE ENTRY · NEW LOT",'<form id="entryForm"><div class="notice" style="margin-bottom:13px">Entry save થતાં unique Lot ID અને gate timestamp આપમેળે બનશે.</div><div class="form-grid"><div class="field"><label>ખેડૂતનું પૂરું નામ <em>*</em></label><input name="farmer" required placeholder="દા.ત. રમેશભાઈ પટેલ"></div><div class="field"><label>મોબાઇલ નંબર <em>*</em></label><input name="mobile" required pattern="[0-9 +()-]{10,15}" placeholder="10 અંકનો નંબર"></div><div class="field"><label>ગામ <em>*</em></label><input name="village" required placeholder="ગામનું નામ"></div><div class="field"><label>પાક / Commodity <em>*</em></label><select name="commodity" required>'+data.commodities.map(c=>'<option>'+esc(c)+'</option>').join("")+'</select></div><div class="field"><label>બેગ / જથ્થા એકમ <em>*</em></label><input name="bags" type="number" min="1" required placeholder="બેગની સંખ્યા"></div><div class="field"><label>વાહન નંબર</label><input name="vehicle" placeholder="GJ-05-XX-0000"></div><div class="field"><label>અંદાજિત વજન (Q)</label><input name="estimated" type="number" step=".01" min="0" placeholder="અંદાજિત ક્વિન્ટલ"></div><div class="field"><label>પ્રાથમિક ગુણવત્તા</label><select name="quality"><option>FAQ</option><option>Grade A</option><option>Grade B</option><option>તપાસ બાકી</option></select></div><div class="field full"><label>નોંધ / વિશેષ ઓળખ</label><textarea name="notes" placeholder="માલની ઓળખ અથવા gate observation"></textarea></div></div></form>',formFooter("રદ કરો","Gate entry સાચવો"));
}
function showTicketForm(){
 if(!requireRole("auction"))return;
 const ready=data.lots.filter(l=>l.status==="arrived");
 if(!ready.length){toast("હરાજી માટે કોઈ lot ઉપલબ્ધ નથી.","error");return;}
 openModal("નવી ડિજિટલ ભાવ-કાપલી","AUCTION · PRICE TICKET",'<form id="ticketForm"><div class="notice" style="margin-bottom:13px">Save કરતાં unique ticket serial બનશે. એક જ Lot ID માટે બીજી ticket બનાવવા પહેલાં supervisor correction flow જરૂરી રહેશે.</div><div class="form-grid"><div class="field full"><label>Lot ID / ખેડૂત <em>*</em></label><select name="lotId" required>'+ready.map(l=>'<option value="'+l.id+'" '+(l.status==="arrived"?"":"disabled")+'>'+l.id+' · '+esc(l.farmer)+' · '+esc(l.commodity)+'</option>').join("")+'</select></div><div class="field"><label>ખરીદદાર / Trader <em>*</em></label><select name="buyer" required>'+data.buyers.map(b=>'<option>'+esc(b)+'</option>').join("")+'</select></div><div class="field"><label>હરાજી ભાવ (₹ / Q) <em>*</em></label><input name="rate" type="number" min="1" step=".01" required placeholder="દા.ત. 6250"></div><div class="field"><label>જથ્થો (પ્રાથમિક Q) <em>*</em></label><input name="quantity" type="number" min=".01" step=".01" required value="'+(ready[0].estimated||"")+'"></div><div class="field"><label>Quality / grade</label><select name="quality"><option>FAQ</option><option>Grade A</option><option>Grade B</option><option>As per sample</option></select></div><div class="field"><label>હરાજી રીત</label><select name="method"><option>Open outcry / જાહેર હરાજી</option><option>e-Auction</option><option>Approved negotiated sale</option></select></div><div class="field full"><label>હરાજી નોંધ / બિડ reference</label><input name="notes" placeholder="Bid register / round / remarks"></div></div><p class="hint">Final bill actual verified net weight પરથી બનશે. Ticket estimateને final weight તરીકે ન ગણવું.</p></form>',formFooter("રદ કરો","ટિકિટ બનાવો"));
}
function showWeighForm(id){
 if(!requireRole("weighment"))return;
 const lot=id?lotById(id):data.lots.find(l=>l.ticketNo&&!l.net&&l.status==="auctioned");
 if(!lot){toast("તોલ માટે eligible lot નથી.","error");return;}
 if(lot.net){toast("આ lotનું વજન પહેલેથી નોંધાયું છે. સુધારણા માટે authorized correction workflow જોઈએ.","error");return;}
 openModal("વજન નોંધો · "+lot.id,"WEIGHBRIDGE · NET WEIGHT",'<form id="weighForm" data-lot="'+lot.id+'"><div class="notice" style="margin-bottom:12px">Lot: <strong>'+esc(lot.farmer)+'</strong> · Ticket: '+esc(lot.ticketNo||"—")+' · '+esc(lot.commodity)+'</div><div class="form-grid"><div class="field"><label>Gross weight (Q) <em>*</em></label><input name="gross" type="number" step=".001" min=".001" required placeholder="Loaded weight"></div><div class="field"><label>Tare weight (Q) <em>*</em></label><input name="tare" type="number" step=".001" min="0" required placeholder="Empty vehicle / tare"></div><div class="field"><label>Scale / machine ID</label><input name="scaleId" placeholder="WB-01"></div><div class="field"><label>Weighment slip ref</label><input name="slipRef" placeholder="Scale print serial"></div><div class="field full"><label>તોલ ઓપરેટરની નોંધ</label><textarea name="notes" placeholder="Second weighment / calibration / observation"></textarea></div></div><div class="notice warn" style="margin-top:12px">Net weight = Gross − Tare. Readings અહીં manually દાખલ થાય છે; device verification connected નથી.</div></form>',formFooter("રદ કરો","વજન સાચવો"));
}
function showPaymentForm(billNo){
 if(!requireRole("payments"))return;
 const bill=data.bills.find(b=>b.billNo===billNo);if(!bill)return;
 const due=bill.net-(bill.paid||0);
 openModal("ચુકવણી નોંધો · "+bill.billNo,"PAYMENT ENTRY",'<form id="paymentForm" data-bill="'+billNo+'"><div class="inline-metric" style="margin-bottom:13px"><small>ખેડૂત · બાકી રકમ</small><strong>'+esc(bill.farmer)+' · '+money(due)+'</strong><small>Bill: '+bill.billNo+' / Lot: '+bill.lotId+'</small></div><div class="form-grid"><div class="field"><label>ચૂકવણી રકમ (₹) <em>*</em></label><input name="amount" type="number" min=".01" max="'+due+'" step=".01" required value="'+due+'"></div><div class="field"><label>માધ્યમ</label><select name="mode"><option>NEFT</option><option>RTGS</option><option>IMPS</option><option>UPI</option><option>Cash (approval required)</option></select></div><div class="field full"><label>UTR / Transaction reference <em>*</em></label><input name="ref" required placeholder="Bank transaction reference"></div><div class="field full"><label>નોંધ</label><input name="notes" placeholder="Payment advice / bank statement reference"></div></div></form>',formFooter("રદ કરો","Payment નોંધો"));
}
function showBuyerFeeForm(billNo){
 if(!requireRole("payments"))return;
 const b=data.bills.find(x=>x.billNo===billNo);if(!b)return;
 const due=Number(b.buyerTotalDue||0)-Number(b.buyerFeePaid||0);
 openModal("Buyer dues payment · "+billNo,"BUYER-SIDE MARKET FEE / COLLECTION",'<form id="buyerFeeForm" data-bill="'+billNo+'"><div class="inline-metric" style="margin-bottom:13px"><small>ખરીદદાર · બાકી buyer dues</small><strong>'+esc(b.buyer)+' · '+money(due)+'</strong><small>Market fee: '+money(b.buyerMarketFee||0)+' · Other: '+money(b.buyerOther||0)+'</small></div><div class="form-grid"><div class="field"><label>ચૂકવણી રકમ (₹) <em>*</em></label><input name="amount" type="number" min=".01" max="'+due+'" step=".01" required value="'+due+'"></div><div class="field"><label>માધ્યમ</label><select name="mode"><option>NEFT</option><option>RTGS</option><option>IMPS</option><option>UPI</option><option>Cash (approval required)</option></select></div><div class="field full"><label>UTR / receipt reference <em>*</em></label><input name="ref" required placeholder="Buyer collection reference"></div></div></form>',formFooter("રદ કરો","Buyer payment નોંધો"));
}
function showComplaintForm(){
 if(!requireRole("disputes"))return;
 openModal("નવી ફરિયાદ નોંધો","GRIEVANCE · CASE LOG",'<form id="complaintForm"><div class="form-grid"><div class="field"><label>ફરિયાદીનું નામ <em>*</em></label><input name="by" required placeholder="ખેડૂત / વેપારી"></div><div class="field"><label>Lot ID / Transaction</label><select name="lotId"><option value="">પસંદ કરો</option>'+data.lots.map(l=>'<option value="'+l.id+'">'+l.id+' · '+esc(l.farmer)+'</option>').join("")+'</select></div><div class="field"><label>ફરિયાદનો પ્રકાર <em>*</em></label><select name="type"><option>હરાજી દર અંગે</option><option>વજનમાં તફાવત</option><option>ગુણવત્તા અંગે</option><option>ચુકવણી વિલંબ</option><option>અન્ય</option></select></div><div class="field"><label>સંપર્ક નંબર</label><input name="mobile" placeholder="મોબાઇલ નંબર"></div><div class="field full"><label>ફરિયાદની વિગત <em>*</em></label><textarea name="details" required placeholder="સમસ્યા, ઘટના અને માંગેલ ઉકેલ"></textarea></div><div class="field full"><label>પુરાવા / attachment note</label><input name="evidence" placeholder="Ticket no, weigh slip, photo reference (demo)"></div></div></form>',formFooter("રદ કરો","ફરિયાદ રજીસ્ટર કરો"));
}
function showRolePicker(){
 openModal("Demo role બદલો","ROLE-BASED ACCESS",'<form id="roleForm"><div class="notice" style="margin-bottom:13px">આ prototypeમાં દરેક roleનું menu access simulate થાય છે. Actual user accounts અને permissions production setupમાં અલગથી configure કરવાના.</div><div class="field"><label>પસંદ કરેલો role</label><select name="role">'+[["Administrator","Administrator · બધું"],["Gate","Gate Operator · ગેટ એન્ટ્રી / પાસ"],["Auction","Auction Operator · હરાજી / કાપલી"],["Weighment","Weighment Operator · તોલ"],["Accounts","Accounts · બિલ / ચુકવણી"],["Inspector","Inspector · ફરિયાદ / audit"]].map(x=>'<option value="'+x[0]+'" '+(data.role===x[0]?"selected":"")+'>'+x[1]+'</option>').join("")+'</select></div></form>',formFooter("રદ કરો","Role લાગુ કરો"));
}
function showDeductions(){
 if(!requireRole("settings"))return;
 openModal("કપાત અને buyer dues configure કરો","LEGAL / BYE-LAW CONFIG",'<form id="deductForm"><div class="notice warn" style="margin-bottom:13px"><strong>મહત્વપૂર્ણ:</strong> Gujarat APMC Act Section 28(2)(c) મુજબ ખેડૂત-વેચનારના સામાન્ય વ્યવહારમાં market fee buyer-side liability છે; તેને ખેડૂતની રકમમાંથી કપાત તરીકે ન ગણવી. અલગ કાનૂની પરિસ્થિતિઓ માટે legal approval જરૂરી છે.</div><div class="form-grid"><div class="field full"><label>ખેડૂત તરફની મંજૂર કપાત (₹ / bill)</label><input name="sellerApproved" type="number" min="0" step=".01" value="'+(data.deductions.sellerApproved||0)+'"><span class="hint">માત્ર લાગુ rule / bye-lawથી મંજૂર હોય ત્યારે જ.</span></div><div class="field"><label>ખરીદદારની Market fee (₹ / bill)</label><input name="buyerMarketFee" type="number" min="0" step=".01" value="'+(data.deductions.buyerMarketFee||0)+'"></div><div class="field"><label>ખરીદદારના અન્ય મંજૂર dues (₹)</label><input name="buyerOther" type="number" min="0" step=".01" value="'+(data.deductions.buyerOther||0)+'"></div></div></form>',formFooter("રદ કરો","સેવ કરો"));
}
function showAddCommodity(){
 if(!requireRole("settings"))return;
 openModal("Commodity ઉમેરો","MASTER DATA",'<form id="commodityForm"><div class="field"><label>પાકનું નામ <em>*</em></label><input name="name" required placeholder="પાકનું નામ લખો"></div></form>',formFooter("રદ કરો","ઉમેરો"));
}
function ticketHtml(t,copy){
 const lot=lotById(t.lotId)||{};
 const estimated=t.quantity*t.rate;
 const qrId="qr_"+copy+"_"+Math.random().toString(36).slice(2,7);
 return '<div class="ticket-copy"><div class="ticket-copy-label">'+copy+' COPY · '+(copy==="FARMER"?"ખેડૂતની નકલ":copy==="BUYER"?"ખરીદદારની નકલ":"યાર્ડની ઓફિસ નકલ")+'</div><div class="ticket" id="'+qrId+'"><div class="ticket-top"><div class="ticket-logo">APMC YARDOS · DIGITAL MARKET RECORD</div><h3>હરાજી ભાવ-કાપલી</h3><p>માર્કેટ યાર્ડ · સુરત (ડેમો) · 03 નવેમ્બર 2026</p></div><div class="ticket-no"><div><small>ટિકિટ નંબર</small><br><strong>'+esc(t.ticketNo)+'</strong><div class="cell-sub">'+esc(t.created)+' · '+esc(t.date)+'</div></div><div class="qr-wrap" data-qr="'+esc(t.ticketNo+"|"+t.lotId+"|"+t.rate)+'"><span style="font:700 8px DM Sans;color:#718076">QR</span></div></div><div class="ticket-grid"><div class="ticket-field"><small>Lot ID</small><strong>'+esc(t.lotId)+'</strong></div><div class="ticket-field"><small>ખેડૂત / વેચનાર</small><strong>'+esc(t.farmer)+'</strong></div><div class="ticket-field"><small>પાક / Grade</small><strong>'+esc(t.commodity)+' / '+esc(t.quality)+'</strong></div><div class="ticket-field"><small>ખરીદદાર</small><strong>'+esc(t.buyer)+'</strong></div><div class="ticket-field"><small>બેગ</small><strong>'+esc(t.bags)+'</strong></div><div class="ticket-field"><small>હરાજી જથ્થો (પ્રાથમિક)</small><strong>'+num(t.quantity)+' Q</strong></div><div class="ticket-field"><small>હરાજી ભાવ</small><strong>'+money(t.rate)+' / Q</strong></div><div class="ticket-field"><small>હરાજી પદ્ધતિ</small><strong>'+esc(t.method||"જાહેર હરાજી")+'</strong></div></div><div class="ticket-total"><div><small>પ્રાથમિક અંદાજિત કિંમત</small><div class="cell-sub">Final settlement નથી</div></div><strong>'+money(estimated)+'</strong></div><p class="ticket-note">આ દસ્તાવેજ હરાજી ભાવની નોંધ છે. અંતિમ ચૂકવવાપાત્ર રકમ verified net weighment અને મંજૂર કપાત પછીના sale bill મુજબ રહેશે.<br>Digital preview · Serial record · Operator: '+esc(t.createdBy||roleLabel())+'</p></div></div>';
}
function showTicket(t){
 ticketForPrint=t;
 openModal("ભાવ-કાપલી · "+t.ticketNo,"DIGITAL AUCTION TICKET",'<div id="ticketPrintArea">'+ticketHtml(t,"FARMER")+ticketHtml(t,"BUYER")+ticketHtml(t,"YARD")+'</div><div class="notice" style="margin-top:13px">Prototype QR demoમાં જો QR library load થાય તો જ encode થશે. Productionમાં signed verification URL, public lookup policy અને duplicate validation implement કરવી.</div>','<button class="btn" data-action="close-modal">બંધ કરો</button><button class="btn primary" data-action="print-ticket"><svg><use href="#i-print"/></svg>ત્રણેય નકલ Print કરો</button>');
 makeQRs();
}
function makeQRs(){if(!window.QRCode)return;$$(".qr-wrap[data-qr]").forEach(el=>{el.innerHTML="";try{new QRCode(el,{text:el.dataset.qr,width:60,height:60,colorDark:"#173d2d",colorLight:"#ffffff",correctLevel:QRCode.CorrectLevel.M});}catch(e){el.textContent="QR";}});}
function showLotDetail(id){
 const l=lotById(id);if(!l){toast("Lot મળ્યો નથી.","error");return;}
 const t=ticketByLot(id),b=billByLot(id);
 const timeline=[["ગેટ એન્ટ્રી",true],["હરાજી ટિકિટ",!!t],["વજન નોંધાયું",!!l.net],["Sale bill",!!b],["ચુકવણી પૂર્ણ",!!(b&&b.status==="paid")],["Gate pass / dispatch",!!l.passNo]];
 const body='<div class="inline-metric" style="margin-bottom:13px"><small>Unique Lot ID</small><strong>'+l.id+'</strong><small>'+esc(l.farmer)+' · '+esc(l.village)+' · '+esc(l.mobile)+'</small></div><div class="stage-list">'+timeline.map(x=>'<span class="stage '+(x[1]?"done":"")+'"></span>').join("")+'</div><div class="form-grid"><div class="ticket-field"><small>Commodity / crop</small><strong>'+esc(l.commodity)+'</strong></div><div class="ticket-field"><small>Arrival time / vehicle</small><strong>'+esc(l.arrival)+' · '+esc(l.vehicle)+'</strong></div><div class="ticket-field"><small>Bags / estimated quantity</small><strong>'+l.bags+' · '+num(l.estimated)+' Q</strong></div><div class="ticket-field"><small>Current status</small><strong>'+statusChip(l.status)+'</strong></div><div class="ticket-field"><small>Auction ticket</small><strong>'+(t?t.ticketNo:"Pending")+'</strong></div><div class="ticket-field"><small>Buyer / rate</small><strong>'+(t?esc(t.buyer)+" · "+money(t.rate):"—")+'</strong></div><div class="ticket-field"><small>Net weighment</small><strong>'+(l.net?num(l.net)+" Q":"Pending")+'</strong></div><div class="ticket-field"><small>Sale bill / payable</small><strong>'+(b?b.billNo+" · "+money(b.net):"Pending")+'</strong></div></div><div class="panel" style="margin-top:16px;padding:12px"><strong style="font-size:10px">Transaction timeline</strong><div class="activity-list" style="margin-top:8px">'+timeline.map(x=>'<div class="activity-item"><div class="activity-bullet '+(x[1]?"":"amber")+'">'+(x[1]?"✓":"·")+'</div><div class="activity-text"><strong>'+x[0]+'</strong><small>'+(x[1]?"Completed / demo record":"Not completed")+'</small></div></div>').join("")+'</div></div>';
 openModal("Lot detail · "+l.id,"TRACEABILITY · ONE LOT / ONE HISTORY",body,'<button class="btn" data-action="close-modal">બંધ કરો</button>'+(t?'<button class="btn primary" data-action="view-ticket" data-ref="'+t.ticketNo+'">Ticket જુઓ</button>':""));
}
function showBillDetail(no){
 const b=data.bills.find(x=>x.billNo===no);if(!b)return;
 const t=ticketByLot(b.lotId),deductions=b.deductionBreakdown||[];
 openModal("Sale bill · "+no,"FARMER SETTLEMENT STATEMENT",'<div class="ticket"><div class="ticket-top"><div class="ticket-logo">APMC YARDOS · SALE STATEMENT</div><h3>વેચાણ હિસાબ</h3><p>Demo record · '+today()+'</p></div><div class="ticket-grid"><div class="ticket-field"><small>Bill / Lot</small><strong>'+b.billNo+' / '+b.lotId+'</strong></div><div class="ticket-field"><small>ખેડૂત</small><strong>'+esc(b.farmer)+'</strong></div><div class="ticket-field"><small>ખરીદદાર</small><strong>'+esc(b.buyer)+'</strong></div><div class="ticket-field"><small>હરાજી ticket</small><strong>'+(t?t.ticketNo:"—")+'</strong></div><div class="ticket-field"><small>Final net weight</small><strong>'+num(b.weight)+' Q</strong></div><div class="ticket-field"><small>Approved rate</small><strong>'+money(b.rate)+' / Q</strong></div></div><div class="ticket-total"><span>Gross amount</span><strong>'+money(b.gross)+'</strong></div><div style="margin-top:10px;font-size:9px">Seller-side approved deduction (if applicable): '+money(b.sellerDeductions??b.deductions??0)+'</div><div class="ticket-total"><span>Farmer net payable</span><strong>'+money(b.net)+'</strong></div><div class="ticket-total"><span>Buyer market fee (separate liability)</span><strong>'+money(b.buyerMarketFee||0)+'</strong></div><div class="ticket-total"><span>Buyer other approved dues</span><strong>'+money(b.buyerOther||0)+'</strong></div><div class="ticket-total"><span>Buyer dues outstanding</span><strong>'+money((b.buyerTotalDue||0)-(b.buyerFeePaid||0))+'</strong></div><p class="ticket-note">Farmer payment status: '+(b.status==="paid"?"Paid":"Pending")+' · Ref: '+esc(b.paymentRef||"Not paid")+'<br>Buyer dues: '+esc(b.buyerFeeStatus||"paid")+' · Ref: '+esc(b.buyerPaymentRef||"—")+'</p></div>','<button class="btn" data-action="close-modal">બંધ કરો</button>'+(b.status==="payment_pending"?'<button class="btn primary" data-action="record-payment" data-ref="'+no+'">Payment નોંધો</button>':''));
}
function showComplaintDetail(id){
 const c=data.complaints.find(x=>x.id===id);if(!c)return;
 openModal("ફરિયાદ · "+id,"GRIEVANCE CASE",'<div class="form-grid"><div class="ticket-field"><small>ફરિયાદી</small><strong>'+esc(c.by)+'</strong></div><div class="ticket-field"><small>Lot ID</small><strong>'+esc(c.lotId)+'</strong></div><div class="ticket-field"><small>પ્રકાર</small><strong>'+esc(c.type)+'</strong></div><div class="ticket-field"><small>તારીખ / સ્થિતિ</small><strong>'+c.date+' · '+statusChip(c.status)+'</strong></div><div class="field full"><label>ફરિયાદની વિગત</label><textarea disabled>'+esc(c.details)+'</textarea></div><div class="field full"><label>Investigation note / resolution</label><textarea id="complaintResolution" placeholder="પુરાવા ચકાસણી, hearing, decision reason"></textarea></div></div>', '<button class="btn" data-action="close-modal">બંધ કરો</button><button class="btn primary" data-action="resolve-complaint" data-ref="'+id+'">ઉકેલ તરીકે સાચવો</button>');
}
function showPass(lot){
 if(!lot.passNo){toast("Gate pass બન્યો નથી.","error");return;}
 openModal("Gate pass · "+lot.passNo,"DISPATCH / EXIT PASS",'<div class="ticket"><div class="ticket-top"><div class="ticket-logo">APMC YARDOS · YARD EXIT RECORD</div><h3>માલ રવાના નોંધ</h3><p>Not a statutory transit permit unless approved</p></div><div class="ticket-grid"><div class="ticket-field"><small>Gate pass</small><strong>'+lot.passNo+'</strong></div><div class="ticket-field"><small>Lot ID</small><strong>'+lot.id+'</strong></div><div class="ticket-field"><small>ખેડૂત</small><strong>'+esc(lot.farmer)+'</strong></div><div class="ticket-field"><small>ખરીદદાર</small><strong>'+esc(lot.buyer)+'</strong></div><div class="ticket-field"><small>પાક / Net weight</small><strong>'+esc(lot.commodity)+' · '+num(lot.net)+' Q</strong></div><div class="ticket-field"><small>Vehicle</small><strong>'+esc(lot.vehicle)+'</strong></div><div class="ticket-field"><small>Sale bill</small><strong>'+esc(lot.billNo)+'</strong></div><div class="ticket-field"><small>Payment ref</small><strong>'+esc(lot.paymentRef||"")+'</strong></div></div><p class="ticket-note">આ demo yard exit record છે. Statutory permit અને જરૂરી transport documents અલગથી ચકાસવા.</p></div>','<button class="btn" data-action="close-modal">બંધ કરો</button>'+(lot.status==="paid"?'<button class="btn soft" data-action="mark-dispatched" data-ref="'+lot.id+'">Vehicle exit confirm</button>':'')+'<button class="btn primary" data-action="print-simple">Print</button>');
}
function exportCSV(filename,headers,rows){
 const csv=[headers,...rows].map(row=>row.map(v=>'"'+String(v??"").replace(/"/g,'""')+'"').join(",")).join("\r\n");
 const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8;"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url);toast("CSV export તૈયાર છે.", "ok",filename);
}
function exportLots(){exportCSV("apmc-lot-register.csv",["Lot ID","Farmer","Mobile","Village","Commodity","Bags","Vehicle","Arrival","Status","Net Q"],data.lots.map(l=>[l.id,l.farmer,l.mobile,l.village,l.commodity,l.bags,l.vehicle,l.arrival,l.status,l.net||""]));}
function exportTickets(){exportCSV("apmc-auction-tickets.csv",["Ticket","Lot ID","Farmer","Buyer","Commodity","Quantity Q","Rate per Q","Time"],data.tickets.map(t=>[t.ticketNo,t.lotId,t.farmer,t.buyer,t.commodity,t.quantity,t.rate,t.created]));}
function exportBills(){exportCSV("apmc-sale-bills.csv",["Bill","Lot ID","Farmer","Buyer","Net Q","Rate","Gross","Seller deductions","Farmer net payable","Farmer status","Farmer payment ref","Buyer market fee","Buyer other dues","Buyer dues total","Buyer dues paid","Buyer fee status","Buyer payment ref"],data.bills.map(b=>[b.billNo,b.lotId,b.farmer,b.buyer,b.weight,b.rate,b.gross,b.sellerDeductions??b.deductions,b.net,b.status,b.paymentRef||"",b.buyerMarketFee||0,b.buyerOther||0,b.buyerTotalDue||0,b.buyerFeePaid||0,b.buyerFeeStatus||"",b.buyerPaymentRef||""]));}
function exportAudit(){exportCSV("apmc-audit-log.csv",["Time","Actor","Action","Reference"],data.audit.map(a=>[a.time,a.actor,a.action,a.ref]));}
function exportAll(){exportLots();setTimeout(exportTickets,250);setTimeout(exportBills,500);setTimeout(exportAudit,750);}
function formToObject(form){return Object.fromEntries(new FormData(form).entries());}
function formSubmit(e){
 const f=e.target;if(!(f instanceof HTMLFormElement))return;
 e.preventDefault();if(!f.reportValidity())return;
 const v=formToObject(f);
 if(f.id==="entryForm"){
   const id="LOT-261103-"+String(data.nextLot++).padStart(3,"0");
   const l={id,farmer:v.farmer.trim(),mobile:v.mobile.trim(),village:v.village.trim(),commodity:v.commodity,bags:Number(v.bags),vehicle:v.vehicle.toUpperCase(),arrival:now(),status:"arrived",quality:v.quality,estimated:Number(v.estimated||0),notes:v.notes};
   data.lots.unshift(l);log("ગેટ એન્ટ્રી નોંધાઈ",id);save();closeModal();render();toast("ગેટ એન્ટ્રી સફળતાપૂર્વક નોંધાઈ.", "ok",id);return;
 }
 if(f.id==="ticketForm"){
   const l=lotById(v.lotId);if(!l||l.status!=="arrived"){toast("આ lotની હરાજી ticket પહેલેથી છે અથવા lot invalid છે.","error");return;}
   const t={ticketNo:"APMC-26-"+String(data.nextTicket++).padStart(5,"0"),lotId:l.id,farmer:l.farmer,buyer:v.buyer,commodity:l.commodity,quality:v.quality,bags:l.bags,quantity:Number(v.quantity),rate:Number(v.rate),method:v.method,notes:v.notes,created:now(),date:"03 Nov 2026",createdBy:roleLabel()};
   l.status="auctioned";l.ticketNo=t.ticketNo;l.buyer=t.buyer;l.rate=t.rate;l.provisional=t.rate*t.quantity;data.tickets.unshift(t);log("હરાજી ભાવ-કાપલી issue થઈ",t.ticketNo);save();closeModal();render();toast("ડિજિટલ ભાવ-કાપલી બની ગઈ.", "ok",t.ticketNo);showTicket(t);return;
 }
 if(f.id==="weighForm"){
   const l=lotById(f.dataset.lot),gross=Number(v.gross),tare=Number(v.tare),net=gross-tare;
   if(!l||net<=0){toast("Gross weight tare કરતાં વધારે હોવું જોઈએ.","error");return;}
   if(l.net && !confirm("આ lotનું અગાઉનું net weight બદલાશે. Audit logમાં correction નોંધાશે. આગળ વધવું?"))return;
   l.grossWeight=gross;l.tare=tare;l.net=Number(net.toFixed(3));l.scaleId=v.scaleId;l.slipRef=v.slipRef;l.weighNotes=v.notes;l.status="weighed";
   const t=ticketByLot(l.id),rate=t?t.rate:l.rate||0,grossAmt=Number((l.net*rate).toFixed(2));
   const sellerDeduction=Number(data.deductions?.sellerApproved||0);
   const buyerMarketFee=Number(data.deductions?.buyerMarketFee||0), buyerOther=Number(data.deductions?.buyerOther||0);
   let existing=billByLot(l.id);
   if(!existing){existing={billNo:"SB-26-"+String(data.nextBill++).padStart(5,"0"),lotId:l.id,farmer:l.farmer,buyer:l.buyer,weight:l.net,rate,gross:grossAmt,deductions:sellerDeduction,sellerDeductions:sellerDeduction,buyerMarketFee,buyerOther,buyerTotalDue:buyerMarketFee+buyerOther,buyerFeePaid:0,buyerFeeStatus:(buyerMarketFee+buyerOther)>0?"payment_pending":"paid",net:Math.max(0,grossAmt-sellerDeduction),status:"payment_pending",paid:0};data.bills.unshift(existing);l.billNo=existing.billNo;}
   else{existing.weight=l.net;existing.gross=grossAmt;existing.sellerDeductions=existing.sellerDeductions??existing.deductions??0;existing.net=Math.max(0,grossAmt-existing.sellerDeductions);}
   log("Actual gross / tare / net weight નોંધ્યું",l.id);log("Sale bill જનરેટ / update કર્યું",existing.billNo);save();closeModal();render();toast("વજન નોંધાયું અને sale statement update થયું.", "ok","Net "+num(l.net)+" Q");
   return;
 }
 if(f.id==="paymentForm"){
   const b=data.bills.find(x=>x.billNo===f.dataset.bill),amount=Number(v.amount),due=b?b.net-(b.paid||0):0;
   if(!b||amount<=0||amount>due+.001){toast("ચુકવણી રકમ માન્ય નથી.","error");return;}
   b.paid=Number(((b.paid||0)+amount).toFixed(2));b.paymentRef=v.ref.trim();b.paymentMode=v.mode;b.paymentNotes=v.notes;b.status=b.paid>=b.net-.01?"paid":"payment_pending";
   const l=lotById(b.lotId);if(l&&b.status==="paid")l.status="paid";
   log("ખેડૂત ચુકવણી નોંધાઈ: "+money(amount),b.billNo);save();closeModal();render();toast("Demo payment record નોંધાયો.", "ok",b.paymentRef);return;
 }
 if(f.id==="buyerFeeForm"){
   const b=data.bills.find(x=>x.billNo===f.dataset.bill),amount=Number(v.amount),due=b?Number(b.buyerTotalDue||0)-Number(b.buyerFeePaid||0):0;
   if(!b||amount<=0||amount>due+.001){toast("Buyer dues payment amount invalid.","error");return;}
   b.buyerFeePaid=Number(((b.buyerFeePaid||0)+amount).toFixed(2));b.buyerPaymentRef=v.ref.trim();b.buyerPaymentMode=v.mode;b.buyerFeeStatus=b.buyerFeePaid>=Number(b.buyerTotalDue||0)-.01?"paid":"payment_pending";
   log("Buyer-side market fee / dues collection noted: "+money(amount),b.billNo);save();closeModal();render();toast("Buyer collection record noted.","ok",b.buyerPaymentRef);return;
 }
 if(f.id==="complaintForm"){
   const id="CMP-26-"+String(data.nextComplaint++).padStart(5,"0");
   data.complaints.unshift({id,lotId:v.lotId||"Unlinked",by:v.by.trim(),mobile:v.mobile,type:v.type,details:v.details.trim()+(v.evidence?" · Evidence: "+v.evidence:""),status:"open",date:"03 Nov 2026"});
   log("નવી ફરિયાદ નોંધાઈ",id);save();closeModal();render();toast("ફરિયાદ નોંધાઈ.", "ok",id);return;
 }
 if(f.id==="roleForm"){data.role=v.role;save();closeModal();toast("Demo role બદલીને લાગુ કર્યો.", "ok",roleLabel());render();return;}
 if(f.id==="deductForm"){data.deductions={sellerApproved:Number(v.sellerApproved||0),buyerMarketFee:Number(v.buyerMarketFee||0),buyerOther:Number(v.buyerOther||0)};save();closeModal();toast("Buyer dues અને seller-side approved deductions અલગ સેવ થયા.","ok","Legal approval જરૂરી");return;}
 if(f.id==="commodityForm"){const name=v.name.trim();if(data.commodities.some(c=>c.toLowerCase()===name.toLowerCase())){toast("આ commodity પહેલેથી છે.","error");return;}data.commodities.push(name);save();closeModal();render();toast("Commodity ઉમેરાઈ.");return;}
}
function action(action,ref){
 switch(action){
  case "new-entry":showEntryForm();break;
  case "new-ticket":showTicketForm();break;
  case "new-complaint":showComplaintForm();break;
  case "choose-weigh":navTo("weighment");showWeighForm();break;
  case "weigh-lot":showWeighForm(ref);break;
  case "record-payment":showPaymentForm(ref);break;
  case "record-buyer-fee":showBuyerFeeForm(ref);break;
  case "view-ticket":{const t=data.tickets.find(x=>x.ticketNo===ref);if(t)showTicket(t);else toast("Ticket મળ્યો નથી.","error");break;}
  case "lot-detail":showLotDetail(ref);break;
  case "bill-detail":showBillDetail(ref);break;
  case "complaint-detail":showComplaintDetail(ref);break;
  case "resolve-complaint":{const c=data.complaints.find(x=>x.id===ref);if(c){c.status="resolved";c.resolution=$("#complaintResolution")?.value||"Closed by Inspector";c.closedAt=now();log("ફરિયાદ ઉકેલાઈ",ref);save();closeModal();render();toast("ફરિયાદ resolve થઈ.", "ok",ref);}break;}
  case "switch-role":showRolePicker();break;
  case "edit-deductions":showDeductions();break;
  case "add-commodity":showAddCommodity();break;
  case "close-modal":closeModal();break;
  case "print-ticket":window.print();break;
  case "print-simple":window.print();break;
  case "go-gate":navTo("gate");break;
  case "choose-pass":navTo("gatepass");break;
  case "create-pass":{if(!requireRole("gate"))break;const l=lotById(ref),bill=l?billByLot(l.id):null;if(!l||l.status!=="paid"){toast("Gate pass માટે farmer settlement complete હોવું જરૂરી છે.","error");break;}if(bill&&Number(bill.buyerTotalDue||0)>Number(bill.buyerFeePaid||0)){toast("Buyer-side market fee / dues બાકી છે. Buyer collection પછી gate pass બનાવો.","error");break;}if(!l.passNo){l.passNo="GP-26-"+String(data.nextPass++).padStart(5,"0");log("Gate pass issue કર્યો",l.passNo);save();}showPass(l);render();break;}
  case "view-pass":showPass(lotById(ref));break;
  case "mark-dispatched":{if(!requireRole("gate"))break;const l=lotById(ref);if(l&&l.passNo&&l.status==="paid"){l.status="dispatched";l.exitAt=now();log("વાહન ગેટમાંથી બહાર નીકળ્યું",l.passNo);save();closeModal();render();toast("Vehicle exit record નોંધાયો.","ok",l.passNo);}break;}
  case "report-csv":{const i=Number(ref);[exportLots,exportTickets,()=>exportCSV("apmc-weighment.csv",["Lot ID","Gross Q","Tare Q","Net Q","Scale"],data.lots.filter(l=>l.net).map(l=>[l.id,l.grossWeight,l.tare,l.net,l.scaleId])),exportBills,exportBills,()=>exportCSV("apmc-complaints.csv",["ID","Lot","By","Type","Details","Status"],data.complaints.map(c=>[c.id,c.lotId,c.by,c.type,c.details,c.status])),exportAudit][i]?.();break;}
  case "export-all":exportAll();break;
  case "export-audit":exportAudit();break;
  case "export-payments":exportBills();break;
  case "quick-report":exportLots();break;
  case "reset-demo":if(confirm("તમારા browserમાં સાચવેલા બધા demo changes દૂર કરીને શરૂઆતનો demo data પાછો મૂકીશું. આગળ વધવું?")){data=seed();save();render();toast("Demo data reset થઈ ગયું.");}break;
 }
}
document.addEventListener("click",e=>{
 const nav=e.target.closest("[data-view]");if(nav){navTo(nav.dataset.view);return;}
 const a=e.target.closest("[data-action]");if(a){action(a.dataset.action,a.dataset.ref);return;}
 if(e.target===$("#modalBackdrop"))closeModal();
});
document.addEventListener("submit",formSubmit);
document.addEventListener("input",e=>{
 if(e.target.id==="tableSearch"){searchTerm=e.target.value;const pos=e.target.selectionStart;render();const box=$("#tableSearch");if(box){box.focus();box.setSelectionRange(pos,pos);}}
 if(e.target.id==="globalSearch"){searchTerm=e.target.value;}
});
function showSearchResults(q){
 const lots=data.lots.filter(l=>[l.id,l.farmer,l.mobile,l.commodity,l.vehicle].join(" ").toLowerCase().includes(q.toLowerCase())).slice(0,8);
 const tickets=data.tickets.filter(t=>[t.ticketNo,t.lotId,t.farmer,t.buyer].join(" ").toLowerCase().includes(q.toLowerCase())).slice(0,5);
 const rows=lots.map(l=>'<tr><td><button class="id-link" data-action="lot-detail" data-ref="'+l.id+'">'+l.id+'</button></td><td>'+esc(l.farmer)+'</td><td>'+esc(l.commodity)+'</td><td>'+statusChip(l.status)+'</td><td>'+rowAction("ખોલો","lot-detail",l.id)+'</td></tr>').join("")+tickets.map(t=>'<tr><td><button class="id-link" data-action="view-ticket" data-ref="'+t.ticketNo+'">'+t.ticketNo+'</button></td><td>'+esc(t.farmer)+'</td><td>'+esc(t.commodity)+'</td><td>'+money(t.rate)+'</td><td>'+rowAction("કાપલી","view-ticket",t.ticketNo)+'</td></tr>').join("");
 openModal("Search results · "+q,"GLOBAL SEARCH",'<div class="table-scroll"><table><thead><tr><th>Record ID</th><th>ખેડૂત</th><th>પાક</th><th>સ્થિતિ / ભાવ</th><th></th></tr></thead><tbody>'+(rows||noRows("કોઈ matching record નથી"))+'</tbody></table></div>','<button class="btn" data-action="close-modal">બંધ કરો</button>');
}
$("#modalClose").addEventListener("click",closeModal);
$("#closeSidebar").addEventListener("click",()=>$("#sidebar").classList.remove("open"));
$("#menuToggle").addEventListener("click",()=>$("#sidebar").classList.toggle("open"));
$("#resetDemo").addEventListener("click",()=>action("reset-demo"));
$("#notificationBtn").addEventListener("click",()=>toast("2 reminders: 1 payment pending · 1 complaint under review.","ok","Demo notification centre"));
$("#languageToggle").addEventListener("click",()=>{data.language=data.language==="gu"?"en":"gu";save();$("#languageToggle").innerHTML=data.language==="gu"?"GU <span>⌄</span>":"EN <span>⌄</span>";toast(data.language==="gu"?"ગુજરાતી interface selected.":"Gujarati-first prototype; English mode is a preview toggle.");});
$("#globalSearch").addEventListener("keydown",e=>{if(e.key==="Enter"&&e.target.value.trim())showSearchResults(e.target.value.trim());if(e.key==="Escape"){e.target.value="";e.target.blur();}});
$("#topUser")?.addEventListener("click",showRolePicker);
render();
})();