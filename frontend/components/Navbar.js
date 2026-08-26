'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSyncExternalStore } from 'react';
import { getCurrentUser, logout } from '../lib/api';

let cachedUser = null;
let initialized = false;

function getUserSnapshot() {
  if (!initialized && typeof window !== 'undefined') {
    cachedUser = getCurrentUser();
    initialized = true;
  }

  return cachedUser;
}

function getServerSnapshot() {
  return null;
}

function subscribe(callback) {
  function handleAuthChange() {
    cachedUser = getCurrentUser();
    initialized = true;
    callback();
  }

  window.addEventListener('storage', handleAuthChange);
  window.addEventListener('auth-change', handleAuthChange);

  return () => {
    window.removeEventListener('storage', handleAuthChange);
    window.removeEventListener('auth-change', handleAuthChange);
  };
}

export default function Navbar() {
  const router = useRouter();

  const user = useSyncExternalStore(
    subscribe,
    getUserSnapshot,
    getServerSnapshot
  );

  function handleLogout() {
    logout();

    cachedUser = null;
    initialized = true;

    window.dispatchEvent(new Event('auth-change'));

    router.push('/login');
  }

  return (
    <nav className="navbar">
      <div className="container nav-inner">
        <Link href="/" className="brand">
          MiniSocial
        </Link>

        <div className="nav-links">
          {user ? (
            <>
              <Link href={`/profile/${user.username}`}>
                Profile
              </Link>

              <button
                className="link-button"
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login">Login</Link>
              <Link href="/register">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}