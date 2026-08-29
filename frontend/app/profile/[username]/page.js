'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '../../../lib/api';
import PostCard from '../../../components/PostCard';

export default function ProfilePage() {
  const { username } = useParams();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!username) return;

    async function fetchProfile() {
      try {
        setError('');

        const [profileData, postsData] = await Promise.all([
          apiFetch(`/users/${username}`),
          apiFetch(`/users/${username}/posts`),
        ]);

        setProfile(profileData);
        setPosts(postsData);
      } catch (err) {
        setError(err.message);
      }
    }

    fetchProfile();
  }, [username]);

  async function toggleFollow() {
    try {
      const data = await apiFetch(
        `/users/${username}/follow`,
        {
          method: 'POST',
        }
      );

      setProfile(current => ({
        ...current,
        isFollowing: data.isFollowing,
        _count: {
          ...current._count,
          followers: data.followerCount,
        },
      }));
    } catch (err) {
      setError(err.message);
    }
  }

  async function sendRequest() {
  try {
    const data = await apiFetch(
      `/requests/${username}/request`,
      {
        method: 'POST',
      }
    );

    setProfile((current) => ({
      ...current,
      requestStatus: data.status,
      requestId: data.requestId || null,
    }));
  } catch (err) {
    setError(err.message);
  }
}

  function handleUpdated(updated) {
    setPosts(current =>
      current.map(p =>
        p.id === updated.id ? updated : p
      )
    );
  }

  function handleDeleted(postId) {
    setPosts(current =>
      current.filter(p => p.id !== postId)
    );
  }

  if (error) {
    return (
      <div className="container">
        <p className="error">{error}</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container">
        <div className="card">
          Loading profile...
        </div>
      </div>
    );
  }

  return (
    <div className="container profile-layout">
      <section className="card profile-card">
        <div className="avatar-large">
          {profile.name.slice(0, 1).toUpperCase()}
        </div>

        <h1>{profile.name}</h1>

        <p className="muted">
          @{profile.username}
        </p>

        <p>
          {profile.bio || 'No bio yet.'}
        </p>

        <div className="stats-row">
          <Link
            href={`/profile/${profile.username}/posts`}
            className="profile-stat"
          >
            <strong>
              {profile._count.posts}
            </strong>
            <span>posts</span>
          </Link>

          <Link
            href={`/profile/${profile.username}/followers`}
            className="profile-stat"
          >
            <strong>
              {profile._count.followers}
            </strong>
            <span>followers</span>
          </Link>

          <Link
            href={`/profile/${profile.username}/following`}
            className="profile-stat"
          >
            <strong>
              {profile._count.following}
            </strong>
            <span>following</span>
          </Link>

          <Link
            href={`/profile/${profile.username}/friends`}
            className="profile-stat"
          >
            <strong>
              {profile.friendCount}
            </strong>
            <span>friends</span>
          </Link>
        </div>

        {!profile.isMe && (
  <div className="profile-actions">
    <button
      className="primary-button"
      onClick={toggleFollow}
    >
      {profile.isFollowing ? 'Unfollow' : 'Follow'}
    </button>

    {profile.requestStatus === 'PENDING' ? (
      <button
        className="secondary-button"
        disabled
      >
        Request Pending
      </button>
    ) : (
      <button
        className="secondary-button"
        onClick={sendRequest}
      >
        Add Request
      </button>
    )}
  </div>
)}

        {profile.isMe && (
          <Link
            className="secondary-button inline-button"
            href="/"
          >
            Back to feed
          </Link>
        )}
      </section>

      <section>
        <h2 className="section-title">
          Posts by @{profile.username}
        </h2>

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
      </section>
    </div>
  );
}