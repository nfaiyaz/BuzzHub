'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PostComposer from '../components/PostComposer';
import PostCard from '../components/PostCard';
import UserSuggestions from '../components/UserSuggestions';
import {
  apiFetch,
  getCurrentUser,
  getToken,
} from '../lib/api';

export default function HomePage() {
  const router = useRouter();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!getToken() || !getCurrentUser()) {
      router.push('/login');
      return;
    }

    async function fetchPosts() {
      try {
        const data = await apiFetch('/posts');

        setPosts(data);
        setError('');
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, [router]);

  function handleCreated(post) {
    setPosts((current) => [post, ...current]);
  }

  function handleUpdated(updatedPost) {
    setPosts((current) =>
      current.map((p) =>
        p.id === updatedPost.id ? updatedPost : p
      )
    );
  }

  function handleDeleted(postId) {
    setPosts((current) =>
      current.filter((p) => p.id !== postId)
    );
  }

  return (
    <div className="container feed-layout">
      <section>
        <h1 className="page-title">Home Feed</h1>

        <PostComposer onCreated={handleCreated} />

        {error && <p className="error">{error}</p>}

        {loading ? (
          <div className="card">
            Loading posts...
          </div>
        ) : posts.length === 0 ? (
          <div className="card">
            No posts yet. Be the first to post.
          </div>
        ) : (
          <div className="post-list">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onUpdated={handleUpdated}
                onDeleted={handleDeleted}
              />
            ))}
          </div>
        )}
      </section>

      <aside>
        <UserSuggestions />
      </aside>
    </div>
  );
}