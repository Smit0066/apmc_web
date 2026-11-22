import { Printer } from 'lucide-react';
import { labelFor, money, number, dateTime } from '../../utils/format.js';
import { Modal } from '../../components/common/Modal.jsx';
import { TicketPrint } from '../../components/common/TicketPrint.jsx';
import { GatePassPrint } from '../../components/common/GatePassPrint.jsx';

export function DetailModal({detail,onClose,user,onVoidTicket,onPrint}) {
  const {kind,data}=detail;
  if(kind==='ticketprint')return <Modal title={'ભાવ-કાપલી · '+data.ticketNumber} onClose={onClose} wide><TicketPrint ticket={data}/></Modal>;
  if(kind==='passprint')return <Modal title={'Gate pass · '+data.passNumber} onClose={onClose} wide><GatePassPrint pass={data}/></Modal>;
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
    <div className="form-actions">{kind==='ticket'&&onPrint&&<button className="btn secondary" onClick={()=>onPrint(data)}><Printer size={15}/> Print ticket</button>}{kind==='ticket'&&user?.role==='admin'&&<button className="btn danger" onClick={async()=>{const reason=window.prompt('Ticket cancellation / correction reason (minimum 8 characters):');if(reason&&reason.trim().length>=8){try{await onVoidTicket(data,reason.trim())}catch(error){window.alert(error.message)}}}}>Cancel ticket</button>}<button className="btn ghost" onClick={onClose}>Close</button><button className="btn primary" onClick={()=>window.print()}><Printer size={15}/> Print</button></div>
  </Modal>;
}
