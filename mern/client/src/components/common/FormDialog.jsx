import { useState } from 'react';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { Modal } from './Modal.jsx';

export function FormDialog({title,fields,initialValues={},onClose,onSubmit,submitLabel='સાચવો',busy=false}) {
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
              <option value="">પસંદ કરો</option>{(f.options||[]).map(o=><option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>)}
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
