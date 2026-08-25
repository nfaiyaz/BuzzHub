'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch, saveAuth } from '../../lib/api';

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    setError('');
    setLoading(true);

    try {
      const data = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify(form),
      });

      saveAuth(data);
      router.push('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container narrow-page">
      <div className="card auth-card">
        <h1>Create account</h1>

        {error && <p className="error">{error}</p>}

        <form onSubmit={handleSubmit} className="form-stack">
          <input
            placeholder="Full name"
            value={form.name}
            onChange={e =>
              setForm({
                ...form,
                name: e.target.value,
              })
            }
            required
          />

          <input
            placeholder="Username"
            value={form.username}
            onChange={e =>
              setForm({
                ...form,
                username: e.target.value,
              })
            }
            required
          />

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
            placeholder="Password (min 6 characters)"
            value={form.password}
            onChange={e =>
              setForm({
                ...form,
                password: e.target.value,
              })
            }
            minLength={6}
            required
          />

          <button
            className="primary-button"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Register'}
          </button>
        </form>

        <p className="muted">
          Already registered? <Link href="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}