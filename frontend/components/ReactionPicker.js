'use client';

import { apiFetch } from '../lib/api';

const reactions = [
  { type: 'LIKE', emoji: '👍' },
  { type: 'LOVE', emoji: '❤️' },
  { type: 'HAHA', emoji: '😂' },
  { type: 'WOW', emoji: '😮' },
  { type: 'SAD', emoji: '😢' },
  { type: 'ANGRY', emoji: '😡' },
];

export default function ReactionPicker({
  post,
  onUpdated,
}) {
  async function handleReaction(type) {
    try {
      const result = await apiFetch(
        `/posts/${post.id}/reaction`,
        {
          method: 'POST',
          body: JSON.stringify({ type }),
        }
      );

      onUpdated({
        ...post,
        reactionCounts: result.reactionCounts,
        myReaction: result.myReaction,
      });
    } catch (error) {
      alert(error.message);
    }
  }

  return (
    <div className="reaction-picker">
      {reactions.map((reaction) => (
        <button
          key={reaction.type}
          type="button"
          className={
            post.myReaction === reaction.type
              ? 'reaction-button active'
              : 'reaction-button'
          }
          onClick={() =>
            handleReaction(reaction.type)
          }
          title={reaction.type}
        >
          <span>{reaction.emoji}</span>

          <span>
            {post.reactionCounts?.[reaction.type] || 0}
          </span>
        </button>
      ))}
    </div>
  );
}