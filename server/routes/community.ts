import { RequestHandler, Router } from "express";
import { Post } from "../models/Post.js";
import { io } from "../index.js";
import type { CreatePostBody, CreateReplyBody } from "@shared/api";

const router = Router();

// ─── Helper: format a Mongoose doc to match our API shape ────────────────────

function formatPost(doc: any) {
  return {
    id:        doc._id.toString(),
    author:    doc.author,
    avatar:    doc.avatar,
    category:  doc.category,
    title:     doc.title,
    content:   doc.content,
    tags:      doc.tags ?? [],
    likes:     doc.likes,
    views:     doc.views,
    createdAt: doc.createdAt,
    replies: (doc.replies ?? []).map((r: any) => ({
      id:        r._id.toString(),
      postId:    doc._id.toString(),
      author:    r.author,
      avatar:    r.avatar,
      content:   r.content,
      likes:     r.likes,
      createdAt: r.createdAt,
    })),
  };
}

// ─── GET /api/community/posts ─────────────────────────────────────────────────

router.get("/posts", (async (_req, res) => {
  const posts = await Post.find().sort({ createdAt: -1 });
  res.json(posts.map(formatPost));
}) as RequestHandler);

// ─── POST /api/community/posts ────────────────────────────────────────────────

router.post("/posts", (async (req, res) => {
  const { author, avatar, category, title, content, tags } =
    req.body as CreatePostBody;

  if (!title?.trim() || !content?.trim() || !category || !author?.trim()) {
    return res
      .status(400)
      .json({ error: "author, category, title and content are required" });
  }

  const post = await Post.create({
    author:  author.trim(),
    avatar:  avatar || "🐾",
    category,
    title:   title.trim(),
    content: content.trim(),
    tags:    Array.isArray(tags) ? tags : [],
  });

  const formatted = formatPost(post);

  // 🔴 Real-time: broadcast new post to ALL connected clients
  io.emit("new_post", formatted);

  res.status(201).json(formatted);
}) as RequestHandler);

// ─── POST /api/community/posts/:id/like ──────────────────────────────────────

router.post("/posts/:id/like", (async (req, res) => {
  const post = await Post.findByIdAndUpdate(
    req.params.id,
    { $inc: { likes: 1 } },
    { new: true }
  );
  if (!post) return res.status(404).json({ error: "Post not found" });

  // 🔴 Real-time: broadcast updated like count to ALL clients
  io.emit("post_liked", { id: req.params.id, likes: post.likes });

  res.json({ likes: post.likes });
}) as RequestHandler);

// ─── POST /api/community/posts/:id/unlike ────────────────────────────────────

router.post("/posts/:id/unlike", (async (req, res) => {
  const post = await Post.findByIdAndUpdate(
    req.params.id,
    { $inc: { likes: -1 } },
    { new: true }
  );
  if (!post) return res.status(404).json({ error: "Post not found" });

  const likes = Math.max(0, post.likes);

  // 🔴 Real-time: broadcast updated like count to ALL clients
  io.emit("post_liked", { id: req.params.id, likes });

  res.json({ likes });
}) as RequestHandler);

// ─── POST /api/community/posts/:id/view ──────────────────────────────────────

router.post("/posts/:id/view", (async (req, res) => {
  const post = await Post.findByIdAndUpdate(
    req.params.id,
    { $inc: { views: 1 } },
    { new: true }
  );

  if (post) {
    // 🔴 Real-time: broadcast updated view count to ALL clients
    io.emit("post_viewed", { id: req.params.id, views: post.views });
  }

  res.json({ ok: true });
}) as RequestHandler);

// ─── POST /api/community/posts/:id/replies ───────────────────────────────────

router.post("/posts/:id/replies", (async (req, res) => {
  const { author, avatar, content } = req.body as CreateReplyBody;

  if (!content?.trim() || !author?.trim()) {
    return res.status(400).json({ error: "author and content are required" });
  }

  const post = await Post.findByIdAndUpdate(
    req.params.id,
    {
      $push: {
        replies: {
          author:  author.trim(),
          avatar:  avatar || "🐾",
          content: content.trim(),
        },
      },
    },
    { new: true }
  );

  if (!post) return res.status(404).json({ error: "Post not found" });

  const newReply = post.replies[post.replies.length - 1];
  const replyPayload = {
    id:        newReply._id.toString(),
    postId:    post._id.toString(),
    author:    newReply.author,
    avatar:    newReply.avatar,
    content:   newReply.content,
    likes:     newReply.likes,
    createdAt: newReply.createdAt,
  };

  // 🔴 Real-time: broadcast new reply to ALL clients
  io.emit("new_reply", { postId: req.params.id, reply: replyPayload });

  res.status(201).json(replyPayload);
}) as RequestHandler);

// ─── POST /api/community/replies/:replyId/like ───────────────────────────────

router.post("/replies/:replyId/like", (async (req, res) => {
  const post = await Post.findOneAndUpdate(
    { "replies._id": req.params.replyId },
    { $inc: { "replies.$.likes": 1 } },
    { new: true }
  );
  if (!post) return res.status(404).json({ error: "Reply not found" });

  const reply = post.replies.find(
    (r) => r._id.toString() === req.params.replyId
  );

  // 🔴 Real-time: broadcast updated reply like count to ALL clients
  io.emit("reply_liked", {
    postId:  post._id.toString(),
    replyId: req.params.replyId,
    likes:   reply?.likes ?? 0,
  });

  res.json({ likes: reply?.likes ?? 0 });
}) as RequestHandler);

export default router;
