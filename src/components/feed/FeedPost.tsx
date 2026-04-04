'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import api from '@/lib/axios';
import { resolveUploadUrl } from '@/lib/api-asset-url';
import { useAuth } from '@/components/AuthProvider';
import { NameAvatar } from '@/components/ui/name-avatar';

interface PostAuthor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface PostLikePreview {
  id: string;
  userId: string;
  user: { id: string; firstName: string; lastName: string };
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

interface CommentAuthor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface ReplyNode {
  id: string;
  content: string;
  createdAt: string;
  author: CommentAuthor;
  likedByMe?: boolean;
  _count: { likes: number };
}

interface CommentNode {
  id: string;
  content: string;
  createdAt: string;
  author: CommentAuthor;
  likedByMe?: boolean;
  _count: { likes: number; replies: number };
  replies: ReplyNode[];
}

interface FeedPostProps {
  post: Post;
  onInteraction?: () => void;
}

/** Top-level comment or a reply — used to find the globally latest activity */
type FlatCommentRef =
  | { kind: 'top'; comment: CommentNode }
  | { kind: 'reply'; parent: CommentNode; reply: ReplyNode };

function flattenCommentRefs(comments: CommentNode[]): FlatCommentRef[] {
  const out: FlatCommentRef[] = [];
  for (const c of comments) {
    out.push({ kind: 'top', comment: c });
    for (const r of c.replies || []) {
      out.push({ kind: 'reply', parent: c, reply: r });
    }
  }
  return out;
}

function getLatestCommentRef(comments: CommentNode[]): FlatCommentRef | null {
  const flat = flattenCommentRefs(comments);
  if (flat.length === 0) return null;
  return flat.reduce((best, cur) => {
    const tb = cur.kind === 'top' ? cur.comment.createdAt : cur.reply.createdAt;
    const bb = best.kind === 'top' ? best.comment.createdAt : best.reply.createdAt;
    return new Date(tb) > new Date(bb) ? cur : best;
  });
}

/** Collapsed: only the latest comment/reply; if latest is a reply, show parent + that reply */
function buildCollapsedThreads(comments: CommentNode[]): CommentNode[] {
  const latest = getLatestCommentRef(comments);
  if (!latest) return [];
  if (latest.kind === 'top') {
    return [{ ...latest.comment, replies: [] }];
  }
  return [{ ...latest.parent, replies: [latest.reply] }];
}

/** Toggle like on a top-level comment or a reply (immutable) */
function mapCommentLikeToggle(comments: CommentNode[], commentId: string): CommentNode[] {
  return comments.map((c) => {
    if (c.id === commentId) {
      const liked = !!c.likedByMe;
      return {
        ...c,
        likedByMe: !liked,
        _count: {
          ...c._count,
          likes: Math.max(0, c._count.likes + (liked ? -1 : 1)),
        },
      };
    }
    const replies = c.replies || [];
    let hit = false;
    const newReplies = replies.map((r) => {
      if (r.id !== commentId) return r;
      hit = true;
      const liked = !!r.likedByMe;
      return {
        ...r,
        likedByMe: !liked,
        _count: {
          ...r._count,
          likes: Math.max(0, r._count.likes + (liked ? -1 : 1)),
        },
      };
    });
    return hit ? { ...c, replies: newReplies } : c;
  });
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

/** Sticker + GIF + submit (arrow send) under the comment textarea */
function CommentComposerToolbar({ sendDisabled }: { sendDisabled: boolean }) {
  return (
    <div className="_feed_inner_comment_box_toolbar">
      <div className="_feed_inner_comment_box_icon">
        <button type="button" className="_feed_inner_comment_box_icon_btn" aria-label="Sticker">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16">
            <path
              fill="#000"
              fillOpacity=".46"
              fillRule="evenodd"
              d="M13.167 6.534a.5.5 0 01.5.5c0 3.061-2.35 5.582-5.333 5.837V14.5a.5.5 0 01-1 0v-1.629C4.35 12.616 2 10.096 2 7.034a.5.5 0 011 0c0 2.679 2.168 4.859 4.833 4.859 2.666 0 4.834-2.18 4.834-4.86a.5.5 0 01.5-.5zM7.833.667a3.218 3.218 0 013.208 3.22v3.126c0 1.775-1.439 3.22-3.208 3.22a3.218 3.218 0 01-3.208-3.22V3.887c0-1.776 1.44-3.22 3.208-3.22zm0 1a2.217 2.217 0 00-2.208 2.22v3.126c0 1.223.991 2.22 2.208 2.22a2.217 2.217 0 002.208-2.22V3.887c0-1.224-.99-2.22-2.208-2.22z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        <button type="button" className="_feed_inner_comment_box_icon_btn" aria-label="GIF">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16">
            <path
              fill="#000"
              fillOpacity=".46"
              fillRule="evenodd"
              d="M10.867 1.333c2.257 0 3.774 1.581 3.774 3.933v5.435c0 2.352-1.517 3.932-3.774 3.932H5.101c-2.254 0-3.767-1.58-3.767-3.932V5.266c0-2.352 1.513-3.933 3.767-3.933h5.766zm0 1H5.101c-1.681 0-2.767 1.152-2.767 2.933v5.435c0 1.782 1.086 2.932 2.767 2.932h5.766c1.685 0 2.774-1.15 2.774-2.932V5.266c0-1.781-1.089-2.933-2.774-2.933zm.426 5.733l.017.015.013.013.009.008.037.037c.12.12.453.46 1.443 1.477a.5.5 0 11-.716.697S10.73 8.91 10.633 8.816a.614.614 0 00-.433-.118.622.622 0 00-.421.225c-1.55 1.88-1.568 1.897-1.594 1.922a1.456 1.456 0 01-2.057-.021s-.62-.63-.63-.642c-.155-.143-.43-.134-.594.04l-1.02 1.076a.498.498 0 01-.707.018.499.499 0 01-.018-.706l1.018-1.075c.54-.573 1.45-.6 2.025-.06l.639.647c.178.18.467.184.646.008l1.519-1.843a1.618 1.618 0 011.098-.584c.433-.038.854.088 1.19.363zM5.706 4.42c.921 0 1.67.75 1.67 1.67 0 .92-.75 1.67-1.67 1.67-.92 0-1.67-.75-1.67-1.67 0-.921.75-1.67 1.67-1.67zm0 1a.67.67 0 10.001 1.34.67.67 0 00-.002-1.34z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
      <button
        type="submit"
        className="_feed_inner_comment_box_send"
        disabled={sendDisabled}
        aria-label="Send comment"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
        </svg>
      </button>
    </div>
  );
}

interface CommentBubbleProps {
  author: CommentAuthor;
  content: string;
  createdAt: string;
  likeCount: number;
  likedByMe?: boolean;
  onLike: () => void;
  onReply?: () => void;
  showReply?: boolean;
  showShare?: boolean;
}

/** Matches docs/feed.html — bubble + floating reaction pill + Like./Reply./Share. row */
function CommentBubble({
  author,
  content,
  createdAt,
  likeCount,
  likedByMe,
  onLike,
  onReply,
  showReply = true,
  showShare = true,
}: CommentBubbleProps) {
  const name = `${author.firstName} ${author.lastName}`.trim();
  return (
    <div className="_comment_details">
      <div className="_comment_details_top">
        <div className="_comment_name">
          <a href="#0" onClick={(e) => e.preventDefault()}>
            <h4 className="_comment_name_title">{name}</h4>
          </a>
        </div>
      </div>
      <div className="_comment_status">
        <p className="_comment_status_text">
          <span>{content}</span>
        </p>
      </div>
      {likeCount > 0 ? (
        <button
          type="button"
          className="_total_reactions"
          onClick={onLike}
          aria-pressed={!!likedByMe}
          aria-label={likedByMe ? 'Unlike comment' : 'Like comment'}
        >
          <div className="_total_react">
            <span className={`_reaction_like ${likedByMe ? '_reaction_like_on' : ''}`}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
              </svg>
            </span>
          </div>
          <span className="_total">{likeCount}</span>
        </button>
      ) : null}
      <div className="_comment_reply">
        <div className="_comment_reply_num">
          <ul className="_comment_reply_list">
            <li>
              <span
                role="presentation"
                className={likedByMe ? '_comment_like_active' : undefined}
                onClick={onLike}
              >
                Like.
              </span>
            </li>
            {showReply && onReply ? (
              <li>
                <span role="presentation" onClick={onReply}>
                  Reply.
                </span>
              </li>
            ) : null}
            {showShare ? (
              <li>
                <span role="presentation" onClick={(e) => e.preventDefault()}>
                  Share
                </span>
              </li>
            ) : null}
            <li>
              <span className="_time_link">.{timeAgo(createdAt)}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
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
  const [commentCount, setCommentCount] = useState(post._count.comments);
  const [comments, setComments] = useState<CommentNode[]>([]);
  const [commentText, setCommentText] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [loadingComments, setLoadingComments] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  /** false = show latest comment only (+ View N previous when N≥1) */
  const [showAllComments, setShowAllComments] = useState(false);

  const postImageSrc = resolveUploadUrl(post.imageUrl);

  useEffect(() => {
    setCommentCount(post._count.comments);
  }, [post]);

  const flatCommentRefs = useMemo(() => flattenCommentRefs(comments), [comments]);
  const totalCommentNodes = flatCommentRefs.length;
  const threadsToRender = useMemo(() => {
    if (showAllComments || totalCommentNodes <= 1) return comments;
    return buildCollapsedThreads(comments);
  }, [comments, showAllComments, totalCommentNodes]);

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

  const fetchComments = useCallback(async () => {
    setLoadingComments(true);
    try {
      const res = await api.get<CommentNode[]>(`/interactions/post/${post.id}/comments`);
      setComments(res.data);
    } catch (error) {
      console.error('Failed to fetch comments', error);
    } finally {
      setLoadingComments(false);
    }
  }, [post.id]);

  useEffect(() => {
    void fetchComments();
  }, [fetchComments]);

  const avatarLikers =
    likeCount > 4 ? likers.slice(0, 4) : likers.slice(0, Math.min(likeCount, likers.length));
  const likeOverflow = likeCount > 4 ? likeCount - 4 : 0;

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      await api.post(`/interactions/post/${post.id}/comment`, { content: commentText.trim() });
      setCommentText('');
      await fetchComments();
      setCommentCount((c) => c + 1);
      setShowAllComments(false);
      onInteraction?.();
    } catch (error) {
      console.error('Failed to add comment', error);
    }
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyingToId || !replyText.trim()) return;
    try {
      await api.post(`/interactions/post/${post.id}/comment`, {
        content: replyText.trim(),
        parentId: replyingToId,
      });
      setReplyText('');
      setReplyingToId(null);
      await fetchComments();
      setCommentCount((c) => c + 1);
      setShowAllComments(false);
      onInteraction?.();
    } catch (error) {
      console.error('Failed to add reply', error);
    }
  };

  const handleCommentLike = async (commentId: string) => {
    let before: CommentNode[] | null = null;
    setComments((prev) => {
      before = prev;
      return mapCommentLikeToggle(prev, commentId);
    });
    try {
      await api.post(`/interactions/comment/${commentId}/like`);
    } catch (error) {
      console.error('Failed to like comment', error);
      if (before) setComments(before);
    }
  };

  return (
    <div className="_feed_inner_timeline_post_area _b_radious6 _padd_b24 _padd_t24 _mar_b16">
      <div className="_feed_inner_timeline_content _padd_r24 _padd_l24">
        <div className="_feed_inner_timeline_post_top">
          <div className="_feed_inner_timeline_post_box">
            <div className="_feed_inner_timeline_post_box_image">
              <NameAvatar user={post.author} size={44} className="_post_img" />
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
        {postImageSrc ? (
          <div className="_feed_inner_timeline_image">
            <Image
              src={postImageSrc}
              alt=""
              className="_time_img"
              width={500}
              height={300}
              style={{ width: '100%', height: 'auto' }}
            />
          </div>
        ) : null}
      </div>
      <div className="_feed_inner_timeline_total_reacts _padd_r24 _padd_l24 _mar_b26">
        <div className="_feed_inner_timeline_total_reacts_image">
          {avatarLikers.map((like, i) => (
            <NameAvatar
              key={like.id}
              user={like.user}
              size={32}
              className={i === 0 ? '_react_img1' : '_react_img'}
            />
          ))}
          {likeOverflow > 0 && (
            <p className="_feed_inner_timeline_total_reacts_para">+{likeOverflow}</p>
          )}
        </div>
        <div className="_feed_inner_timeline_total_reacts_txt">
          <p className="_feed_inner_timeline_total_reacts_para1">
            <a href="#0" onClick={(e) => { e.preventDefault(); void fetchComments(); }}>
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
        <button
          type="button"
          className="_feed_inner_timeline_reaction_comment _feed_reaction"
          onClick={() => void fetchComments()}
        >
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

      <div className="_feed_inner_timeline_cooment_area">
          <div className="_feed_inner_comment_box">
            <form className="_feed_inner_comment_box_form" onSubmit={handleSubmitComment}>
              <div className="_feed_inner_comment_box_content">
                <div className="_feed_inner_comment_box_content_image">
                  {currentUser ? (
                    <NameAvatar user={currentUser} size={26} className="_comment_img" />
                  ) : null}
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
              <CommentComposerToolbar sendDisabled={!commentText.trim()} />
            </form>
          </div>

          {loadingComments ? (
            <div style={{ padding: '8px 0', fontSize: '13px', color: '#999' }}>Loading comments...</div>
          ) : (
            <div className="_timline_comment_main">
              {totalCommentNodes > 1 && !showAllComments && (
                <div className="_previous_comment">
                  <button
                    type="button"
                    className="_previous_comment_txt"
                    onClick={() => setShowAllComments(true)}
                  >
                    View {totalCommentNodes - 1} previous comments
                  </button>
                </div>
              )}
              {showAllComments && totalCommentNodes > 1 && (
                <div className="_previous_comment">
                  <button
                    type="button"
                    className="_previous_comment_txt"
                    onClick={() => setShowAllComments(false)}
                  >
                    Hide previous comments
                  </button>
                </div>
              )}
              {threadsToRender.map((comment) => (
                <React.Fragment key={comment.id}>
                  <div className="_comment_main _feed_comment_compact">
                    <div className="_comment_image">
                      <a href="#0" className="_comment_image_link" onClick={(e) => e.preventDefault()}>
                        <NameAvatar user={comment.author} size={36} className="_comment_img1" />
                      </a>
                    </div>
                    <div className="_comment_area">
                      <CommentBubble
                        author={comment.author}
                        content={comment.content}
                        createdAt={comment.createdAt}
                        likeCount={comment._count.likes}
                        likedByMe={comment.likedByMe}
                        onLike={() => handleCommentLike(comment.id)}
                        onReply={() => {
                          setReplyingToId((prev) => (prev === comment.id ? null : comment.id));
                          setReplyText('');
                        }}
                        showReply
                        showShare
                      />
                      {replyingToId === comment.id ? (
                        <div className="_feed_inner_comment_box">
                          <form className="_feed_inner_comment_box_form" onSubmit={handleSubmitReply}>
                            <div className="_feed_inner_comment_box_content">
                              <div className="_feed_inner_comment_box_content_image">
                                {currentUser ? (
                                  <NameAvatar user={currentUser} size={26} className="_comment_img" />
                                ) : null}
                              </div>
                              <div className="_feed_inner_comment_box_content_txt">
                                <textarea
                                  className="form-control _comment_textarea"
                                  placeholder="Write a comment"
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                      e.preventDefault();
                                      handleSubmitReply(e);
                                    }
                                  }}
                                />
                              </div>
                            </div>
                            <CommentComposerToolbar sendDisabled={!replyText.trim()} />
                          </form>
                        </div>
                      ) : null}
                    </div>
                  </div>
                  {comment.replies?.map((reply) => (
                    <div key={reply.id} className="_comment_main _feed_comment_main_nested _feed_comment_compact">
                      <div className="_comment_image">
                        <a href="#0" className="_comment_image_link" onClick={(e) => e.preventDefault()}>
                          <NameAvatar user={reply.author} size={32} className="_comment_img1" />
                        </a>
                      </div>
                      <div className="_comment_area">
                        <CommentBubble
                          author={reply.author}
                          content={reply.content}
                          createdAt={reply.createdAt}
                          likeCount={reply._count.likes}
                          likedByMe={reply.likedByMe}
                          onLike={() => handleCommentLike(reply.id)}
                          showReply={false}
                          showShare
                        />
                      </div>
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}
