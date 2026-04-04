'use client';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import api from '@/lib/axios';
import { useAuth } from '@/components/AuthProvider';

interface PostAuthor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface LikePreviewUser {
  id: string;
  firstName: string;
  lastName: string;
}

interface PostLikePreview {
  id: string;
  userId: string;
  user: LikePreviewUser;
}

interface Post {
  id: string;
  content: string;
  imageUrl?: string | null;
  visibility: string;
  createdAt: string;
  author: PostAuthor;
  _count: { likes: number; comments: number };
  likePreview?: PostLikePreview[];
  likedByMe?: boolean;
}

function initials(u: LikePreviewUser): string {
  const a = (u.firstName?.[0] ?? '').toUpperCase();
  const b = (u.lastName?.[0] ?? '').toUpperCase();
  return (a + b) || '?';
}

function avatarBgForUserId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h} 42% 46%)`;
}

interface FeedPostProps {
  post: Post;
  onInteraction?: () => void;
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function FeedPost({ post, onInteraction }: FeedPostProps) {
  const { user: currentUser } = useAuth();
  const [liked, setLiked] = useState(post.likedByMe ?? false);
  const [likeCount, setLikeCount] = useState(post._count.likes);
  const [likers, setLikers] = useState<PostLikePreview[]>(post.likePreview ?? []);

  useEffect(() => {
    setLikers(post.likePreview ?? []);
    setLiked(post.likedByMe ?? false);
    setLikeCount(post._count.likes);
  }, [post]);
  const [commentCount] = useState(post._count.comments);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLike = async () => {
    try {
      const res = await api.post(`/interactions/post/${post.id}/like`);
      const nowLiked = res.data.liked as boolean;
      setLiked(nowLiked);
      setLikeCount((prev) => (nowLiked ? prev + 1 : Math.max(0, prev - 1)));

      if (currentUser) {
        setLikers((prev) => {
          if (nowLiked) {
            const without = prev.filter((l) => l.user.id !== currentUser.id);
            const selfEntry: PostLikePreview = {
              id: `optimistic-${currentUser.id}`,
              userId: currentUser.id,
              user: {
                id: currentUser.id,
                firstName: currentUser.firstName,
                lastName: currentUser.lastName,
              },
            };
            return [selfEntry, ...without].slice(0, 4);
          }
          return prev.filter((l) => l.user.id !== currentUser.id);
        });
      }
    } catch (error) {
      console.error('Failed to like post', error);
    }
  };

  const handleToggleComments = async () => {
    if (!showComments) {
      await fetchComments();
    }
    setShowComments(!showComments);
  };

  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const res = await api.get(`/interactions/post/${post.id}/comments`);
      setComments(res.data);
    } catch (error) {
      console.error('Failed to fetch comments', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const avatarLikers =
    likeCount > 4 ? likers.slice(0, 4) : likers.slice(0, Math.min(likeCount, likers.length));
  const likeOverflow = likeCount > 4 ? likeCount - 4 : 0;

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      await api.post(`/interactions/post/${post.id}/comment`, { content: commentText });
      setCommentText('');
      await fetchComments();
      onInteraction?.();
    } catch (error) {
      console.error('Failed to add comment', error);
    }
  };

  return (
    <div className="_feed_inner_timeline_post_area _b_radious6 _padd_b24 _padd_t24 _mar_b16">
      <div className="_feed_inner_timeline_content _padd_r24 _padd_l24">
        <div className="_feed_inner_timeline_post_top">
          <div className="_feed_inner_timeline_post_box">
            <div className="_feed_inner_timeline_post_box_image">
              <Image src="/assets/images/post_img.png" alt="" className="_post_img" width={100} height={100} />
            </div>
            <div className="_feed_inner_timeline_post_box_txt">
              <h4 className="_feed_inner_timeline_post_box_title">{post.author.firstName} {post.author.lastName}</h4>
              <p className="_feed_inner_timeline_post_box_para">{timeAgo(post.createdAt)} .{' '}
                <a href="#0">{post.visibility}</a>
              </p>
            </div>
          </div>
          <div className="_feed_inner_timeline_post_box_dropdown">
            <div className="_feed_timeline_post_dropdown">
              <button type="button" className="_feed_timeline_post_dropdown_link" onClick={() => setShowDropdown(!showDropdown)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="4" height="17" fill="none" viewBox="0 0 4 17">
                  <circle cx="2" cy="2" r="2" fill="#C4C4C4" />
                  <circle cx="2" cy="8" r="2" fill="#C4C4C4" />
                  <circle cx="2" cy="15" r="2" fill="#C4C4C4" />
                </svg>
              </button>
            </div>
            {showDropdown && (
              <div className="_feed_timeline_dropdown _timeline_dropdown" style={{ display: 'block' }}>
                <ul className="_feed_timeline_dropdown_list">
                  <li className="_feed_timeline_dropdown_item">
                    <a href="#0" className="_feed_timeline_dropdown_link">
                      <span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 18 18">
                          <path stroke="#1890FF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M14.25 15.75L9 12l-5.25 3.75v-12a1.5 1.5 0 011.5-1.5h7.5a1.5 1.5 0 011.5 1.5v12z" />
                        </svg>
                      </span>
                      Save Post
                    </a>
                  </li>
                  <li className="_feed_timeline_dropdown_item">
                    <a href="#0" className="_feed_timeline_dropdown_link">
                      <span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 18 18">
                          <path stroke="#1890FF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M14.25 2.25H3.75a1.5 1.5 0 00-1.5 1.5v10.5a1.5 1.5 0 001.5 1.5h10.5a1.5 1.5 0 001.5-1.5V3.75a1.5 1.5 0 00-1.5-1.5zM6.75 6.75l4.5 4.5M11.25 6.75l-4.5 4.5" />
                        </svg>
                      </span>
                      Hide
                    </a>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
        <h4 className="_feed_inner_timeline_post_title">{post.content}</h4>
        {post.imageUrl && (
          <div className="_feed_inner_timeline_image">
            <Image
              src={post.imageUrl.startsWith('/') ? post.imageUrl : `/${post.imageUrl}`}
              alt=""
              className="_time_img"
              width={500}
              height={300}
              style={{ width: '100%', height: 'auto' }}
            />
          </div>
        )}
      </div>
      <div className="_feed_inner_timeline_total_reacts _padd_r24 _padd_l24 _mar_b26">
        <div className="_feed_inner_timeline_total_reacts_image">
          {avatarLikers.map((like, i) => (
            <div
              key={like.id}
              className={i === 0 ? '_react_img1' : '_react_img'}
              title={`${like.user.firstName} ${like.user.lastName}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 600,
                color: '#fff',
                flexShrink: 0,
                width: 32,
                height: 32,
                minWidth: 32,
                borderRadius: '50%',
                overflow: 'hidden',
                boxSizing: 'border-box',
                background: avatarBgForUserId(like.user.id),
              }}
            >
              {initials(like.user)}
            </div>
          ))}
          {likeOverflow > 0 && (
            <p className="_feed_inner_timeline_total_reacts_para">+{likeOverflow}</p>
          )}
        </div>
        <div className="_feed_inner_timeline_total_reacts_txt">
          <p className="_feed_inner_timeline_total_reacts_para1">
            <a href="#0" onClick={(e) => { e.preventDefault(); handleToggleComments(); }}>
              <span>{commentCount}</span> Comment
            </a>
          </p>
          <p className="_feed_inner_timeline_total_reacts_para2"><span>{likeCount}</span> Like</p>
        </div>
      </div>
      <div className="_feed_inner_timeline_reaction">
        <button
          className={`_feed_inner_timeline_reaction_emoji _feed_reaction${liked ? ' _feed_reaction_active' : ''}`}
          onClick={handleLike}
        >
          <span className="_feed_inner_timeline_reaction_link">
            <span>
              <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" fill="none" viewBox="0 0 19 19">
                <path fill="#FFCC4D" d="M9.5 19a9.5 9.5 0 100-19 9.5 9.5 0 000 19z" />
                <path fill="#664500" d="M9.5 11.083c-1.912 0-3.181-.222-4.75-.527-.358-.07-1.056 0-1.056 1.055 0 2.111 2.425 4.75 5.806 4.75 3.38 0 5.805-2.639 5.805-4.75 0-1.055-.697-1.125-1.055-1.055-1.57.305-2.838.527-4.75.527z" />
                <path fill="#fff" d="M4.75 11.611s1.583.528 4.75.528 4.75-.528 4.75-.528-1.056 2.111-4.75 2.111-4.75-2.11-4.75-2.11z" />
                <path fill="#664500" d="M6.333 8.972c.729 0 1.32-.827 1.32-1.847s-.591-1.847-1.32-1.847c-.729 0-1.32.827-1.32 1.847s.591 1.847 1.32 1.847zM12.667 8.972c.729 0 1.32-.827 1.32-1.847s-.591-1.847-1.32-1.847c-.729 0-1.32.827-1.32 1.847s.591 1.847 1.32 1.847z" />
              </svg>
              Like
            </span>
          </span>
        </button>
        <button className="_feed_inner_timeline_reaction_comment _feed_reaction" onClick={handleToggleComments}>
          <span className="_feed_inner_timeline_reaction_link">
            <span>
              <svg className="_reaction_svg" xmlns="http://www.w3.org/2000/svg" width="21" height="21" fill="none" viewBox="0 0 21 21">
                <path stroke="#000" d="M1 10.5c0-.464 0-.696.009-.893A9 9 0 019.607 1.01C9.804 1 10.036 1 10.5 1v0c.464 0 .696 0 .893.009a9 9 0 018.598 8.598c.009.197.009.429.009.893v6.046c0 1.36 0 2.041-.317 2.535a2 2 0 01-.602.602c-.494.317-1.174.317-2.535.317H10.5c-.464 0-.696 0-.893-.009a9 9 0 01-8.598-8.598C1 11.196 1 10.964 1 10.5v0z" />
                <path stroke="#000" strokeLinecap="round" strokeLinejoin="round" d="M6.938 9.313h7.125M10.5 14.063h3.563" />
              </svg>
              Comment
            </span>
          </span>
        </button>
        <button className="_feed_inner_timeline_reaction_share _feed_reaction">
          <span className="_feed_inner_timeline_reaction_link">
            <span>
              <svg className="_reaction_svg" xmlns="http://www.w3.org/2000/svg" width="24" height="21" fill="none" viewBox="0 0 24 21">
                <path stroke="#000" strokeLinejoin="round" d="M23 10.5L12.917 1v5.429C3.267 6.429 1 13.258 1 20c2.785-3.52 5.248-5.429 11.917-5.429V20L23 10.5z" />
              </svg>
              Share
            </span>
          </span>
        </button>
      </div>

      {showComments && (
        <div className="_feed_inner_timeline_cooment_area">
          <div className="_feed_inner_comment_box">
            <form className="_feed_inner_comment_box_form" onSubmit={handleSubmitComment}>
              <div className="_feed_inner_comment_box_content">
                <div className="_feed_inner_comment_box_content_image">
                  <Image src="/assets/images/comment_img.png" alt="" className="_comment_img" width={100} height={100} />
                </div>
                <div className="_feed_inner_comment_box_content_txt">
                  <textarea
                    className="form-control _comment_textarea"
                    placeholder="Write a comment"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmitComment(e);
                      }
                    }}
                  />
                </div>
              </div>
            </form>
          </div>

          {loadingComments ? (
            <div style={{ padding: '12px 24px', fontSize: '13px', color: '#999' }}>Loading comments...</div>
          ) : (
            <div className="_timline_comment_main">
              {comments.map((comment) => (
                <div key={comment.id} className="_comment_main">
                  <div className="_comment_image">
                    <a href="#0" className="_comment_image_link">
                      <Image src="/assets/images/txt_img.png" alt="" className="_comment_img1" width={100} height={100} />
                    </a>
                  </div>
                  <div className="_comment_area">
                    <div className="_comment_area_box">
                      <h5 className="_comment_name">{comment.author.firstName} {comment.author.lastName}</h5>
                      <p className="_comment_text">{comment.content}</p>
                    </div>
                    <div className="_comment_reply">
                      <div className="_comment_reply_num">
                        <ul className="_comment_reply_list">
                          <li><span>Like.</span></li>
                          <li><span>Reply.</span></li>
                          <li><span className="_time_link">.{timeAgo(comment.createdAt)}</span></li>
                        </ul>
                      </div>
                    </div>
                    {comment.replies?.map((reply: any) => (
                      <div key={reply.id} className="_comment_main" style={{ marginLeft: '24px', marginTop: '8px' }}>
                        <div className="_comment_image">
                          <a href="#0" className="_comment_image_link">
                            <Image src="/assets/images/txt_img.png" alt="" className="_comment_img1" width={100} height={100} />
                          </a>
                        </div>
                        <div className="_comment_area">
                          <div className="_comment_area_box">
                            <h5 className="_comment_name">{reply.author.firstName} {reply.author.lastName}</h5>
                            <p className="_comment_text">{reply.content}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
