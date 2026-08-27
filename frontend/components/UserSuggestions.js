'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import { apiFetch } from '../lib/api';

export default function UserSuggestions() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadSuggestions() {
      try {
        const data = await apiFetch('/users/suggestions');

        setUsers(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadSuggestions();
  }, []);

  async function handleFollow(username) {
    try {
      await apiFetch(`/users/${username}/follow`, {
        method: 'POST',
      });

      setUsers((current) =>
        current.filter((user) => user.username !== username)
      );
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleRequest(username) {
    try {
      const result = await apiFetch(
        `/users/${username}/request`,
        {
          method: 'POST',
        }
      );

      setUsers((current) =>
        current.map((user) =>
          user.username === username
            ? {
                ...user,
                requestStatus: result.status,
              }
            : user
        )
      );
    } catch (err) {
      alert(err.message);
    }
  }

  if (loading) {
    return (
      <div className="card">
        Loading suggestions...
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <p className="error">{error}</p>
      </div>
    );
  }

  if (users.length === 0) {
    return null;
  }

  return (
    <div className="card suggestions-card">
      <h2>People you may know</h2>

      <div className="suggestions-list">
        {users.map((user) => (
          <div
            className="suggestion-item"
            key={user.id}
          >
            <div className="suggestion-info">
              <Link
                href={`/profile/${user.username}`}
              >
                <strong>{user.name}</strong>
              </Link>

              <div className="muted">
                @{user.username}
              </div>

              {user.bio && (
                <p>{user.bio}</p>
              )}
            </div>

            <div className="suggestion-actions">
              <button
                className="secondary-button"
                onClick={() =>
                  handleFollow(user.username)
                }
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
                  onClick={() =>
                    handleRequest(user.username)
                  }
                >
                  Add Request
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}