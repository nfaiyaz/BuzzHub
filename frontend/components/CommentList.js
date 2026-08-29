'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import Link from 'next/link';

const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡'];

function buildCommentTree(comments) {
  const map = {};
  const roots = [];

  comments.forEach((comment) => {
    map[comment.id] = {
      ...comment,
      replies: [],
    };
  });

  comments.forEach((comment) => {
    if (comment.parentId) {
      const parent = map[comment.parentId];

      if (parent) {
        parent.replies.push(map[comment.id]);
      }
    } else {
      roots.push(map[comment.id]);
    }
  });

  return roots;
}

function CommentItem({
  comment,
  onReply,
  onReaction,
  replyingTo,
  setReplyingTo,
}) {
  const [replyContent, setReplyContent] = useState('');
  const [showReactions, setShowReactions] = useState(false);
  const [replyLoading, setReplyLoading] = useState(false);

  async function handleReply(e) {
    e.preventDefault();

    if (!replyContent.trim() || replyLoading) {
      return;
    }

    setReplyLoading(true);

    try {
      await onReply(comment.id, replyContent);
      setReplyContent('');
      setReplyingTo(null);
    } catch (err) {
      // Error is already handled by the parent component.
    } finally {
      setReplyLoading(false);
    }
  }

  async function handleReaction(reaction) {
    setShowReactions(false);
    await onReaction(comment.id, reaction);
  }

  return (
    <div className="comment">
      <div className="comment-content">
        <Link
          href={`/profile/${comment.author.username}`}
          className="comment-author"
        >
          <strong>
            @{comment.author.username}
          </strong>
        </Link>

        <span>{comment.content}</span>
      </div>

      <div className="comment-actions">
        <div className="reaction-wrapper">
          <button
            type="button"
            className="text-button"
            onClick={() =>
              setShowReactions((current) => !current)
            }
          >
            {comment.userReaction || '😊'} React
          </button>

          {showReactions && (
            <div className="reaction-picker">
              {REACTIONS.map((reaction) => (
                <button
                  type="button"
                  className="reaction-button"
                  key={reaction}
                  onClick={() =>
                    handleReaction(reaction)
                  }
                >
                  {reaction}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          className="text-button"
          onClick={() =>
            setReplyingTo(
              replyingTo === comment.id
                ? null
                : comment.id
            )
          }
        >
          Reply
        </button>

        {comment.reactionCount > 0 && (
          <span className="muted">
            {comment.reactionCount}{' '}
            {comment.reactionCount === 1
              ? 'reaction'
              : 'reactions'}
          </span>
        )}
      </div>

      {replyingTo === comment.id && (
        <form
          onSubmit={handleReply}
          className="comment-form reply-form"
        >
          <input
            placeholder="Write a reply..."
            value={replyContent}
            maxLength={500}
            onChange={(e) =>
              setReplyContent(e.target.value)
            }
          />

          <button
            type="submit"
            className="secondary-button"
            disabled={
              replyLoading ||
              !replyContent.trim()
            }
          >
            {replyLoading
              ? 'Replying...'
              : 'Reply'}
          </button>
        </form>
      )}

      {comment.replies &&
        comment.replies.length > 0 && (
          <div className="comment-replies">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                onReply={onReply}
                onReaction={onReaction}
                replyingTo={replyingTo}
                setReplyingTo={setReplyingTo}
              />
            ))}
          </div>
        )}
    </div>
  );
}

export default function CommentList({ postId }) {
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState('');
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);

  async function loadComments() {
    setLoading(true);
    setError('');

    try {
      const data = await apiFetch(
        `/posts/${postId}/comments`
      );

      setComments(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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

    if (!content.trim() || posting) {
      return;
    }

    setPosting(true);
    setError('');

    try {
      const comment = await apiFetch(
        `/posts/${postId}/comments`,
        {
          method: 'POST',
          body: JSON.stringify({
            content,
          }),
        }
      );

      setComments((current) => [
        ...current,
        comment,
      ]);

      setContent('');
    } catch (err) {
      setError(err.message);
    } finally {
      setPosting(false);
    }
  }

  async function addReply(parentId, replyContent) {
    setError('');

    try {
      const reply = await apiFetch(
        `/posts/${postId}/comments`,
        {
          method: 'POST',
          body: JSON.stringify({
            content: replyContent,
            parentId,
          }),
        }
      );

      setComments((current) => [
        ...current,
        reply,
      ]);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  async function handleReaction(
    commentId,
    reaction
  ) {
    setError('');

    try {
      const data = await apiFetch(
        `/comments/${commentId}/reaction`,
        {
          method: 'POST',
          body: JSON.stringify({
            emoji: reaction,
          }),
        }
      );

      setComments((current) =>
        current.map((comment) =>
          comment.id === commentId
            ? {
                ...comment,
                userReaction:
                  data.reaction,
                reactionCount:
                  data.reactionCount,
              }
            : comment
        )
      );
    } catch (err) {
      setError(err.message);
    }
  }

  const commentTree = buildCommentTree(
    comments
  );

  return (
    <div className="comments-box">
      <button
        type="button"
        className="text-button"
        onClick={toggleOpen}
      >
        {open
          ? 'Hide comments'
          : 'View / add comments'}
      </button>

      {error && (
        <p className="error">{error}</p>
      )}

      {open && (
        <div className="comments-content">
          {loading ? (
            <p className="muted">
              Loading comments...
            </p>
          ) : (
            <>
              <div className="comment-list">
                {commentTree.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    onReply={addReply}
                    onReaction={handleReaction}
                    replyingTo={replyingTo}
                    setReplyingTo={
                      setReplyingTo
                    }
                  />
                ))}

                {commentTree.length === 0 && (
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
                  onChange={(e) =>
                    setContent(e.target.value)
                  }
                />

                <button
                  type="submit"
                  className="secondary-button"
                  disabled={
                    posting ||
                    !content.trim()
                  }
                >
                  {posting
                    ? 'Commenting...'
                    : 'Comment'}
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
}