import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Login } from './Login.jsx';
import { getSession } from '../../services/api.js';
import { mockFetch } from '../../test/mockFetch.js';

afterEach(() => vi.unstubAllGlobals());
const fill = async (email = 'a@b.in', pw = 'secret') => {
  await userEvent.type(screen.getByLabelText('Email address'), email);
  await userEvent.type(screen.getByLabelText('Password'), pw);
};

describe('Login', () => {
  it('renders required, correctly typed inputs', () => {
    render(<Login onLogin={() => {}}/>);
    expect(screen.getByLabelText('Email address')).toBeRequired();
    expect(screen.getByLabelText('Email address')).toHaveAttribute('type', 'email');
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
  });
  it('posts credentials, stores the session and calls onLogin with the user', async () => {
    const f = mockFetch({ 'POST /auth/login': { token: 'T', user: { id: '1', name: 'Admin', role: 'admin' } } });
    const onLogin = vi.fn();
    render(<Login onLogin={onLogin}/>);
    await fill('admin@apmc.in', 'pw');
    await userEvent.click(screen.getByRole('button', { name: /Sign in securely/ }));
    await vi.waitFor(() => expect(onLogin).toHaveBeenCalledWith({ id: '1', name: 'Admin', role: 'admin' }));
    expect(f.calls[0].body).toEqual({ email: 'admin@apmc.in', password: 'pw' });
    expect(getSession().token).toBe('T');
  });
  it('shows the server error and stores nothing on bad credentials', async () => {
    mockFetch({ 'POST /auth/login': { status: 401, body: { message: 'Invalid email or password' } } });
    const onLogin = vi.fn();
    render(<Login onLogin={onLogin}/>);
    await fill();
    await userEvent.click(screen.getByRole('button', { name: /Sign in securely/ }));
    expect(await screen.findByText('Invalid email or password')).toBeInTheDocument();
    expect(onLogin).not.toHaveBeenCalled();
    expect(getSession()).toBeNull();
    expect(screen.getByRole('button', { name: /Sign in securely/ })).toBeEnabled();
  });
  it('shows the rate-limit message', async () => {
    mockFetch({ 'POST /auth/login': { status: 429, body: { message: 'Too many login attempts. Try again in 15 minutes.' } } });
    render(<Login onLogin={() => {}}/>);
    await fill();
    await userEvent.click(screen.getByRole('button', { name: /Sign in securely/ }));
    expect(await screen.findByText(/Too many login attempts/)).toBeInTheDocument();
  });
  it('disables the button while signing in', async () => {
    let release; mockFetch({ 'POST /auth/login': () => new Promise(r => { release = () => r({ token: 't', user: { id: 1 } }); }) });
    render(<Login onLogin={() => {}}/>);
    await fill();
    await userEvent.click(screen.getByRole('button', { name: /Sign in securely/ }));
    expect(await screen.findByRole('button', { name: /Signing in/ })).toBeDisabled();
    release();
    await screen.findByRole('button', { name: /Sign in securely/ });
  });
  it('does not call the API with empty fields (native validation)', async () => {
    const f = mockFetch({});
    render(<Login onLogin={() => {}}/>);
    await userEvent.click(screen.getByRole('button', { name: /Sign in securely/ }));
    expect(f).not.toHaveBeenCalled();
  });
  it('clears a previous error on retry', async () => {
    let n = 0;
    mockFetch({ 'POST /auth/login': () => (n++ ? { token: 't', user: { id: 1 } } : { status: 401, body: { message: 'bad' } }) });
    render(<Login onLogin={() => {}}/>);
    await fill();
    const btn = () => screen.getByRole('button', { name: /Sign in/ });
    await userEvent.click(btn());
    await screen.findByText('bad');
    await userEvent.click(btn());
    await vi.waitFor(() => expect(screen.queryByText('bad')).toBeNull());
  });
});
