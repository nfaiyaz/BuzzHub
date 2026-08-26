'use client';

import Link from 'next/link';
import { useState } from 'react';
import { apiFetch, getCurrentUser } from '../lib/api';
import CommentList from './CommentList';

export default function PostCard({ post, onUpdated, onDeleted }) {
  const [busy, setBusy] = useState(false);
  const currentUser = getCurrentUser();

  async function handleLike() {
    if (busy) return;

    setBusy(true);

    try {
      const result = await apiFetch(
        `/posts/${post.id}/like`,
        {
          method: 'POST',
        }
      );

      onUpdated({
        ...post,
        isLiked: result.isLiked,
        likeCount: result.likeCount,
      });
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this post?')) return;

    try {
      await apiFetch(`/posts/${post.id}`, {
        method: 'DELETE',
      });

      onDeleted(post.id);
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <article className="card post-card">
      <div className="post-header">
        <div>
          <Link
            href={`/profile/${post.author.username}`}
            className="author-name"
          >
            {post.author.name}
          </Link>

          <div className="muted">
            @{post.author.username}
          </div>
        </div>

        {currentUser?.id === post.author.id && (
          <button
            className="danger-button"
            onClick={handleDelete}
          >
            Delete
          </button>
        )}
      </div>

      <p className="post-content">
        {post.content}
      </p>

      <div className="post-actions">
        <button
          className={
            post.isLiked
              ? 'like-button liked'
              : 'like-button'
          }
          onClick={handleLike}
        >
          {post.isLiked ? 'Unlike' : 'Like'} (
          {post.likeCount})
        </button>

        <span className="muted">
          Comments: {post.commentCount}
        </span>
      </div>

      <CommentList postId={post.id} />
    </article>
  );
}