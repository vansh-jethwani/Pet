/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

// ─── Community Types ──────────────────────────────────────────────────────────

export type PostCategory = "tips" | "stories" | "questions" | "events";

export interface Reply {
  id: string;
  postId: string;
  author: string;
  avatar: string;
  content: string;
  createdAt: string;
  likes: number;
}

export interface Post {
  id: string;
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
