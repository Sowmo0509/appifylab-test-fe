'use client';
import React, { useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import LeftSidebar from '@/components/layout/LeftSidebar';
import RightSidebar from '@/components/layout/RightSidebar';
import FeedMiddle from '@/components/feed/FeedMiddle';

export default function FeedPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) return <div>Loading...</div>;

  return (
    <>
      <div className="_layout _layout_main_wrapper">
        <Header />
        <div className="_main_layout">
          <div className="container _custom_container">
            <div className="_layout_inner_wrap">
              <div className="row">
                <LeftSidebar />
                <FeedMiddle />
                <RightSidebar />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}