import { roles } from '../../constants/roles.js';

export const field = (key,label,type='text',extra={}) => ({key,label,type,...extra});
export function FormFieldsFor(page,options) {
  if(page==='gate') return [
    field('sellerType','વેચનારનો પ્રકાર','select',{required:true,options:[{value:'farmer',label:'ખેડૂત'},{value:'trader',label:'વેપારી / Registered seller'}],defaultValue:'farmer'}),
    field('farmerName','ખેડૂત / વેચનારનું નામ','text',{required:true}),
    field('mobile','મોબાઇલ નંબર','text',{required:true,placeholder:'10 અંકનો નંબર'}),
    field('state','રાજ્ય','text',{required:true,defaultValue:'Gujarat'}),field('district','જિલ્લો'),field('taluka','તાલુકો'),field('village','ગામ','text',{required:true}),
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
