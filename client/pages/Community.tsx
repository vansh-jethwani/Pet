import { useState, useEffect, useCallback, useRef } from "react";
import { useUser } from "@clerk/clerk-react";
import { io as socketIO, Socket } from "socket.io-client";
import Header from "@/components/Header";
import { cn } from "@/lib/utils";
import type { Post, Reply, PostCategory, CreatePostBody } from "@shared/api";
import {
  Heart, MessageSquare, Eye, Plus, Search, Filter, X,
  Send, ChevronDown, ChevronUp, Flame, Clock, TrendingUp,
  Tag, Loader2, AlertCircle, RefreshCw, Wifi, WifiOff, CornerDownRight,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Category = "all" | PostCategory;
type SortBy   = "recent" | "popular" | "trending";

interface PostWithLiked extends Post {
  likedByMe: boolean;
  replies:   ReplyWithLiked[];
}
interface ReplyWithLiked extends Reply {
  likedByMe: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const API = "/api/community";

const CATEGORY_META: Record<PostCategory, { label: string; color: string; bg: string }> = {
  tips:      { label: "Tips & Advice",   color: "text-emerald-700", bg: "bg-emerald-100" },
  stories:   { label: "Success Stories", color: "text-orange-700",  bg: "bg-orange-100"  },
  questions: { label: "Questions",       color: "text-blue-700",    bg: "bg-blue-100"    },
  events:    { label: "Events",          color: "text-purple-700",  bg: "bg-purple-100"  },
};

const SORT_OPTIONS: { value: SortBy; label: string; icon: React.ReactNode }[] = [
  { value: "recent",   label: "Most Recent", icon: <Clock      className="w-4 h-4" /> },
  { value: "popular",  label: "Most Liked",  icon: <Flame      className="w-4 h-4" /> },
  { value: "trending", label: "Most Viewed", icon: <TrendingUp className="w-4 h-4" /> },
];

// ─── API helpers ──────────────────────────────────────────────────────────────

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Network error" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// ─── Render reply content with @mention highlighted ───────────────────────────

function ReplyContent({ content }: { content: string }) {
  // Match a leading @mention like "@Vansh " at the start of the string
  const match = content.match(/^(@\S+)\s([\s\S]*)$/);
  if (match) {
    return (
      <p className="text-gray-700 text-sm leading-relaxed">
        <span className="text-orange-500 font-bold">{match[1]}</span>{" "}
        {match[2]}
      </p>
    );
  }
  return <p className="text-gray-700 text-sm leading-relaxed">{content}</p>;
}

// ─── ReplyItem ────────────────────────────────────────────────────────────────

function ReplyItem({
  reply,
  onLike,
  onReplyTo,
  isNested = false,
}: {
  reply:      ReplyWithLiked;
  onLike:     (id: string) => void;
  onReplyTo:  (replyId: string, author: string) => void;
  isNested?:  boolean;
}) {
  return (
    <div className={cn("flex gap-3 py-3", isNested && "pl-8 border-l-2 border-orange-100 ml-4")}>
      {/* Avatar */}
      <div className="text-xl flex-shrink-0 mt-0.5">{reply.avatar}</div>

      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="font-semibold text-gray-900 text-sm">{reply.author}</span>
          <span className="text-xs text-gray-400">
            {new Date(reply.createdAt).toLocaleString("en-IN", {
              day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
            })}
          </span>
        </div>

        {/* Content — highlights @mention if present */}
        <ReplyContent content={reply.content} />

        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-2">
          {/* Like */}
          <button
            onClick={() => onLike(reply.id)}
            className={cn(
              "flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full transition-colors",
              reply.likedByMe
                ? "bg-red-100 text-red-600"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            )}
          >
            <Heart className="w-3 h-3 fill-current" />
            {reply.likes}
          </button>

          {/* Reply to this reply */}
          <button
            onClick={() => onReplyTo(reply.id, reply.author)}
            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 hover:bg-orange-100 hover:text-orange-600 transition-colors"
          >
            <CornerDownRight className="w-3 h-3" />
            Reply
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PostCard ─────────────────────────────────────────────────────────────────

function PostCard({
  post, currentUserId, currentUserName,
  onLikePost, onLikeReply, onAddReply, onExpand, onDeletePost, onEditPost,
}: {
  post:            PostWithLiked;
  currentUserId:   string;
  currentUserName: string;
  onLikePost:    (id: string, liked: boolean) => void;
  onLikeReply:   (postId: string, replyId: string, liked: boolean) => void;
  onAddReply:    (postId: string, content: string) => Promise<void>;
  onExpand:      (id: string) => void;
  onDeletePost?: (id: string) => void;
  onEditPost?:   (post: PostWithLiked) => void;
}) {
  const isOwn = !!currentUserId && post.clerkId === currentUserId;
  const [expanded,       setExpanded]       = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText,      setReplyText]      = useState("");
  const [submitting,     setSubmitting]     = useState(false);

  // Which reply we are responding to (null = replying to post directly)
  const [replyingTo, setReplyingTo] = useState<{ id: string; author: string } | null>(null);

  const replyInputRef = useRef<HTMLTextAreaElement>(null);
  const meta = CATEGORY_META[post.category];

  const handleToggleExpand = () => {
    if (!expanded) onExpand(post.id);
    setExpanded(e => !e);
    setShowReplyInput(false);
    setReplyingTo(null);
  };

  // Opens the reply box for the whole post
  const handleOpenPostReply = () => {
    setReplyingTo(null);
    setReplyText("");
    setShowReplyInput(true);
    setExpanded(true);
    setTimeout(() => replyInputRef.current?.focus(), 50);
  };

  // Opens the reply box pre-filled with @mention for a specific reply
  const handleReplyTo = (replyId: string, author: string) => {
    setReplyingTo({ id: replyId, author });
    setReplyText(`@${author} `);
    setShowReplyInput(true);
    setExpanded(true);
    setTimeout(() => {
      if (replyInputRef.current) {
        replyInputRef.current.focus();
        // Place cursor at end
        const len = replyInputRef.current.value.length;
        replyInputRef.current.setSelectionRange(len, len);
      }
    }, 50);
  };

  const handleCancelReply = () => {
    setShowReplyInput(false);
    setReplyText("");
    setReplyingTo(null);
  };

  const handleSubmitReply = async () => {
    const trimmed = replyText.trim();
    if (!trimmed || submitting) return;
    // Don't allow submitting just "@Author" with nothing after it
    if (replyingTo && trimmed === `@${replyingTo.author}`) return;
    setSubmitting(true);
    await onAddReply(post.id, trimmed);
    setReplyText("");
    setShowReplyInput(false);
    setReplyingTo(null);
    setExpanded(true);
    setSubmitting(false);
  };

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100">
      {/* Post body */}
      <div className="p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="text-3xl flex-shrink-0">{post.avatar}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <p className="font-semibold text-gray-900">{post.author}</p>
                <p className="text-xs text-gray-400">
                  {new Date(post.createdAt).toLocaleString("en-IN", {
                    day: "numeric", month: "short", year: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn("text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap", meta.bg, meta.color)}>
                  {meta.label}
                </span>
                {isOwn && (
                  <>
                    <button
                      onClick={() => onEditPost?.(post)}
                      className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => onDeletePost?.(post.id)}
                      className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                    >
                      🗑️ Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2 leading-snug">{post.title}</h2>
        <p className="text-gray-600 leading-relaxed text-sm">{post.content}</p>
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {post.tags.map(tag => (
              <span key={tag} className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full text-xs font-medium">
                <Tag className="w-3 h-3" />{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Action bar */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <button onClick={handleToggleExpand} className="flex items-center gap-1.5 hover:text-orange-500 transition-colors font-medium">
            <MessageSquare className="w-4 h-4" />
            {post.replies.length} {post.replies.length === 1 ? "Reply" : "Replies"}
            {post.replies.length > 0 && (expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
          </button>
          <span className="flex items-center gap-1.5">
            <Eye className="w-4 h-4" />{post.views}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onLikePost(post.id, post.likedByMe)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors",
              post.likedByMe ? "bg-red-100 text-red-600" : "bg-gray-200 text-gray-600 hover:bg-gray-300"
            )}
          >
            <Heart className="w-4 h-4 fill-current" />{post.likes}
          </button>
          <button
            onClick={handleOpenPostReply}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-orange-100 text-orange-600 hover:bg-orange-200 transition-colors"
          >
            <MessageSquare className="w-4 h-4" />Reply
          </button>
        </div>
      </div>

      {/* Replies + inline reply input */}
      {(expanded || showReplyInput) && (
        <div className="px-6 pb-4 border-t border-gray-100">

          {/* Inline reply composer */}
          {showReplyInput && (
            <div className="flex gap-3 pt-4 pb-2">
              <div className="text-2xl flex-shrink-0">🐾</div>
              <div className="flex-1">
                {/* Context label showing who we're replying to */}
                {replyingTo && (
                  <div className="flex items-center gap-1.5 mb-1.5 text-xs text-orange-600 font-semibold">
                    <CornerDownRight className="w-3 h-3" />
                    Replying to <span className="font-bold">@{replyingTo.author}</span>
                    <button
                      onClick={() => {
                        setReplyingTo(null);
                        setReplyText("");
                      }}
                      className="ml-1 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <textarea
                  ref={replyInputRef}
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder={
                    replyingTo
                      ? `Reply to @${replyingTo.author}…`
                      : "Write a reply to this post…"
                  }
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none"
                  onKeyDown={e => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmitReply();
                  }}
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[11px] text-gray-400">Ctrl+Enter to post</span>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancelReply}
                      className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmitReply}
                      disabled={
                        !replyText.trim() ||
                        submitting ||
                        (!!replyingTo && replyText.trim() === `@${replyingTo.author}`)
                      }
                      className="flex items-center gap-1.5 px-4 py-1.5 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      {submitting
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Send className="w-3.5 h-3.5" />
                      }
                      {replyingTo ? "Post Reply" : "Post Reply"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Reply list */}
          {expanded && post.replies.length > 0 && (
            <div className="divide-y divide-gray-100 mt-1">
              {post.replies.map(reply => {
                // A reply is "nested" (visually indented) when its content
                // starts with @SomeAuthor — meaning it's a reply-to-reply
                const isNested = /^@\S+\s/.test(reply.content);
                return (
                  <ReplyItem
                    key={reply.id}
                    reply={reply}
                    onLike={rid => onLikeReply(post.id, rid, reply.likedByMe)}
                    onReplyTo={handleReplyTo}
                    isNested={isNested}
                  />
                );
              })}
            </div>
          )}

          {expanded && post.replies.length === 0 && !showReplyInput && (
            <p className="text-sm text-gray-400 text-center py-4">No replies yet — be the first!</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── NewPostModal ─────────────────────────────────────────────────────────────

function EditPostModal({ post, onClose, onSave }: {
  post:    PostWithLiked;
  onClose: () => void;
  onSave:  (id: string, title: string, content: string, tags: string[]) => Promise<void>;
}) {
  const [title,      setTitle]      = useState(post.title);
  const [content,    setContent]    = useState(post.content);
  const [tagsInput,  setTagsInput]  = useState(post.tags.join(", "));
  const [errors,     setErrors]     = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSave = async () => {
    const e: Record<string, string> = {};
    if (!title.trim())   e.title   = "Title is required";
    if (!content.trim()) e.content = "Content is required";
    setErrors(e);
    if (Object.keys(e).length > 0 || submitting) return;
    setSubmitting(true);
    try {
      const tags = tagsInput.split(",").map(t => t.trim().toLowerCase()).filter(Boolean);
      await onSave(post.id, title.trim(), content.trim(), tags);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Edit Post</h2>
          <button onClick={onClose} className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
            <input value={title}
              onChange={e => { setTitle(e.target.value); if (errors.title) setErrors(p => ({ ...p, title: "" })); }}
              className={cn("w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent",
                errors.title ? "border-red-400 bg-red-50" : "border-gray-200")} />
            {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Content</label>
            <textarea value={content} rows={5}
              onChange={e => { setContent(e.target.value); if (errors.content) setErrors(p => ({ ...p, content: "" })); }}
              className={cn("w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none",
                errors.content ? "border-red-400 bg-red-50" : "border-gray-200")} />
            {errors.content && <p className="text-xs text-red-600 mt-1">{errors.content}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tags <span className="text-gray-400 font-normal">(optional, comma-separated)</span>
            </label>
            <input value={tagsInput} onChange={e => setTagsInput(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent" />
          </div>
        </div>
        <div className="flex gap-3 p-6 pt-0">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={submitting}
            className="flex-1 px-4 py-2.5 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

function NewPostModal({ onClose, onSubmit }: {
  onClose:  () => void;
  onSubmit: (data: CreatePostBody) => Promise<void>;
}) {
  const [title,      setTitle]      = useState("");
  const [content,    setContent]    = useState("");
  const [category,   setCategory]   = useState<PostCategory>("tips");
  const [tagsInput,  setTagsInput]  = useState("");
  const [errors,     setErrors]     = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const e: Record<string, string> = {};
    if (!title.trim())   e.title   = "Title is required";
    if (!content.trim()) e.content = "Content is required";
    setErrors(e);
    if (Object.keys(e).length > 0 || submitting) return;

    setSubmitting(true);
    try {
      const tags = tagsInput.split(",").map(t => t.trim().toLowerCase()).filter(Boolean);
      await onSubmit({ author: "", avatar: "🐾", category, title: title.trim(), content: content.trim(), tags }); // author filled by parent
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Create New Post</h2>
          <button onClick={onClose} className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(CATEGORY_META) as [PostCategory, typeof CATEGORY_META[PostCategory]][]).map(([val, meta]) => (
                <button key={val} onClick={() => setCategory(val)}
                  className={cn("px-3 py-2 rounded-xl text-sm font-semibold border-2 transition-all",
                    category === val ? `${meta.bg} ${meta.color} border-current` : "bg-gray-50 text-gray-600 border-transparent hover:bg-gray-100"
                  )}>{meta.label}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
            <input value={title}
              onChange={e => { setTitle(e.target.value); if (errors.title) setErrors(p => ({ ...p, title: "" })); }}
              placeholder="Give your post a clear, descriptive title..."
              className={cn("w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent",
                errors.title ? "border-red-400 bg-red-50" : "border-gray-200")}
            />
            {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Content</label>
            <textarea value={content} rows={5}
              onChange={e => { setContent(e.target.value); if (errors.content) setErrors(p => ({ ...p, content: "" })); }}
              placeholder="Share your story, question, tip, or event details..."
              className={cn("w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none",
                errors.content ? "border-red-400 bg-red-50" : "border-gray-200")}
            />
            {errors.content && <p className="text-xs text-red-600 mt-1">{errors.content}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tags <span className="text-gray-400 font-normal">(optional, comma-separated)</span>
            </label>
            <input value={tagsInput} onChange={e => setTagsInput(e.target.value)}
              placeholder="e.g. dogs, training, behaviour"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex gap-3 p-6 pt-0">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={submitting}
            className="flex-1 px-4 py-2.5 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Publish Post
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Community() {
  const { user } = useUser();
  const currentAuthor  = user?.firstName || user?.fullName || "You";
  const currentClerkId = user?.id ?? "";

  const [posts,            setPosts]            = useState<PostWithLiked[]>([]);
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category>("all");
  const [sortBy,           setSortBy]           = useState<SortBy>("recent");
  const [searchTerm,       setSearchTerm]       = useState("");
  const [showNewPost,      setShowNewPost]       = useState(false);

  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const [editingPost, setEditingPost] = useState<PostWithLiked | null>(null);

  // ── Initial data load — pass clerkId so server computes likedByMe ──────────
  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = currentClerkId ? `?clerkId=${encodeURIComponent(currentClerkId)}` : "";
      const data = await apiFetch<PostWithLiked[]>(`${API}/posts${params}`);
      // Server now returns likedByMe correctly — no need to override with false
      setPosts(data);
    } catch (e: any) {
      setError(e.message || "Failed to load posts");
    } finally {
      setLoading(false);
    }
  }, [currentClerkId]);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  // ── Socket.io ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const socket = socketIO(window.location.origin, {
      path:       "/socket.io",
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect",    () => setIsConnected(true));
    socket.on("disconnect", () => setIsConnected(false));

    socket.on("new_post", (newPost: PostWithLiked) => {
      setPosts(prev => {
        if (prev.some(p => p.id === newPost.id)) return prev;
        return [{ ...newPost, likedByMe: newPost.likedByMe ?? false, replies: (newPost.replies ?? []).map(r => ({ ...r, likedByMe: false })) }, ...prev];
      });
    });

    socket.on("post_liked", ({ id, likes }: { id: string; likes: number }) => {
      // Don't override likedByMe from socket — that comes from polling
      setPosts(prev => prev.map(p => p.id === id ? { ...p, likes } : p));
    });

    socket.on("post_viewed", ({ id, views }: { id: string; views: number }) => {
      setPosts(prev => prev.map(p => p.id === id ? { ...p, views } : p));
    });

    socket.on("post_updated", (updated: PostWithLiked) => {
      setPosts(prev => prev.map(p => p.id === updated.id ? { ...updated, likedByMe: p.likedByMe, replies: p.replies } : p));
    });

    socket.on("post_deleted", ({ id }: { id: string }) => {
      setPosts(prev => prev.filter(p => p.id !== id));
    });

    socket.on("new_reply", ({ postId, reply }: { postId: string; reply: ReplyWithLiked }) => {
      setPosts(prev => prev.map(p => {
        if (p.id !== postId) return p;
        if (p.replies.some(r => r.id === reply.id)) return p;
        return { ...p, replies: [...p.replies, { ...reply, likedByMe: false }] };
      }));
    });

    socket.on("reply_liked", ({ postId, replyId, likes }: { postId: string; replyId: string; likes: number }) => {
      setPosts(prev => prev.map(p => {
        if (p.id !== postId) return p;
        return { ...p, replies: p.replies.map(r => r.id === replyId ? { ...r, likes } : r) };
      }));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  // ── Action handlers ────────────────────────────────────────────────────────

  const handleLikePost = async (postId: string, alreadyLiked: boolean) => {
    // Optimistic update
    setPosts(prev => prev.map(p =>
      p.id === postId
        ? { ...p, likes: alreadyLiked ? p.likes - 1 : p.likes + 1, likedByMe: !alreadyLiked }
        : p
    ));
    const endpoint = alreadyLiked ? "unlike" : "like";
    try {
      await apiFetch<{ likes: number }>(`${API}/posts/${postId}/${endpoint}`, {
        method: "POST",
        body: JSON.stringify({ likerName: currentAuthor, likerClerkId: currentClerkId }),
      });
    } catch {
      // Roll back on failure
      setPosts(prev => prev.map(p =>
        p.id === postId
          ? { ...p, likes: alreadyLiked ? p.likes + 1 : p.likes - 1, likedByMe: alreadyLiked }
          : p
      ));
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Delete this post? This cannot be undone.")) return;
    // Optimistic remove
    setPosts(prev => prev.filter(p => p.id !== postId));
    try {
      await apiFetch(`${API}/posts/${postId}?clerkId=${encodeURIComponent(currentClerkId)}`, {
        method: "DELETE",
      });
    } catch (e: any) {
      alert("Failed to delete post: " + e.message);
      loadPosts(); // restore
    }
  };

  const handleEditPost = async (id: string, title: string, content: string, tags: string[]) => {
    try {
      const updated = await apiFetch<PostWithLiked>(`${API}/posts/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ clerkId: currentClerkId, title, content, tags }),
      });
      setPosts(prev => prev.map(p => p.id === id ? { ...updated, likedByMe: p.likedByMe, replies: p.replies } : p));
      setEditingPost(null);
    } catch (e: any) {
      alert("Failed to update post: " + e.message);
    }
  };

  const handleLikeReply = async (postId: string, replyId: string, alreadyLiked: boolean) => {
    // Now togglable (server is idempotent so double-like safely does nothing)
    setPosts(prev => prev.map(p =>
      p.id !== postId ? p : {
        ...p,
        replies: p.replies.map(r =>
          r.id === replyId
            ? { ...r, likes: alreadyLiked ? r.likes - 1 : r.likes + 1, likedByMe: !alreadyLiked }
            : r
        ),
      }
    ));
    try {
      await apiFetch<{ likes: number }>(`${API}/replies/${replyId}/like`, {
        method: "POST",
        body: JSON.stringify({ likerName: currentAuthor, likerClerkId: currentClerkId }),
      });
    } catch {
      // Roll back
      setPosts(prev => prev.map(p =>
        p.id !== postId ? p : {
          ...p,
          replies: p.replies.map(r =>
            r.id === replyId
              ? { ...r, likes: alreadyLiked ? r.likes + 1 : r.likes - 1, likedByMe: alreadyLiked }
              : r
          ),
        }
      ));
    }
  };

  const handleAddReply = async (postId: string, content: string) => {
    try {
      const newReply = await apiFetch<Reply>(`${API}/posts/${postId}/replies`, {
        method: "POST",
        body: JSON.stringify({
          author:  currentAuthor,
          avatar:  "🐾",
          content,
          clerkId: currentClerkId,
        }),
      });
      setPosts(prev => prev.map(p =>
        p.id === postId
          ? { ...p, replies: [...p.replies, { ...newReply, likedByMe: false }] }
          : p
      ));
    } catch (e) {
      console.error("Failed to add reply", e);
    }
  };

  const handleNewPost = async (data: CreatePostBody) => {
    try {
      const createdPost = await apiFetch<PostWithLiked>(`${API}/posts`, {
        method: "POST",
        // Always use the real Clerk user name — NewPostModal sends author:"" as placeholder
        body: JSON.stringify({ ...data, author: currentAuthor, avatar: "🐾", clerkId: currentClerkId }),
      });
      setPosts(prev => [{ ...createdPost, likedByMe: false, replies: [] }, ...prev]);
      setShowNewPost(false);
    } catch (e: any) {
      alert("Failed to create post: " + e.message);
    }
  };

  const handleIncrementViews = async (postId: string) => {
    try {
      await apiFetch(`${API}/posts/${postId}/view`, { method: "POST" });
    } catch {}
  };

  // ── Filtering & sorting ───────────────────────────────────────────────────

  const filteredPosts = posts
    .filter(p => {
      const matchCat    = selectedCategory === "all" || p.category === selectedCategory;
      const q           = searchTerm.toLowerCase();
      const matchSearch = !q ||
        p.title.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q) ||
        p.author.toLowerCase().includes(q) ||
        p.tags.some(t => t.includes(q));
      return matchCat && matchSearch;
    })
    .sort((a, b) => {
      if (sortBy === "popular")  return b.likes  - a.likes;
      if (sortBy === "trending") return b.views  - a.views;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const totalReplies = posts.reduce((s, p) => s + p.replies.length, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      {showNewPost && <NewPostModal onClose={() => setShowNewPost(false)} onSubmit={handleNewPost} />}
      {editingPost && (
        <EditPostModal
          post={editingPost}
          onClose={() => setEditingPost(null)}
          onSave={handleEditPost}
        />
      )}

      {/* Hero */}
      <section className="bg-gradient-to-br from-orange-50 via-white to-amber-50 border-b border-gray-100 py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900">Community</h1>
              <span className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border",
                isConnected
                  ? "bg-green-50 text-green-600 border-green-200"
                  : "bg-gray-100 text-gray-500 border-gray-200"
              )}>
                {isConnected
                  ? <><Wifi className="w-3 h-3" /> Live</>
                  : <><WifiOff className="w-3 h-3" /> Offline</>
                }
              </span>
            </div>
            <p className="text-lg text-gray-600 mb-8">
              Connect with pet lovers. Posts, replies, likes and views update in real-time.
            </p>
            <div className="flex flex-wrap items-end gap-6 text-sm">
              <div><span className="text-2xl font-bold text-orange-500">4,821</span><p className="text-gray-500">Members</p></div>
              <div><span className="text-2xl font-bold text-orange-500">{posts.length}</span><p className="text-gray-500">Posts</p></div>
              <div><span className="text-2xl font-bold text-orange-500">{totalReplies}</span><p className="text-gray-500">Replies</p></div>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid lg:grid-cols-4 gap-8 items-start">

          {/* Sidebar */}
          <aside className="lg:col-span-1 space-y-6 sticky top-24">
            <button
              onClick={() => setShowNewPost(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-orange-500 text-white font-bold hover:bg-orange-600 transition-colors shadow-sm shadow-orange-200"
            >
              <Plus className="w-5 h-5" />New Post
            </button>

            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Filter className="w-4 h-4" /> Categories
              </h3>
              <div className="space-y-1">
                {([{ value: "all", label: "All Posts" }, ...Object.entries(CATEGORY_META).map(([v, m]) => ({ value: v, label: m.label }))] as { value: Category; label: string }[]).map(cat => (
                  <button key={cat.value} onClick={() => setSelectedCategory(cat.value)}
                    className={cn("w-full px-3 py-2 rounded-lg text-left text-sm font-semibold transition-all",
                      selectedCategory === cat.value ? "bg-orange-500 text-white" : "text-gray-600 hover:bg-gray-100"
                    )}>{cat.label}</button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Sort By</h3>
              <div className="space-y-1">
                {SORT_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => setSortBy(opt.value)}
                    className={cn("w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all",
                      sortBy === opt.value ? "bg-orange-500 text-white" : "text-gray-600 hover:bg-gray-100"
                    )}>{opt.icon}{opt.label}</button>
                ))}
              </div>
            </div>

            <div className={cn(
              "rounded-2xl p-4 border text-sm",
              isConnected ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
            )}>
              <div className="flex items-center gap-2 font-semibold mb-1">
                {isConnected
                  ? <><Wifi className="w-4 h-4 text-green-500" /><span className="text-green-700">Live updates on</span></>
                  : <><WifiOff className="w-4 h-4 text-gray-400" /><span className="text-gray-600">Connecting…</span></>
                }
              </div>
              <p className={cn("text-xs", isConnected ? "text-green-600" : "text-gray-500")}>
                {isConnected
                  ? "New posts, replies and likes appear instantly."
                  : "Attempting to establish real-time connection."}
              </p>
            </div>
          </aside>

          {/* Feed */}
          <main className="lg:col-span-3 space-y-5">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search posts, tags, or authors..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-10 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent shadow-sm"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {(searchTerm || selectedCategory !== "all") && !loading && (
              <p className="text-sm text-gray-500">
                Showing <span className="font-semibold text-gray-700">{filteredPosts.length}</span>{" "}
                {filteredPosts.length === 1 ? "post" : "posts"}
                {selectedCategory !== "all" && ` in ${CATEGORY_META[selectedCategory as PostCategory].label}`}
                {searchTerm && ` matching "${searchTerm}"`}
              </p>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin mb-3" />
                <p className="text-sm">Loading community posts…</p>
              </div>
            )}

            {error && !loading && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-red-700 mb-1">Could not load posts</p>
                  <p className="text-sm text-red-600 mb-3">{error}</p>
                  <button onClick={loadPosts} className="flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700">
                    <RefreshCw className="w-4 h-4" />Try again
                  </button>
                </div>
              </div>
            )}

            {!loading && !error && filteredPosts.length === 0 && (
              <div className="bg-white rounded-2xl p-14 text-center border border-gray-100">
                <div className="text-5xl mb-4">💬</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No posts found</h3>
                <p className="text-gray-500 text-sm mb-6">
                  {searchTerm ? `No results for "${searchTerm}".` : "Be the first to post!"}
                </p>
                <button onClick={() => setShowNewPost(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />Create Post
                </button>
              </div>
            )}

            {!loading && !error && filteredPosts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={currentClerkId}
                currentUserName={currentAuthor}
                onLikePost={handleLikePost}
                onLikeReply={handleLikeReply}
                onAddReply={handleAddReply}
                onExpand={handleIncrementViews}
                onDeletePost={handleDeletePost}
                onEditPost={setEditingPost}
              />
            ))}
          </main>
        </div>
      </div>
    </div>
  );
}
