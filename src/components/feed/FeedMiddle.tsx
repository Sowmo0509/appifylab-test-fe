'use client';
import React, { useEffect, useState } from 'react';
import api from '@/lib/axios';

import CreatePost from './CreatePost';
import FeedPost from './FeedPost';

export default function FeedMiddle() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    try {
      const response = await api.get('/posts');
      setPosts(response.data);
    } catch (error) {
      console.error("Failed to fetch posts", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <div className="col-xl-6 col-lg-6 col-md-12 col-sm-12">
      <CreatePost onPostCreated={fetchPosts} />
      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>Loading posts...</div>
      ) : posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>No posts yet. Be the first to post!</div>
      ) : (
        posts.map((post) => (
          <FeedPost key={post.id} post={post} onInteraction={fetchPosts} />
        ))
      )}
    </div>
  );
}
