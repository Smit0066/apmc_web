import { deadlineLabel } from './time.js';
export const labelFor = value => ({
  arrived:'આવક નોંધાઈ',auctioned:'હરાજી પૂર્ણ',weighed:'તોલ પૂર્ણ',payment_pending:'ચુકવણી બાકી',
  part_paid:'આંશિક ચુકવણી',paid:'ચુકવણી પૂર્ણ',dispatched:'માલ રવાના',held:'Hold',
  open:'ખુલ્લી',investigating:'તપાસમાં',resolved:'ઉકેલાઈ',rejected:'નામંજૂર',
  farmer_settlement:'ખેડૂત ચુકવણી',buyer_purchase:'વેપારી ખરીદ',buyer_fee:'Buyer dues',
  open_outcry:'જાહેર હરાજી',e_auction:'e-Auction',approved_negotiated:'મંજૂર Negotiated',
  admin:'Administrator',gate:'Gate Operator',auction:'Auction Operator',weighment:'Weighment Operator',accounts:'Accounts Officer',inspector:'Inspector'
}[value] || String(value ?? '—'));
export const getPath = (obj,path) => path.split('.').reduce((v,k)=>v?.[k],obj);
export const textValue = (value,key) => {
  if (value === null || value === undefined || value === '') return '—';
  if (key.endsWith('DueAt')) return dateTime(value) + ' · ' + deadlineLabel(value);
  if (key.toLowerCase().includes('amount') || ['grossAmount','farmerNetPayable','purchaseLimit','gross','rate','amount','ledger.gross','ledger.paid','ledger.outstanding','ledger.exposure'].includes(key)) return money(value);
  if (/At$/.test(key)) return dateTime(value);
  if (key === 'active') return value ? 'હા' : 'ના';
  if (key === 'sellerType') return value === 'trader' ? 'વેપારી' : 'ખેડૂત';
  if (key === 'status' || key === 'type' || key === 'role' || key === 'method') return labelFor(value);
  if (typeof value === 'number') return number(value);
  return String(value);
};
export const money = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(value || 0));
export const number = value => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 3 }).format(Number(value || 0));
export const dateTime = value => value ? new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
