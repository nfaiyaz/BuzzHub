'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getCurrentUser, logout } from '../lib/api';

function subscribe(callback) {
  window.addEventListener('storage', callback);

  return () => {
    window.removeEventListener('storage', callback);
  };
}

function getUserSnapshot() {
  return getCurrentUser();
}

function getServerSnapshot() {
  return null;
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