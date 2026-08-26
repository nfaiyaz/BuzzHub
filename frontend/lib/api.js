const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export function getToken() {
  if (typeof window === 'undefined') return null;

  return localStorage.getItem('token');
}

export function getCurrentUser() {
  if (typeof window === 'undefined') return null;

  const raw = localStorage.getItem('user');

  return raw ? JSON.parse(raw) : null;
}

export function saveAuth({ token, user }) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));

  window.dispatchEvent(new Event('auth-change'));
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');

  window.dispatchEvent(new Event('auth-change'));
}

export async function apiFetch(path, options = {}) {
  const headers = new Headers(options.headers || {});

  headers.set('Content-Type', 'application/json');

  const token = getToken();

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    cache: 'no-store',
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Request failed.');
  }

  return data;
}