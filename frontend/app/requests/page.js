'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch, getCurrentUser, getToken } from '../../lib/api';

export default function RequestsPage() {
  const router = useRouter();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    const token = getToken();
    const user = getCurrentUser();

    if (!token || !user) {
      router.push('/login');
      return;
    }

    async function loadRequests() {
      try {
        setError('');

        const data = await apiFetch('/requests/received');

        setRequests(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadRequests();
  }, [router]);

  async function handleRequest(requestId, action) {
    if (processingId) return;

    setProcessingId(requestId);
    setError('');

    try {
      await apiFetch(`/requests/${requestId}/${action}`, {
        method: 'POST',
      });

      setRequests((current) =>
        current.filter((request) => request.id !== requestId)
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessingId(null);
    }
  }

  if (loading) {
    return (
      <div className="container">
        <div className="card">Loading requests...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <div className="page-header">
          <div>
            <h1>Friend Requests</h1>
            <p className="muted">
              People who want to connect with you.
            </p>
          </div>

          <Link href="/" className="secondary-button inline-button">
            Back to Feed
          </Link>
        </div>

        {error && <p className="error">{error}</p>}

        {requests.length === 0 ? (
          <p className="muted">You have no pending friend requests.</p>
        ) : (
          <div className="request-list">
            {requests.map((request) => (
              <div className="request-item" key={request.id}>
                <div className="request-user">
                  <div className="avatar">
                    {request.sender.name
                      .slice(0, 1)
                      .toUpperCase()}
                  </div>

                  <div>
                    <Link
                      href={`/profile/${request.sender.username}`}
                      className="author-name"
                    >
                      {request.sender.name}
                    </Link>

                    <div className="muted">
                      @{request.sender.username}
                    </div>

                    {request.sender.bio && (
                      <p className="request-bio">
                        {request.sender.bio}
                      </p>
                    )}
                  </div>
                </div>

                <div className="request-actions">
                  <button
                    className="primary-button"
                    disabled={processingId === request.id}
                    onClick={() =>
                      handleRequest(request.id, 'accept')
                    }
                  >
                    {processingId === request.id
                      ? 'Processing...'
                      : 'Accept'}
                  </button>

                  <button
                    className="danger-button"
                    disabled={processingId === request.id}
                    onClick={() =>
                      handleRequest(request.id, 'reject')
                    }
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}