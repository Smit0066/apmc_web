import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, LogOut, Menu, Search, X } from 'lucide-react';
import { roles } from '../constants/roles.js';
import { navigation } from '../constants/navigation.js';
import { api } from '../services/api.js';
import { Dashboard } from '../features/dashboard/Dashboard.jsx';
import { ModuleScreen } from '../features/yard/ModuleScreen.jsx';
import { DetailModal } from '../features/yard/DetailModal.jsx';
import { SettingsScreen } from '../features/settings/SettingsScreen.jsx';
import { ReportsScreen } from '../features/reports/ReportsScreen.jsx';
import { SearchModal } from '../components/common/SearchModal.jsx';

export function Workspace({user,onLogout,notify}) {
  const [page,setPage]=useState('dashboard');const [mobileMenu,setMobileMenu]=useState(false);
  const [searchText,setSearchText]=useState('');const [searchQuery,setSearchQuery]=useState('');const [detail,setDetail]=useState(null);
  const [counts,setCounts]=useState(null);const [bellOpen,setBellOpen]=useState(false);const [yardName,setYardName]=useState('');
  const searchRef=useRef(null);
  const accessible=navigation.filter(n=>n.roles.includes(user.role));
  const selected=navigation.find(n=>n.id===page)||navigation[0];
  const goto=id=>{setPage(id);setMobileMenu(false);setBellOpen(false)};

  const loadCounts=useCallback(()=>{api('/yard/nav-counts').then(setCounts).catch(()=>{})},[]);
  useEffect(()=>{loadCounts();const timer=setInterval(loadCounts,60000);return()=>clearInterval(timer)},[loadCounts,page]);
  useEffect(()=>{api('/yard/settings').then(d=>setYardName(d.item?.committeeName||'')).catch(()=>{})},[]);
  useEffect(()=>{const onKey=e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();searchRef.current?.focus()}};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey)},[]);

  const submitSearch=e=>{e.preventDefault();const q=searchText.trim();if(q.length>=2)setSearchQuery(q)};
  const openLot=async id=>{try{const data=await api('/yard/lots/'+id);setSearchQuery('');setDetail({kind:'lot',data})}catch(e){notify(e.message,'error')}};
  const openTicket=ticket=>{setSearchQuery('');setDetail({kind:'ticket',data:ticket})};
  const voidTicket=async(ticket,reason)=>{await api('/yard/tickets/'+ticket._id+'/void',{method:'POST',body:{reason}});notify('Ticket cancel થઈ ગઈ.');setDetail(null);loadCounts()};

  const badge={auction:counts?.auctionQueue,disputes:counts?.openComplaints};
  const reminders=counts?[
    ['open complaints (તપાસ બાકી)',counts.openComplaints,'disputes'],['ખેડૂત ચુકવણી deadline વટાવી',counts.farmerOverdue,'payments'],
    ['વેપારી credit overdue',counts.buyerOverdue,'buyerledger'],['માલ નિકાલ deadline વટાવી',counts.dispatchOverdue,'gatepass']
  ].filter(([,n])=>n>0):[];
  return <div className="app-layout">
    {mobileMenu&&<button className="mobile-overlay" onClick={()=>setMobileMenu(false)} aria-label="Close menu"/>}
    <aside className={'sidebar '+(mobileMenu?'sidebar-open':'')}>
      <div className="sidebar-brand"><span className="brand-logo">A</span><div><b>APMC YardOS</b><small>Digital Management</small></div><button className="icon-btn sidebar-close" onClick={()=>setMobileMenu(false)}><X size={18}/></button></div>
      <div className="yard-tag">{yardName?'MARKET YARD · '+yardName.toUpperCase():'MARKET YARD · OPERATIONS'}</div>
      <nav className="side-nav">{accessible.map(item=><button key={item.id} className={page===item.id?'nav-link active':'nav-link'} onClick={()=>goto(item.id)}><item.icon size={18}/><span><b>{item.label}</b><small>{item.sub}</small></span>{badge[item.id]>0&&<em className="nav-badge">{badge[item.id]}</em>}{page===item.id&&<i/>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="user-mini"><span className="user-avatar">{user.name.slice(0,1).toUpperCase()}</span><div><b>{user.name}</b><small>{roles[user.role]}</small></div></div><button onClick={onLogout} className="logout-btn"><LogOut size={16}/> Sign out</button></div>
    </aside>
    <main className="workspace-main">
      <header className="topbar"><button className="icon-btn mobile-trigger" onClick={()=>setMobileMenu(true)}><Menu size={20}/></button><div className="breadcrumb"><span>APMC YardOS</span><i>/</i><b>{selected.sub}</b></div>
        <form className="global-search" onSubmit={submitSearch} role="search"><Search size={15}/><input ref={searchRef} value={searchText} onChange={e=>setSearchText(e.target.value)} onKeyDown={e=>{if(e.key==='Escape'){setSearchText('');e.target.blur()}}} placeholder="ટિકિટ, ખેડૂત, વાહન શોધો…" aria-label="Global search" autoComplete="off"/><kbd>⌘K</kbd></form>
        <div className="topbar-right"><span className="server-indicator"><i/> Authenticated</span>
          <div className="bell-wrap"><button className="icon-btn" onClick={()=>{setBellOpen(v=>!v);loadCounts()}} aria-label="Reminders" aria-expanded={bellOpen}><Bell size={18}/>{reminders.length>0&&<em className="bell-dot"/>}</button>
            {bellOpen&&<div className="bell-panel" role="menu"><b>Reminders</b>{reminders.length?reminders.map(([label,n,target])=><button key={label} onClick={()=>goto(target)}><span>{label}</span><strong>{n}</strong></button>):<p>કોઈ pending reminder નથી.</p>}</div>}</div>
          <span className="top-user">{user.name}</span><span className="user-avatar small">{user.name.slice(0,1).toUpperCase()}</span><button onClick={onLogout} className="icon-btn desktop-logout" title="Sign out"><LogOut size={17}/></button></div></header>
      <div className="workspace-content">
        {page==='dashboard'?<Dashboard user={user} onNavigate={goto}/>
        :page==='settings'?<SettingsScreen notify={notify} onNavigate={goto}/>
        :page==='reports'?<ReportsScreen user={user} notify={notify}/>
        :<ModuleScreen page={page} user={user} notify={notify}/>}
        <footer className="app-footer">APMC YardOS · Operational records are stored on the configured server database.</footer>
      </div>
    </main>
    {searchQuery&&<SearchModal query={searchQuery} onClose={()=>setSearchQuery('')} onOpenLot={openLot} onOpenTicket={openTicket}/>}
    {detail&&<DetailModal detail={detail} user={user} onClose={()=>setDetail(null)} onVoidTicket={voidTicket} onPrint={t=>setDetail({kind:'ticketprint',data:t})}/>}
  </div>;
}
