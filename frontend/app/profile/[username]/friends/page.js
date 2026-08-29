'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '../../../../lib/api';

export default function FriendsPage() {
  const { username } = useParams();

  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!username) return;

    let cancelled = false;

    async function loadFriends() {
      try {
        setError('');

        const data = await apiFetch(
          `/requests/${username}/friends`
        );

        if (!cancelled) {
          setFriends(data);
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

    loadFriends();

    return () => {
      cancelled = true;
    };
  }, [username]);

  if (loading) {
    return (
      <div className="container">
        <div className="card">
          <h1>Friends</h1>
          <p className="muted">Loading friends...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="card">
          <p className="error">{error}</p>

          <Link
            href={`/profile/${username}`}
            className="secondary-button inline-button"
          >
            Back to Profile
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <div className="page-header">
          <div>
            <h1>Friends</h1>
            <p className="muted">
              Friends of @{username}
            </p>
          </div>

          <Link
            href={`/profile/${username}`}
            className="secondary-button"
          >
            Back to Profile
          </Link>
        </div>

        {friends.length === 0 ? (
          <p className="muted">
            No friends yet.
          </p>
        ) : (
          <div className="suggestions-list">
            {friends.map((friend) => (
              <div
                className="suggestion-item"
                key={friend.id}
              >
                <div className="suggestion-user">
                  <div className="avatar">
                    {friend.name
                      .slice(0, 1)
                      .toUpperCase()}
                  </div>

                  <div>
                    <Link
                      href={`/profile/${friend.username}`}
                      className="author-name"
                    >
                      {friend.name}
                    </Link>

                    <div className="muted">
                      @{friend.username}
                    </div>

                    {friend.bio && (
                      <p className="suggestion-bio">
                        {friend.bio}
                      </p>
                    )}
                  </div>
                </div>

                <Link
                  href={`/profile/${friend.username}`}
                  className="secondary-button"
                >
                  View Profile
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}