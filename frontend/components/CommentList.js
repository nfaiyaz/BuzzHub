'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';

export default function CommentList({ postId }) {
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState('');
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');

  async function loadComments() {
    try {
      const data = await apiFetch(`/posts/${postId}/comments`);
      setComments(data);
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleOpen() {
    const next = !open;

    setOpen(next);

    if (next && comments.length === 0) {
      await loadComments();
    }
  }

  async function addComment(e) {
    e.preventDefault();

    if (!content.trim()) return;

    try {
      const comment = await apiFetch(
        `/posts/${postId}/comments`,
        {
          method: 'POST',
          body: JSON.stringify({ content }),
        }
      );

      setComments(current => [...current, comment]);
      setContent('');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="comments-box">
      <button
        className="text-button"
        onClick={toggleOpen}
      >
        {open
          ? 'Hide comments'
          : 'View / add comments'}
      </button>

      {error && <p className="error">{error}</p>}

      {open && (
        <div className="comments-content">
          <div className="comment-list">
            {comments.map(comment => (
              <div
                className="comment"
                key={comment.id}
              >
                <strong>
                  @{comment.author.username}
                </strong>

                <span>{comment.content}</span>
              </div>
            ))}

            {comments.length === 0 && (
              <p className="muted">
                No comments yet.
              </p>
            )}
          </div>

          <form
            onSubmit={addComment}
            className="comment-form"
          >
            <input
              placeholder="Write a comment..."
              value={content}
              maxLength={500}
              onChange={e =>
                setContent(e.target.value)
              }
            />

            <button className="secondary-button">
              Comment
            </button>
          </form>
        </div>
      )}
    </div>
  );
}