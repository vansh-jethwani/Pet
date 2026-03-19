import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/clerk-react";
import Header from "@/components/Header";
import { cn } from "@/lib/utils";
import type { Post, Reply, PostCategory, CreatePostBody } from "@shared/api";
import {
  Heart, MessageSquare, Eye, Plus, Search, Filter, X,
  Send, ChevronDown, ChevronUp, Flame, Clock, TrendingUp,
  Tag, Loader2, AlertCircle, RefreshCw,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Category = "all" | PostCategory;
type SortBy = "recent" | "popular" | "trending";

interface PostWithLiked extends Post {
  likedByMe: boolean;
  replies: ReplyWithLiked[];
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

// ─── ReplyItem ────────────────────────────────────────────────────────────────

function ReplyItem({ reply, onLike }: { reply: ReplyWithLiked; onLike: (id: string) => void }) {
  return (
    <div className="flex gap-3 py-3">
      <div className="text-2xl flex-shrink-0">{reply.avatar}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-gray-900 text-sm">{reply.author}</span>
          <span className="text-xs text-gray-400">
            {new Date(reply.createdAt).toLocaleString("en-IN", {
              day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
            })}
          </span>
        </div>
        <p className="text-gray-700 text-sm leading-relaxed">{reply.content}</p>
        <button
          onClick={() => onLike(reply.id)}
          className={cn(
            "mt-2 flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full transition-colors",
            reply.likedByMe ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
          )}
        >
          <Heart className="w-3 h-3 fill-current" />{reply.likes}
        </button>
      </div>
    </div>
  );
}

// ─── PostCard ─────────────────────────────────────────────────────────────────

function PostCard({
  post, onLikePost, onLikeReply, onAddReply, onExpand,
}: {
  post: PostWithLiked;
  onLikePost: (id: string, liked: boolean) => void;
  onLikeReply: (postId: string, replyId: string, liked: boolean) => void;
  onAddReply: (postId: string, content: string) => Promise<void>;
  onExpand: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const meta = CATEGORY_META[post.category];

  const handleToggleExpand = () => {
    if (!expanded) onExpand(post.id);
    setExpanded((e) => !e);
    setShowReplyInput(false);
  };

  const handleSubmitReply = async () => {
    const trimmed = replyText.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    await onAddReply(post.id, trimmed);
    setReplyText("");
    setShowReplyInput(false);
    setExpanded(true);
    setSubmitting(false);
  };

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100">
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
              <span className={cn("text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap", meta.bg, meta.color)}>
                {meta.label}
              </span>
            </div>
          </div>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2 leading-snug">{post.title}</h2>
        <p className="text-gray-600 leading-relaxed text-sm">{post.content}</p>
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {post.tags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full text-xs font-medium">
                <Tag className="w-3 h-3" />{tag}
              </span>
            ))}
          </div>
        )}
      </div>

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
            onClick={() => { setShowReplyInput((s) => !s); if (!showReplyInput) setExpanded(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-orange-100 text-orange-600 hover:bg-orange-200 transition-colors"
          >
            <MessageSquare className="w-4 h-4" />Reply
          </button>
        </div>
      </div>

      {(expanded || showReplyInput) && (
        <div className="px-6 pb-4 border-t border-gray-100">
          {showReplyInput && (
            <div className="flex gap-3 pt-4 pb-2">
              <div className="text-2xl">🐾</div>
              <div className="flex-1">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a reply..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none"
                  onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmitReply(); }}
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button onClick={() => { setShowReplyInput(false); setReplyText(""); }} className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 font-medium">
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitReply}
                    disabled={!replyText.trim() || submitting}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Post Reply
                  </button>
                </div>
              </div>
            </div>
          )}
          {expanded && post.replies.length > 0 && (
            <div className="divide-y divide-gray-100 mt-1">
              {post.replies.map((reply) => (
                <ReplyItem key={reply.id} reply={reply} onLike={(rid) => onLikeReply(post.id, rid, reply.likedByMe)} />
              ))}
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

function NewPostModal({ onClose, onSubmit }: {
  onClose: () => void;
  onSubmit: (data: CreatePostBody) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<PostCategory>("tips");
  const [tagsInput, setTagsInput] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = "Title is required";
    if (!content.trim()) e.content = "Content is required";
    setErrors(e);
    if (Object.keys(e).length > 0 || submitting) return;

    setSubmitting(true);
    try {
      const tags = tagsInput.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
      await onSubmit({ author: "You", avatar: "🐾", category, title: title.trim(), content: content.trim(), tags });
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
              onChange={(e) => { setTitle(e.target.value); if (errors.title) setErrors((p) => ({ ...p, title: "" })); }}
              placeholder="Give your post a clear, descriptive title..."
              className={cn("w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent",
                errors.title ? "border-red-400 bg-red-50" : "border-gray-200")}
            />
            {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Content</label>
            <textarea value={content} rows={5}
              onChange={(e) => { setContent(e.target.value); if (errors.content) setErrors((p) => ({ ...p, content: "" })); }}
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
            <input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)}
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
  const currentAuthor = user?.firstName || user?.fullName || "You";

  const [posts, setPosts] = useState<PostWithLiked[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category>("all");
  const [sortBy, setSortBy] = useState<SortBy>("recent");
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewPost, setShowNewPost] = useState(false);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Post[]>(`${API}/posts`);
      setPosts(data.map((p) => ({
        ...p,
        likedByMe: false,
        replies: p.replies.map((r) => ({ ...r, likedByMe: false })),
      })));
    } catch (e: any) {
      setError(e.message || "Failed to load posts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  const handleLikePost = async (postId: string, alreadyLiked: boolean) => {
    const endpoint = alreadyLiked ? "unlike" : "like";
    try {
      const { likes } = await apiFetch<{ likes: number }>(`${API}/posts/${postId}/${endpoint}`, { method: "POST" });
      setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, likes, likedByMe: !alreadyLiked } : p));
    } catch {}
  };

  const handleLikeReply = async (postId: string, replyId: string, alreadyLiked: boolean) => {
    if (alreadyLiked) return;
    try {
      const { likes } = await apiFetch<{ likes: number }>(`${API}/replies/${replyId}/like`, { method: "POST" });
      setPosts((prev) => prev.map((p) =>
        p.id === postId
          ? { ...p, replies: p.replies.map((r) => r.id === replyId ? { ...r, likes, likedByMe: true } : r) }
          : p
      ));
    } catch {}
  };

  const handleAddReply = async (postId: string, content: string) => {
    try {
      const newReply = await apiFetch<Reply>(`${API}/posts/${postId}/replies`, {
        method: "POST",
        body: JSON.stringify({ author: currentAuthor, avatar: "🐾", content }),
      });
      setPosts((prev) => prev.map((p) =>
        p.id === postId ? { ...p, replies: [...p.replies, { ...newReply, likedByMe: false }] } : p
      ));
    } catch {}
  };

  const handleNewPost = async (data: CreatePostBody) => {
    try {
      const newPost = await apiFetch<Post>(`${API}/posts`, {
        method: "POST",
        body: JSON.stringify({ ...data, author: currentAuthor }),
      });
      setPosts((prev) => [{ ...newPost, likedByMe: false, replies: [] }, ...prev]);
      setShowNewPost(false);
    } catch (e: any) {
      alert("Failed to create post: " + e.message);
    }
  };

  const handleIncrementViews = async (postId: string) => {
    try {
      await apiFetch(`${API}/posts/${postId}/view`, { method: "POST" });
      setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, views: p.views + 1 } : p));
    } catch {}
  };

  const filteredPosts = posts
    .filter((p) => {
      const matchCat = selectedCategory === "all" || p.category === selectedCategory;
      const q = searchTerm.toLowerCase();
      const matchSearch = !q ||
        p.title.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q) ||
        p.author.toLowerCase().includes(q) ||
        p.tags.some((t) => t.includes(q));
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

      {/* Hero */}
      <section className="bg-gradient-to-br from-orange-50 via-white to-amber-50 border-b border-gray-100 py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-3">Community</h1>
            <p className="text-lg text-gray-600 mb-8">
              Connect with pet lovers across India. Share tips, celebrate stories, ask questions, and discover local events.
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
                {([{ value: "all", label: "All Posts" }, ...Object.entries(CATEGORY_META).map(([v, m]) => ({ value: v, label: m.label }))] as { value: Category; label: string }[]).map((cat) => (
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
                {SORT_OPTIONS.map((opt) => (
                  <button key={opt.value} onClick={() => setSortBy(opt.value)}
                    className={cn("w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all",
                      sortBy === opt.value ? "bg-orange-500 text-white" : "text-gray-600 hover:bg-gray-100"
                    )}>{opt.icon}{opt.label}</button>
                ))}
              </div>
            </div>
          </aside>

          {/* Feed */}
          <main className="lg:col-span-3 space-y-5">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input type="text" placeholder="Search posts, tags, or authors..." value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
                  {searchTerm ? `No results for "${searchTerm}". Try a different search.` : "Be the first to post in this category!"}
                </p>
                <button onClick={() => setShowNewPost(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />Create Post
                </button>
              </div>
            )}

            {!loading && !error && filteredPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onLikePost={handleLikePost}
                onLikeReply={handleLikeReply}
                onAddReply={handleAddReply}
                onExpand={handleIncrementViews}
              />
            ))}
          </main>
        </div>
      </div>
    </div>
  );
}
