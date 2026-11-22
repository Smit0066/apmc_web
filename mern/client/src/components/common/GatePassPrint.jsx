import { Printer } from 'lucide-react';
import { labelFor, number, dateTime } from '../../utils/format.js';

export function GatePassPrint({ pass }) {
  const lot = pass.lot || {};
  const fields = [
    ['Gate pass', pass.passNumber], ['Lot ID', lot.lotNumber], ['ખેડૂત', lot.farmerName], ['ખરીદદાર', pass.buyer?.name],
    ['પાક', lot.commodity], ['Net વજન', lot.netWeight != null ? number(lot.netWeight) + ' Q' : '—'], ['વાહન', pass.vehicle || lot.vehicle],
    ['સ્થિતિ', labelFor(pass.status)], ['Issued', dateTime(pass.issuedAt)], ['Dispatch', pass.dispatchAt ? dateTime(pass.dispatchAt) : '—'],
    ['Issued by', pass.issuedBy?.name], ['Override reason', pass.overrideReason || '—']
  ];
  return <div>
    <div className="print-area"><div className="ticket"><div className="ticket-top"><div className="ticket-logo">APMC YARDOS · YARD EXIT RECORD</div><h3>માલ રવાના નોંધ</h3><p>Not a statutory transit permit unless approved</p></div>
      <div className="ticket-grid">{fields.map(([k, v]) => <div className="ticket-field" key={k}><small>{k}</small><strong>{v || '—'}</strong></div>)}</div></div></div>
    <div className="form-actions"><button className="btn primary" onClick={() => window.print()}><Printer size={15}/> Print</button></div>
  </div>;
}
