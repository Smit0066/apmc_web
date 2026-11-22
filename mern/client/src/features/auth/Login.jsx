import { useState } from 'react';
import { AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { api, setSession } from '../../services/api.js';

export function Login({onLogin}) {
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
