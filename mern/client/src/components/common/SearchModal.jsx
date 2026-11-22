import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { api } from '../../services/api.js';
import { labelFor, money } from '../../utils/format.js';
import { Modal } from './Modal.jsx';

export function SearchModal({ query, onClose, onOpenLot, onOpenTicket }) {
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let live = true;
    setResult(null); setError('');
    api('/yard/search?q=' + encodeURIComponent(query)).then(r => live && setResult(r)).catch(e => live && setError(e.message));
    return () => { live = false; };
  }, [query]);
  const empty = result && !result.lots.length && !result.tickets.length;
  return <Modal title={'Search results · ' + query} onClose={onClose} wide>
    {error && <div className="inline-error"><AlertCircle size={15}/>{error}</div>}
    {!result && !error && <div className="loading-panel">શોધી રહ્યા છીએ…</div>}
    {empty && <div className="empty-state"><b>કોઈ matching record નથી</b><span>બીજો શબ્દ અજમાવો (ઓછામાં ઓછા 2 અક્ષર).</span></div>}
    {result && !empty && <div className="table-wrap"><table><thead><tr><th>Record ID</th><th>ખેડૂત</th><th>પાક</th><th>સ્થિતિ / ભાવ</th><th></th></tr></thead><tbody>
      {result.lots.map(l => <tr key={l._id}><td>{l.lotNumber}</td><td>{l.farmerName}</td><td>{l.commodity}</td><td>{labelFor(l.status)}</td><td><button className="row-action" onClick={() => onOpenLot(l._id)}>ખોલો</button></td></tr>)}
      {result.tickets.map(t => <tr key={t._id}><td>{t.ticketNumber}</td><td>{t.lot?.farmerName}</td><td>{t.lot?.commodity}</td><td>{money(t.rate)}</td><td><button className="row-action" onClick={() => onOpenTicket(t)}>કાપલી</button></td></tr>)}
    </tbody></table></div>}
  </Modal>;
}
