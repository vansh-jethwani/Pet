import { useState } from "react";
import Header from "@/components/Header";
import {
  MessageCircle,
  Heart,
  Share2,
  Search,
  Plus,
  MessageSquare,
  Eye,
  TrendingUp,
  User,
  Calendar,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Post {
  id: number;
  author: string;
  avatar: string;
  title: string;
  category: "tips" | "stories" | "questions" | "events";
  content: string;
  replies: number;
  likes: number;
  views: number;
  date: string;
  tags: string[];
}

const communityPosts: Post[] = [
  {
    id: 1,
    author: "Sarah Johnson",
    avatar: "👩",
    title: "Best Training Tips for Golden Retrievers",
    category: "tips",
    content:
      "Just completed a training course with my Golden Retriever and learned some amazing techniques! Here are my top 5 tips for training Golden Retrievers...",
    replies: 23,
    likes: 87,
    views: 456,
    date: "2 hours ago",
    tags: ["Dogs", "Training", "Golden Retrievers"],
  },
  {
    id: 2,
    author: "Mike Chen",
    avatar: "👨",
    title: "My cat finally warmed up to me after 6 months!",
    category: "stories",
    content:
      "I adopted a rescue cat 6 months ago and she was very shy. Today she sat on my lap for the first time! The journey has been incredible...",
    replies: 45,
    likes: 156,
    views: 789,
    date: "4 hours ago",
    tags: ["Cats", "Adoption", "Love Stories"],
  },
  {
    id: 3,
    author: "Emily Davis",
    avatar: "👩",
    title: "Help! My dog won't stop barking at night",
    category: "questions",
    content:
      "My 3-year-old labrador has suddenly started barking a lot at night. I've tried everything but nothing seems to help. Does anyone have experience with this?",
    replies: 18,
    likes: 34,
    views: 234,
    date: "5 hours ago",
    tags: ["Dogs", "Behavior", "Help Needed"],
  },
  {
    id: 4,
    author: "Alex Martinez",
    avatar: "👨",
    title: "Pet Expo Coming to San Francisco - July 15th",
    category: "events",
    content:
      "Great news everyone! The annual Pet Expo is coming to San Francisco on July 15th. There will be amazing vendors, contests, and activities for your pets!",
    replies: 12,
    likes: 56,
    views: 345,
    date: "1 day ago",
    tags: ["Events", "San Francisco", "Family Activity"],
  },
  {
    id: 5,
    author: "Lisa Wong",
    avatar: "👩",
    title: "Healthy homemade dog treats recipe",
    category: "tips",
    content:
      "I've been making homemade dog treats for my pups and they LOVE them! Here's my favorite recipe with all healthy, natural ingredients...",
    replies: 34,
    likes: 123,
    views: 567,
    date: "1 day ago",
    tags: ["Recipes", "Dogs", "Health"],
  },
];

const categoryLabels = {
  tips: "Tips & Advice",
  stories: "Success Stories",
  questions: "Questions",
  events: "Events",
};

const categoryColors = {
  tips: "from-blue-100 to-blue-50 text-blue-700",
  stories: "from-pink-100 to-pink-50 text-pink-700",
  questions: "from-yellow-100 to-yellow-50 text-yellow-700",
  events: "from-green-100 to-green-50 text-green-700",
};

export default function Community() {
  const [selectedCategory, setSelectedCategory] = useState<
    "all" | "tips" | "stories" | "questions" | "events"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "popular" | "trending">(
    "recent"
  );
  const [likedPosts, setLikedPosts] = useState<number[]>([]);
  const [showNewPost, setShowNewPost] = useState(false);

  const filteredPosts = communityPosts
    .filter((post) => {
      const matchesCategory = selectedCategory === "all" || post.category === selectedCategory;
      const matchesSearch =
        !searchTerm ||
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.tags.some((tag) =>
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        );
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === "recent") return new Date(b.date) > new Date(a.date) ? 1 : -1;
      if (sortBy === "popular") return b.likes - a.likes;
      return b.views - a.views;
    });

  const handleLike = (id: number) => {
    if (likedPosts.includes(id)) {
      setLikedPosts(likedPosts.filter((p) => p !== id));
    } else {
      setLikedPosts([...likedPosts, id]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-orange-50 via-white to-red-50 py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Pet Community
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl">
            Connect with other pet lovers, share stories, ask for advice, and
            build friendships in our community.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* New Post Button & Search */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex-1 w-full sm:max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search discussions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>

          <button
            onClick={() => setShowNewPost(!showNewPost)}
            className="px-6 py-2 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Post
          </button>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* New Post Form */}
            {showNewPost && (
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Create New Post
                </h3>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Post title..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  <textarea
                    placeholder="What's on your mind?"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                    <option>Select Category</option>
                    <option value="tips">Tips & Advice</option>
                    <option value="stories">Success Stories</option>
                    <option value="questions">Questions</option>
                    <option value="events">Events</option>
                  </select>
                  <div className="flex gap-2">
                    <button className="flex-1 px-4 py-2 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors">
                      Post
                    </button>
                    <button
                      onClick={() => setShowNewPost(false)}
                      className="flex-1 px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Categories */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm sticky top-24">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Categories
              </h3>

              <div className="space-y-2">
                {[
                  { value: "all", label: "All Posts" },
                  { value: "tips", label: "Tips & Advice" },
                  { value: "stories", label: "Success Stories" },
                  { value: "questions", label: "Questions" },
                  { value: "events", label: "Events" },
                ].map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() =>
                      setSelectedCategory(
                        cat.value as
                          | "all"
                          | "tips"
                          | "stories"
                          | "questions"
                          | "events"
                      )
                    }
                    className={cn(
                      "w-full px-4 py-2 rounded-lg text-left font-semibold transition-all",
                      selectedCategory === cat.value
                        ? "bg-orange-500 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Options */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Sort By</h3>
              <div className="space-y-2">
                {[
                  { value: "recent", label: "Most Recent" },
                  { value: "popular", label: "Most Liked" },
                  { value: "trending", label: "Most Viewed" },
                ].map((sort) => (
                  <button
                    key={sort.value}
                    onClick={() =>
                      setSortBy(
                        sort.value as "recent" | "popular" | "trending"
                      )
                    }
                    className={cn(
                      "w-full px-4 py-2 rounded-lg text-left font-semibold transition-all",
                      sortBy === sort.value
                        ? "bg-orange-500 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    )}
                  >
                    {sort.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {filteredPosts.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
                <div className="text-5xl mb-4">💬</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  No Posts Found
                </h3>
                <p className="text-gray-600 mb-4">
                  Be the first to start a discussion!
                </p>
                <button
                  onClick={() => setShowNewPost(true)}
                  className="inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Create Post
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredPosts.map((post) => (
                  <div
                    key={post.id}
                    className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow border border-gray-100"
                  >
                    {/* Post Header */}
                    <div className="p-6 border-b border-gray-100">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="text-3xl">{post.avatar}</div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="text-lg font-bold text-gray-900">
                                {post.author}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {post.date}
                              </p>
                            </div>
                            <span
                              className={cn(
                                "px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap",
                                categoryColors[post.category]
                              )}
                            >
                              {categoryLabels[post.category]}
                            </span>
                          </div>
                        </div>
                      </div>

                      <h2 className="text-2xl font-bold text-gray-900 mb-3">
                        {post.title}
                      </h2>

                      <p className="text-gray-600 mb-4 leading-relaxed">
                        {post.content}
                      </p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2">
                        {post.tags.map((tag) => (
                          <span
                            key={tag}
                            className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-semibold hover:bg-gray-200 cursor-pointer transition-colors"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Post Footer */}
                    <div className="px-6 py-4 bg-gray-50 flex items-center justify-between">
                      <div className="flex items-center gap-6 text-sm text-gray-600 flex-wrap">
                        <button className="flex items-center gap-2 hover:text-orange-500 transition-colors">
                          <MessageSquare className="w-4 h-4" />
                          {post.replies} Replies
                        </button>
                        <span className="flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          {post.views} Views
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleLike(post.id)}
                          className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
                            likedPosts.includes(post.id)
                              ? "bg-red-100 text-red-600"
                              : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                          )}
                        >
                          <Heart
                            className="w-4 h-4 fill-current"
                          />
                          {likedPosts.includes(post.id)
                            ? post.likes + 1
                            : post.likes}
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-100 text-orange-600 hover:bg-orange-200 transition-colors">
                          <Share2 className="w-4 h-4" />
                          Reply
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
