'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';

export default function UserSuggestions() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadSuggestions() {
      try {
        const data = await apiFetch('/users/suggestions');

        if (!cancelled) {
          setUsers(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadSuggestions();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleFollow(username) {
    if (processing) return;

    setProcessing(username);
    setError('');

    try {
      await apiFetch(`/users/${username}/follow`, {
        method: 'POST',
      });

      setUsers((current) =>
        current.filter((user) => user.username !== username)
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(null);
    }
  }

  async function handleRequest(username) {
    if (processing) return;

    setProcessing(username);
    setError('');

    try {
      const data = await apiFetch(`/requests/${username}/request`, {
        method: 'POST',
      });

      setUsers((current) =>
        current.map((user) =>
          user.username === username
            ? {
                ...user,
                requestStatus: data.status,
                requestId: data.requestId || null,
              }
            : user
        )
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(null);
    }
  }

  if (loading) {
    return (
      <div className="card">
        <h2>Suggested People</h2>
        <p className="muted">Loading suggestions...</p>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="card">
        <h2>Suggested People</h2>
        <p className="muted">
          No new people to suggest right now.
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>Suggested People</h2>

      {error && <p className="error">{error}</p>}

      <div className="suggestions-list">
        {users.map((user) => (
          <div className="suggestion-item" key={user.id}>
            <div className="suggestion-user">
              <div className="avatar">
                {user.name.slice(0, 1).toUpperCase()}
              </div>

              <div>
                <Link
                  href={`/profile/${user.username}`}
                  className="author-name"
                >
                  {user.name}
                </Link>

                <div className="muted">
                  @{user.username}
                </div>

                {user.bio && (
                  <p className="suggestion-bio">
                    {user.bio}
                  </p>
                )}
              </div>
            </div>

            <div className="suggestion-actions">
              <button
                className="secondary-button"
                disabled={processing === user.username}
                onClick={() => handleFollow(user.username)}
              >
                Follow
              </button>

              {user.requestStatus === 'PENDING' ? (
                <button
                  className="secondary-button"
                  disabled
                >
                  Request Pending
                </button>
              ) : (
                <button
                  className="primary-button"
                  disabled={processing === user.username}
                  onClick={() => handleRequest(user.username)}
                >
                  {processing === user.username
                    ? 'Sending...'
                    : 'Add Request'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}