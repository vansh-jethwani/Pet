/**
 * Shared types between client and server
 */

export interface DemoResponse {
  message: string;
}

// ─── Community Types ──────────────────────────────────────────────────────────

export type PostCategory = "tips" | "stories" | "questions" | "events";

export interface Reply {
  id: string;         // MongoDB ObjectId as string
  postId: string;
  author: string;
  avatar: string;
  content: string;
  createdAt: string;
  likes: number;
}

export interface Post {
  id: string;         // MongoDB ObjectId as string
  author: string;
  avatar: string;
  category: PostCategory;
  title: string;
  content: string;
  tags: string[];
  likes: number;
  views: number;
  createdAt: string;
  replies: Reply[];
}

// Request bodies
export interface CreatePostBody {
  author: string;
  avatar: string;
  category: PostCategory;
  title: string;
  content: string;
  tags: string[];
}

export interface CreateReplyBody {
  author: string;
  avatar: string;
  content: string;
}
