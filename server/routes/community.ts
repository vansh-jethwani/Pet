import { RequestHandler, Router } from "express";
import { Post } from "../models/Post.js";
import { notifyCommunityLike, notifyCommunityReply } from "../models/Notification.js";
import type { CreatePostBody, CreateReplyBody } from "@shared/api";

const router = Router();

// Lazy io access — imported function is always live, avoids circular binding issues.
// getIO() is defined in index.ts and returns the io instance after attachSocketServer runs.
let _getIO: (() => import("socket.io").Server | undefined) | null = null;
export function setGetIO(fn: () => import("socket.io").Server | undefined) {
  _getIO = fn;
}
function emit(event: string, data: any) {
  try { _getIO?.()?.emit(event, data); } catch {}
}

function formatPost(doc: any) {
  return {
    id:        doc._id.toString(),
    author:    doc.author,
    avatar:    doc.avatar,
    clerkId:   doc.clerkId ?? "",
    category:  doc.category,
    title:     doc.title,
    content:   doc.content,
    tags:      doc.tags ?? [],
    likes:     doc.likes,
    views:     doc.views,
    createdAt: doc.createdAt,
    replies:   (doc.replies ?? []).map((r: any) => ({
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

router.get("/posts", (async (_req, res) => {
  const posts = await Post.find().sort({ createdAt: -1 });
  res.json(posts.map(formatPost));
}) as RequestHandler);

router.post("/posts", (async (req, res) => {
  const { author, avatar, category, title, content, tags, clerkId } =
    req.body as CreatePostBody & { clerkId?: string };

  if (!title?.trim() || !content?.trim() || !category || !author?.trim()) {
    return res.status(400).json({ error: "author, category, title and content are required" });
  }

  const post = await Post.create({
    author:  author.trim(),
    avatar:  avatar || "🐾",
    clerkId: clerkId || "",
    category,
    title:   title.trim(),
    content: content.trim(),
    tags:    Array.isArray(tags) ? tags : [],
  });

  const formatted = formatPost(post);
  emit("new_post", formatted);
  res.status(201).json(formatted);
}) as RequestHandler);

router.post("/posts/:id/like", (async (req, res) => {
  const { likerName } = req.body as { likerName?: string };
  const post = await Post.findByIdAndUpdate(req.params.id, { $inc: { likes: 1 } }, { new: true });
  if (!post) return res.status(404).json({ error: "Post not found" });

  emit("post_liked", { id: req.params.id, likes: post.likes });

  if (post.clerkId && likerName && likerName !== post.author) {
    notifyCommunityLike(post.clerkId, likerName, post.title).catch(console.error);
  }
  res.json({ likes: post.likes });
}) as RequestHandler);

router.post("/posts/:id/unlike", (async (req, res) => {
  const post = await Post.findByIdAndUpdate(req.params.id, { $inc: { likes: -1 } }, { new: true });
  if (!post) return res.status(404).json({ error: "Post not found" });
  const likes = Math.max(0, post.likes);
  emit("post_liked", { id: req.params.id, likes });
  res.json({ likes });
}) as RequestHandler);

router.post("/posts/:id/view", (async (req, res) => {
  const post = await Post.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }, { new: true });
  if (post) emit("post_viewed", { id: req.params.id, views: post.views });
  res.json({ ok: true });
}) as RequestHandler);

router.post("/posts/:id/replies", (async (req, res) => {
  const { author, avatar, content, clerkId } = req.body as CreateReplyBody & { clerkId?: string };
  if (!content?.trim() || !author?.trim()) {
    return res.status(400).json({ error: "author and content are required" });
  }

  const post = await Post.findByIdAndUpdate(
    req.params.id,
    { $push: { replies: { author: author.trim(), avatar: avatar || "🐾", content: content.trim() } } },
    { new: true }
  );
  if (!post) return res.status(404).json({ error: "Post not found" });

  const newReply = post.replies[post.replies.length - 1];
  const replyPayload = {
    id: newReply._id.toString(), postId: post._id.toString(),
    author: newReply.author, avatar: newReply.avatar,
    content: newReply.content, likes: newReply.likes, createdAt: newReply.createdAt,
  };

  emit("new_reply", { postId: req.params.id, reply: replyPayload });

  if (post.clerkId && post.clerkId !== clerkId) {
    notifyCommunityReply(post.clerkId, author.trim(), post.title, post._id.toString()).catch(console.error);
  }
  res.status(201).json(replyPayload);
}) as RequestHandler);

router.post("/replies/:replyId/like", (async (req, res) => {
  const post = await Post.findOneAndUpdate(
    { "replies._id": req.params.replyId },
    { $inc: { "replies.$.likes": 1 } },
    { new: true }
  );
  if (!post) return res.status(404).json({ error: "Reply not found" });
  const reply = post.replies.find((r) => r._id.toString() === req.params.replyId);
  emit("reply_liked", { postId: post._id.toString(), replyId: req.params.replyId, likes: reply?.likes ?? 0 });
  res.json({ likes: reply?.likes ?? 0 });
}) as RequestHandler);

export default router;
