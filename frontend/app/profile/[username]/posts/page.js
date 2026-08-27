'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

import { apiFetch } from '../../../../lib/api';
import PostCard from '../../../../components/PostCard';

export default function ProfilePostsPage() {
  const { username } = useParams();

  const [posts, setPosts] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!username) {
      return;
    }

    async function loadPosts() {
      try {
        setError('');

        const data = await apiFetch(
          `/users/${username}/posts`
        );

        setPosts(data);
      } catch (err) {
        setError(err.message);
      }
    }

    loadPosts();
  }, [username]);

  function handleUpdated(updated) {
    setPosts(current =>
      current.map(post =>
        post.id === updated.id
          ? updated
          : post
      )
    );
  }

  function handleDeleted(postId) {
    setPosts(current =>
      current.filter(
        post => post.id !== postId
      )
    );
  }

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
          Posts by @{username}
        </h1>
      </div>

      <div className="post-list">
        {posts.map(post => (
          <PostCard
            key={post.id}
            post={post}
            onUpdated={handleUpdated}
            onDeleted={handleDeleted}
          />
        ))}

        {posts.length === 0 && (
          <div className="card">
            No posts yet.
          </div>
        )}
      </div>
    </div>
  );
}