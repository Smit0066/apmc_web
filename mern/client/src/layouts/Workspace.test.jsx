import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, waitFor, within, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Workspace } from './Workspace.jsx';
import { navigation } from '../constants/navigation.js';
import { mockFetch } from '../test/mockFetch.js';

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
const u = (role, name = 'Asha Patel') => ({ id: 'u1', name, role });
const counts = { openComplaints: 2, auctionQueue: 3, farmerOverdue: 1, buyerOverdue: 0, dispatchOverdue: 4 };
const routes = (o = {}) => new Proxy({
  'GET /yard/nav-counts': counts, 'GET /yard/settings': { item: { committeeName: 'Surat APMC', commodities: [] } },
  'GET /yard/overview': { stats: {} }, 'GET /yard/lots?limit=6': { items: [] },
  'GET /yard/dashboard': { status: { auctionPending: 0, passesIssued: 0, dispatched: 0, inYard: 0, quintalsInside: 0 }, stock: [], farmerDues: [], traderDues: [], farmerTotals: { payable: 0, paid: 0, due: 0, provisional: 0 }, arrivalsByHour: [], activity: [] },
  'GET /yard/audit?page=1&limit=25': { items: [], total: 0 }, 'GET /yard/lots?page=1&limit=25': { items: [], total: 0 },
  ...o }, {});
const navButtons = () => within(document.querySelector('.side-nav')).getAllByRole('button').map(b => b.querySelector('b').textContent);

describe('Workspace', () => {
  it.each(['admin', 'gate', 'auction', 'weighment', 'accounts', 'inspector'])('shows only the modules %s may access', async role => {
    mockFetch(routes());
    render(<Workspace user={u(role)} onLogout={() => {}} notify={() => {}}/>);
    const expected = navigation.filter(n => n.roles.includes(role)).map(n => n.label);
    expect(navButtons()).toEqual(expected);
    await screen.findByText(/MARKET YARD · SURAT APMC/);
  });
  it('shows user identity, role label, avatar initial and the yard name', async () => {
    mockFetch(routes());
    render(<Workspace user={u('accounts')} onLogout={() => {}} notify={() => {}}/>);
    expect(screen.getAllByText('Asha Patel').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Accounts Officer').length).toBeGreaterThan(0);
    expect(screen.getAllByText('A', { selector: '.user-avatar' }).length).toBeGreaterThan(0);
    expect(await screen.findByText('MARKET YARD · SURAT APMC')).toBeInTheDocument();
  });
  it('falls back to a generic yard tag when settings fail', async () => {
    mockFetch(routes({ 'GET /yard/settings': { status: 500, body: { message: 'x' } } }));
    render(<Workspace user={u('admin')} onLogout={() => {}} notify={() => {}}/>);
    expect(await screen.findByText('MARKET YARD · OPERATIONS')).toBeInTheDocument();
  });
  it('navigates between modules and updates the breadcrumb', async () => {
    mockFetch(routes());
    render(<Workspace user={u('admin')} onLogout={() => {}} notify={() => {}}/>);
    expect(document.querySelector('.breadcrumb b').textContent).toBe('Dashboard');
    await userEvent.click(screen.getByRole('button', { name: /Audit Trail/ }));
    expect(document.querySelector('.breadcrumb b').textContent).toBe('Audit Trail');
    expect(await screen.findByText('Append-only Audit Trail', { selector: 'h1' })).toBeInTheDocument();
  });
  it('shows nav badges for the auction queue and open complaints', async () => {
    mockFetch(routes());
    render(<Workspace user={u('admin')} onLogout={() => {}} notify={() => {}}/>);
    const auction = screen.getByRole('button', { name: /Auction & Tickets/ });
    await waitFor(() => expect(within(auction).getByText('3')).toHaveClass('nav-badge'));
    expect(within(screen.getByRole('button', { name: /Complaints/ })).getByText('2')).toBeInTheDocument();
  });
  it('bell lists only non-zero reminders and navigates to the relevant module', async () => {
    mockFetch(routes());
    render(<Workspace user={u('admin')} onLogout={() => {}} notify={() => {}}/>);
    await waitFor(() => expect(document.querySelector('.bell-dot')).not.toBeNull());
    await userEvent.click(screen.getByRole('button', { name: 'Reminders' }));
    const menu = screen.getByRole('menu');
    expect(within(menu).getByText('open complaints (તપાસ બાકી)')).toBeInTheDocument();
    expect(within(menu).getByText('માલ નિકાલ deadline વટાવી')).toBeInTheDocument();
    expect(within(menu).queryByText('વેપારી credit overdue')).toBeNull();
    await userEvent.click(within(menu).getByText('માલ નિકાલ deadline વટાવી'));
    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.querySelector('.breadcrumb b').textContent).toBe('Gate Pass & Dispatch');
  });
  it('bell shows an empty message and no dot when nothing is pending', async () => {
    mockFetch(routes({ 'GET /yard/nav-counts': { openComplaints: 0, auctionQueue: 0, farmerOverdue: 0, buyerOverdue: 0, dispatchOverdue: 0 } }));
    render(<Workspace user={u('admin')} onLogout={() => {}} notify={() => {}}/>);
    await userEvent.click(screen.getByRole('button', { name: 'Reminders' }));
    expect(screen.getByText('કોઈ pending reminder નથી.')).toBeInTheDocument();
    expect(document.querySelector('.bell-dot')).toBeNull();
  });
  it('survives a failing nav-counts request', async () => {
    mockFetch(routes({ 'GET /yard/nav-counts': { status: 500, body: { message: 'x' } } }));
    render(<Workspace user={u('admin')} onLogout={() => {}} notify={() => {}}/>);
    await userEvent.click(screen.getByRole('button', { name: 'Reminders' }));
    expect(screen.getByText('કોઈ pending reminder નથી.')).toBeInTheDocument();
  });
  it('polls nav counts every 60 seconds', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const f = mockFetch(routes());
    render(<Workspace user={u('admin')} onLogout={() => {}} notify={() => {}}/>);
    await waitFor(() => expect(f.calls.filter(c => c.path === '/yard/nav-counts').length).toBe(1));
    await act(async () => { await vi.advanceTimersByTimeAsync(60000); });
    expect(f.calls.filter(c => c.path === '/yard/nav-counts').length).toBe(2);
  });
  it('sign out buttons call onLogout', async () => {
    mockFetch(routes());
    const onLogout = vi.fn();
    render(<Workspace user={u('admin')} onLogout={onLogout} notify={() => {}}/>);
    await userEvent.click(document.querySelector('.logout-btn'));
    await userEvent.click(screen.getByTitle('Sign out'));
    expect(onLogout).toHaveBeenCalledTimes(2);
  });
  it('mobile menu opens and closes via overlay', async () => {
    mockFetch(routes());
    const { container } = render(<Workspace user={u('admin')} onLogout={() => {}} notify={() => {}}/>);
    expect(container.querySelector('.sidebar-open')).toBeNull();
    fireEvent.click(container.querySelector('.mobile-trigger'));
    expect(container.querySelector('.sidebar.sidebar-open')).not.toBeNull();
    await userEvent.click(screen.getByLabelText('Close menu'));
    expect(container.querySelector('.sidebar-open')).toBeNull();
  });
  it('global search ignores terms shorter than 2 chars, opens results otherwise, and Escape clears', async () => {
    const f = mockFetch(routes({ 'GET /yard/search?q=ra': { lots: [{ _id: 'l1', lotNumber: 'LOT-1', farmerName: 'Ramesh', commodity: 'ઘઉં', status: 'arrived' }], tickets: [] } }));
    render(<Workspace user={u('admin')} onLogout={() => {}} notify={() => {}}/>);
    const box = screen.getByLabelText('Global search');
    await userEvent.type(box, 'r{enter}');
    expect(f.calls.some(c => c.path.startsWith('/yard/search'))).toBe(false);
    await userEvent.type(box, 'a{enter}');
    expect(await screen.findByText('Search results · ra')).toBeInTheDocument();
    expect(await screen.findByText('LOT-1')).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText('Close'));
    await userEvent.type(box, '{Escape}');
    expect(box).toHaveValue('');
  });
  it('Ctrl/Cmd+K focuses the search box', async () => {
    mockFetch(routes());
    render(<Workspace user={u('admin')} onLogout={() => {}} notify={() => {}}/>);
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    expect(screen.getByLabelText('Global search')).toHaveFocus();
  });
  it('opens a lot from search results, and reports lot load errors', async () => {
    const lotRoutes = (lotResp) => routes({ 'GET /yard/search?q=ra': { lots: [{ _id: 'l1', lotNumber: 'LOT-1', farmerName: 'Ramesh', commodity: 'ઘઉં', status: 'arrived' }], tickets: [] }, 'GET /yard/lots/l1': lotResp });
    mockFetch(lotRoutes({ item: { lotNumber: 'LOT-1', farmerName: 'Ramesh', commodity: 'ઘઉં', bags: 1, status: 'arrived' }, weighments: [] }));
    const notify = vi.fn();
    const { unmount } = render(<Workspace user={u('admin')} onLogout={() => {}} notify={notify}/>);
    await userEvent.type(screen.getByLabelText('Global search'), 'ra{enter}');
    await userEvent.click(await screen.findByRole('button', { name: 'ખોલો' }));
    expect(await screen.findByText('Lot traceability · LOT-1')).toBeInTheDocument();
    unmount();
    mockFetch(lotRoutes({ status: 404, body: { message: 'Lot not found' } }));
    render(<Workspace user={u('admin')} onLogout={() => {}} notify={notify}/>);
    await userEvent.type(screen.getByLabelText('Global search'), 'ra{enter}');
    await userEvent.click(await screen.findByRole('button', { name: 'ખોલો' }));
    await waitFor(() => expect(notify).toHaveBeenCalledWith('Lot not found', 'error'));
  });
  it('opens a ticket from search and lets an admin void it, refreshing counts', async () => {
    const ticket = { _id: 't1', ticketNumber: 'APMC-1', quantity: 5, rate: 100, createdAt: '2026-03-05T10:00:00Z', lot: { farmerName: 'R', commodity: 'ઘઉં', lotNumber: 'LOT-1' }, buyer: { name: 'P' } };
    const f = mockFetch(routes({ 'GET /yard/search?q=ap': { lots: [], tickets: [ticket] }, 'POST /yard/tickets/t1/void': { item: {} } }));
    vi.spyOn(window, 'prompt').mockReturnValue('rate typed wrongly');
    const notify = vi.fn();
    render(<Workspace user={u('admin')} onLogout={() => {}} notify={notify}/>);
    await userEvent.type(screen.getByLabelText('Global search'), 'ap{enter}');
    await userEvent.click(await screen.findByRole('button', { name: 'કાપલી' }));
    expect(await screen.findByText('Auction ticket · APMC-1')).toBeInTheDocument();
    const before = f.calls.filter(c => c.path === '/yard/nav-counts').length;
    await userEvent.click(screen.getByRole('button', { name: 'Cancel ticket' }));
    await waitFor(() => expect(notify).toHaveBeenCalledWith('Ticket cancel થઈ ગઈ.'));
    expect(f.calls.find(c => c.path === '/yard/tickets/t1/void').body).toEqual({ reason: 'rate typed wrongly' });
    await waitFor(() => expect(f.calls.filter(c => c.path === '/yard/nav-counts').length).toBeGreaterThan(before));
    expect(screen.queryByText('Auction ticket · APMC-1')).toBeNull();
  });
});
