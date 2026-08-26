'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSyncExternalStore } from 'react';

import {
  apiFetch,
  saveAuth,
  subscribeAuth,
  getAuthSnapshot,
  getAuthServerSnapshot,
} from '../../lib/api';

export default function LoginPage() {
  const router = useRouter();

  const user = useSyncExternalStore(
    subscribeAuth,
    getAuthSnapshot,
    getAuthServerSnapshot
  );

  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      router.replace('/');
    }
  }, [user, router]);

  async function handleSubmit(e) {
    e.preventDefault();

    setError('');
    setLoading(true);

    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify(form),
      });

      saveAuth(data);

      router.replace('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (user) {
    return (
      <div className="container">
        <div className="card">
          Redirecting...
        </div>
      </div>
    );
  }

  return (
    <div className="container narrow-page">
      <div className="card auth-card">
        <h1>Login</h1>

        {error && (
          <p className="error">
            {error}
          </p>
        )}

        <form
          onSubmit={handleSubmit}
          className="form-stack"
        >
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={e =>
              setForm({
                ...form,
                email: e.target.value,
              })
            }
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={e =>
              setForm({
                ...form,
                password: e.target.value,
              })
            }
            required
          />

          <button
            className="primary-button"
            disabled={loading}
          >
            {loading
              ? 'Logging in...'
              : 'Login'}
          </button>
        </form>

        <p className="muted">
          No account?{' '}
          <Link href="/register">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}