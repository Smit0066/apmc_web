import { useEffect, useState } from 'react';
import { Printer } from 'lucide-react';
import { api } from '../../services/api.js';
import { labelFor, money, number, dateTime } from '../../utils/format.js';

// Same QR library the reference prototype uses; falls back to a text placeholder when unavailable/offline.
const QR_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
const loadQr = () => window.QRCode ? Promise.resolve(window.QRCode) : new Promise(resolve => {
  const script = document.createElement('script');
  script.src = QR_SRC; script.async = true;
  script.onload = () => resolve(window.QRCode || null); script.onerror = () => resolve(null);
  document.head.appendChild(script);
});

const COPIES = [['FARMER','વેચનારની નકલ'],['BUYER','ખરીદદારની નકલ'],['YARD','યાર્ડની ઓફિસ નકલ']];

function Ticket({ ticket, copy, label, yardName }) {
  const lot = ticket.lot || {};
  const identity = lot.sellerType === 'trader'
    ? 'Trader Registration: ' + (lot.traderRegistrationNo || '—')
    : 'Farmer ID: ' + (lot.farmerRegistryId || '—') + ' · ' + (lot.landRecordType || 'Land Record') + ': ' + (lot.landRecordNo || '—');
  const qrText = [ticket.ticketNumber, lot.lotNumber, ticket.rate].join('|');
  const fields = [
    ['Lot ID', lot.lotNumber], ['વેચનારનો પ્રકાર', lot.sellerType === 'trader' ? 'વેપારી' : 'ખેડૂત'],
    ['વેચનાર / ખેડૂતનું નામ', lot.farmerName], ['વેચનાર ઓળખ', identity],
    ['પાક / Grade', (lot.commodity || '—') + ' / ' + (ticket.quality || '—')], ['ખરીદદાર', ticket.buyer?.name],
    ['ખરીદદાર Registration ID', ticket.buyer?.registrationNo || '—'], ['બેગ', lot.bags],
    ['હરાજી જથ્થો (પ્રાથમિક)', number(ticket.quantity) + ' Q'], ['હરાજી ભાવ', money(ticket.rate) + ' / Q'],
    ['હરાજી પદ્ધતિ', labelFor(ticket.method)], ['પ્રાથમિક કિંમત', money(ticket.quantity * ticket.rate)],
    ['ખેડૂત ચુકવણી deadline', dateTime(ticket.farmerPaymentDueAt)], ['માલ નિકાલ deadline', dateTime(ticket.dispatchDueAt)],
    ['વેપારી credit due', dateTime(ticket.buyerCreditDueAt)]
  ];
  return <div className="ticket-copy"><div className="ticket-copy-label">{copy} COPY · {label}</div>
    <div className="ticket">
      <div className="ticket-top"><div className="ticket-logo">APMC YARDOS · DIGITAL MARKET RECORD</div><h3>હરાજી ભાવ-કાપલી</h3><p>{yardName} · {dateTime(ticket.createdAt)}</p></div>
      <div className="ticket-no"><div><small>ટિકિટ નંબર</small><strong>{ticket.ticketNumber}</strong></div><div className="qr-wrap" data-qr={qrText}><span>QR</span></div></div>
      <div className="ticket-grid">{fields.map(([k, v]) => <div className="ticket-field" key={k}><small>{k}</small><strong>{v ?? '—'}</strong></div>)}</div>
    </div></div>;
}

export function TicketPrint({ ticket }) {
  const [yardName, setYardName] = useState('APMC Market Yard');
  useEffect(() => { api('/yard/settings').then(d => d.item?.committeeName && setYardName(d.item.committeeName)).catch(() => {}); }, []);
  useEffect(() => {
    let live = true;
    loadQr().then(QRCode => {
      if (!live || !QRCode) return;
      document.querySelectorAll('.qr-wrap[data-qr]').forEach(el => {
        el.innerHTML = '';
        try { new QRCode(el, { text: el.dataset.qr, width: 60, height: 60, colorDark: '#173d2d', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.M }); }
        catch { el.textContent = 'QR'; }
      });
    });
    return () => { live = false; };
  }, [ticket]);
  return <div>
    <div className="print-area">{COPIES.map(([copy, label]) => <Ticket key={copy} ticket={ticket} copy={copy} label={label} yardName={yardName}/>)}</div>
    <div className="form-actions"><button className="btn primary" onClick={() => window.print()}><Printer size={15}/> ત્રણેય નકલ Print કરો</button></div>
  </div>;
}
