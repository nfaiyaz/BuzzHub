'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

import { apiFetch } from '../../../../lib/api';

export default function FollowersPage() {
  const { username } = useParams();

  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!username) {
      return;
    }

    async function loadFollowers() {
      try {
        setError('');

        const data = await apiFetch(
          `/users/${username}/followers`
        );

        setUsers(data);
      } catch (err) {
        setError(err.message);
      }
    }

    loadFollowers();
  }, [username]);

  if (error) {
    return (
      <div className="container">
        <p className="error">{error}</p>
      </div>
    );
  }

  return (
    <div className="container profile-list-page">
      <div className="card">
        <Link
          href={`/profile/${username}`}
          className="secondary-button inline-button"
        >
          Back to profile
        </Link>

        <h1>
          Followers of @{username}
        </h1>
      </div>

      <div className="user-list">
        {users.map(user => (
          <Link
            key={user.id}
            href={`/profile/${user.username}`}
            className="card user-list-item"
          >
            <div className="avatar-small">
              {user.name
                .slice(0, 1)
                .toUpperCase()}
            </div>

            <div>
              <strong>{user.name}</strong>
              <div className="muted">
                @{user.username}
              </div>
            </div>
          </Link>
        ))}

        {users.length === 0 && (
          <div className="card">
            No followers yet.
          </div>
        )}
      </div>
    </div>
  );
}