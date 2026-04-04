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
      console.error('Failed to fetch posts', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <div className="col-xl-6 col-lg-6 col-md-12 col-sm-12">
      <div className="_layout_middle_wrap">
        <CreatePost onPostCreated={fetchPosts} />
        {loading ? (
          <div className="_feed_inner_timeline_post_area _b_radious6 _padd_b24 _padd_t24 _mar_b16" style={{ textAlign: 'center' }}>
            Loading posts...
          </div>
        ) : posts.length === 0 ? (
          <div className="_feed_inner_timeline_post_area _b_radious6 _padd_b24 _padd_t24 _mar_b16" style={{ textAlign: 'center' }}>
            No posts yet. Be the first to post!
          </div>
        ) : (
          posts.map((post) => (
            <FeedPost key={post.id} post={post} onInteraction={fetchPosts} />
          ))
        )}
      </div>
    </div>
  );
}
