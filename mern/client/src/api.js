const SESSION_KEY = 'apmc_yard_session_v1';
export function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; }
}
export function setSession(value) { localStorage.setItem(SESSION_KEY, JSON.stringify(value)); }
export function clearSession() { localStorage.removeItem(SESSION_KEY); }
export async function api(path, options = {}) {
  const session = getSession();
  const headers = { ...(options.headers || {}) };
  if (session?.token) headers.Authorization = `Bearer ${session.token}`;
  if (options.body && !(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  const response = await fetch(`/api${path}`, { ...options, headers, body: options.body && typeof options.body !== 'string' && !(options.body instanceof FormData) ? JSON.stringify(options.body) : options.body });
  const payload = await response.json().catch(() => ({}));
  if (response.status === 401) {
    clearSession();
    window.dispatchEvent(new CustomEvent('apmc:auth-expired'));
  }
  if (!response.ok) throw new Error(payload.message || `Request failed (${response.status})`);
  return payload;
}
export const money = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(value || 0));
export const number = value => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 3 }).format(Number(value || 0));
export const dateTime = value => value ? new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
