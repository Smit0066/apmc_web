import { ArrowRight, ClipboardList } from 'lucide-react';
import { getPath, textValue } from '../../utils/format.js';

export function DataTable({columns,rows,onRowAction,actionLabel,secondaryAction,compact=false,empty='કોઈ રેકોર્ડ મળ્યો નથી.'}) {
  if(!rows?.length)return <div className="empty-state"><div className="empty-icon"><ClipboardList size={23}/></div><b>{empty}</b><span>નવી એન્ટ્રી ઉમેરો અથવા search બદલો.</span></div>;
  return <div className="table-wrap"><table className={compact?'compact-table':''}><thead><tr>{columns.map(([key,label])=><th key={key}>{label}</th>)}{(onRowAction||secondaryAction)&&<th>Action</th>}</tr></thead><tbody>{rows.map((item,index)=><tr key={item._id||item.id||index}>{columns.map(([key])=>{
    const value=getPath(item,key);
    const isStatus=key==='status'||key==='active';
    return <td key={key}>{isStatus?<span className={'status-pill '+(value==='paid'||value==='dispatched'||value==='resolved'||value===true?'good':value==='open'||value==='payment_pending'||value===false?'warn':'neutral')}>{textValue(value,key)}</span>:textValue(value,key)}</td>;
  })}{(onRowAction||secondaryAction)&&<td>{onRowAction&&<button className="row-action" onClick={()=>onRowAction(item)}>{actionLabel||'ખોલો'} <ArrowRight size={13}/></button>}{secondaryAction&&<button className="row-action secondary" onClick={()=>secondaryAction.onClick(item)}>{secondaryAction.label}</button>}</td>}</tr>)}</tbody></table></div>;
}
