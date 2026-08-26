const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:5000/api';

let authSnapshot = null;
let authInitialized = false;

const authListeners = new Set();

function readStoredUser() {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = localStorage.getItem('user');

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function notifyAuthListeners() {
  authListeners.forEach((listener) => {
    listener();
  });
}

export function subscribeAuth(listener) {
  authListeners.add(listener);

  if (!authInitialized) {
    authInitialized = true;
    authSnapshot = readStoredUser();

    Promise.resolve().then(() => {
      listener();
    });
  }

  function handleStorageChange() {
    authSnapshot = readStoredUser();
    listener();
  }

  function handleAuthChange() {
    authSnapshot = readStoredUser();
    listener();
  }

  window.addEventListener(
    'storage',
    handleStorageChange
  );

  window.addEventListener(
    'auth-change',
    handleAuthChange
  );

  return () => {
    authListeners.delete(listener);

    window.removeEventListener(
      'storage',
      handleStorageChange
    );

    window.removeEventListener(
      'auth-change',
      handleAuthChange
    );
  };
}

export function getAuthSnapshot() {
  return authSnapshot;
}

export function getAuthServerSnapshot() {
  return null;
}

export function getToken() {
  if (typeof window === 'undefined') {
    return null;
  }

  return localStorage.getItem('token');
}

export function getCurrentUser() {
  if (typeof window === 'undefined') {
    return null;
  }

  return readStoredUser();
}

export function saveAuth({ token, user }) {
  localStorage.setItem('token', token);
  localStorage.setItem(
    'user',
    JSON.stringify(user)
  );

  authSnapshot = user;
  authInitialized = true;

  notifyAuthListeners();

  window.dispatchEvent(
    new Event('auth-change')
  );
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');

  authSnapshot = null;
  authInitialized = true;

  notifyAuthListeners();

  window.dispatchEvent(
    new Event('auth-change')
  );
}

export async function apiFetch(
  path,
  options = {}
) {
  const headers = new Headers(
    options.headers || {}
  );

  headers.set(
    'Content-Type',
    'application/json'
  );

  const token = getToken();

  if (token) {
    headers.set(
      'Authorization',
      `Bearer ${token}`
    );
  }

  const response = await fetch(
    `${API_URL}${path}`,
    {
      ...options,
      headers,
      cache: 'no-store',
    }
  );

  const data = await response
    .json()
    .catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message || 'Request failed.'
    );
  }

  return data;
}