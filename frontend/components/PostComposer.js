'use client';

import { useState } from 'react';
import { apiFetch } from '../lib/api';

export default function PostComposer({ onCreated }) {
  const [content, setContent] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();

    if (!content.trim()) return;

    setBusy(true);
    setError('');

    try {
      const post = await apiFetch('/posts', {
        method: 'POST',
        body: JSON.stringify({ content }),
      });

      setContent('');
      onCreated(post);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <form onSubmit={handleSubmit}>
        <textarea
          rows={4}
          maxLength={1000}
          placeholder="What are you thinking?"
          value={content}
          onChange={e => setContent(e.target.value)}
        />

        <div className="composer-footer">
          <span className="muted">{content.length}/1000</span>

          <button
            className="primary-button"
            disabled={busy || !content.trim()}
          >
            {busy ? 'Posting...' : 'Post'}
          </button>
        </div>

        {error && <p className="error">{error}</p>}
      </form>
    </div>
  );
}