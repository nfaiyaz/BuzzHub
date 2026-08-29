'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSyncExternalStore } from 'react';

import {
  subscribeAuth,
  getAuthSnapshot,
  getAuthServerSnapshot,
  logout,
} from '../lib/api';

export default function Navbar() {
  const router = useRouter();

  const user = useSyncExternalStore(
    subscribeAuth,
    getAuthSnapshot,
    getAuthServerSnapshot
  );

  function handleLogout() {
    logout();
    router.replace('/login');
  }

  return (
    <nav className="navbar">
      <div className="container nav-inner">
        <Link
          href="/"
          className="brand"
        >
          MiniSocial
        </Link>

        <div className="nav-links">
          {user ? (
            <>
              <Link
                href={`/profile/${user.username}`}
              >
                Profile
              </Link>

              <Link href="/requests">
                Requests
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
              <Link href="/login">
                Login
              </Link>

              <Link href="/register">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}