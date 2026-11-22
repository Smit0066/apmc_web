import { useState } from 'react';
import { LogOut, Menu, X } from 'lucide-react';
import { roles } from '../constants/roles.js';
import { navigation } from '../constants/navigation.js';
import { Dashboard } from '../features/dashboard/Dashboard.jsx';
import { ModuleScreen } from '../features/yard/ModuleScreen.jsx';
import { SettingsScreen } from '../features/settings/SettingsScreen.jsx';
import { ReportsScreen } from '../features/reports/ReportsScreen.jsx';

export function Workspace({user,onLogout,notify}) {
  const [page,setPage]=useState('dashboard');const [mobileMenu,setMobileMenu]=useState(false);const [search,setSearch]=useState('');
  const accessible=navigation.filter(n=>n.roles.includes(user.role));
  const selected=navigation.find(n=>n.id===page)||navigation[0];
  const goto=id=>{setPage(id);setMobileMenu(false);setSearch('')};
  return <div className="app-layout">
    {mobileMenu&&<button className="mobile-overlay" onClick={()=>setMobileMenu(false)} aria-label="Close menu"/>}
    <aside className={'sidebar '+(mobileMenu?'sidebar-open':'')}>
      <div className="sidebar-brand"><span className="brand-logo">A</span><div><b>APMC YardOS</b><small>Digital Management</small></div><button className="icon-btn sidebar-close" onClick={()=>setMobileMenu(false)}><X size={18}/></button></div>
      <div className="yard-tag">MARKET YARD · OPERATIONS</div>
      <nav className="side-nav">{accessible.map(item=><button key={item.id} className={page===item.id?'nav-link active':'nav-link'} onClick={()=>goto(item.id)}><item.icon size={18}/><span><b>{item.label}</b><small>{item.sub}</small></span>{page===item.id&&<i/>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="user-mini"><span className="user-avatar">{user.name.slice(0,1).toUpperCase()}</span><div><b>{user.name}</b><small>{roles[user.role]}</small></div></div><button onClick={onLogout} className="logout-btn"><LogOut size={16}/> Sign out</button></div>
    </aside>
    <main className="workspace-main">
      <header className="topbar"><button className="icon-btn mobile-trigger" onClick={()=>setMobileMenu(true)}><Menu size={20}/></button><div className="breadcrumb"><span>APMC YardOS</span><i>/</i><b>{selected.sub}</b></div><div className="topbar-right"><span className="server-indicator"><i/> Authenticated</span><span className="top-user">{user.name}</span><span className="user-avatar small">{user.name.slice(0,1).toUpperCase()}</span><button onClick={onLogout} className="icon-btn desktop-logout" title="Sign out"><LogOut size={17}/></button></div></header>
      <div className="workspace-content">
        {page==='dashboard'?<Dashboard user={user} onNavigate={goto}/>
        :page==='settings'?<SettingsScreen notify={notify}/>
        :page==='reports'?<ReportsScreen/>
        :<ModuleScreen page={page} user={user} notify={notify}/>}
        <footer className="app-footer">APMC YardOS · Operational records are stored on the configured server database.</footer>
      </div>
    </main>
  </div>;
}
