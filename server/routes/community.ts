import { RequestHandler, Router } from "express";
import { Post } from "../models/Post.js";
import {
  notifyCommunityLike,
  notifyCommunityReply,
  notifyCommunityReplyToReply,
  notifyCommunityReplyLike,
  getNotificationIO,
} from "../models/Notification.js";
import type { CreatePostBody, CreateReplyBody } from "@shared/api";

const router = Router();

function emit(event: string, data: any) {
  try {
    getNotificationIO()?.emit(event, data);
  } catch (err) {
    console.error("[community] emit error:", err);
  }
}

/** Format a post for the API response. Pass viewerClerkId to compute likedByMe. */
function formatPost(doc: any, viewerClerkId = "") {
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
    likedByMe: viewerClerkId ? (doc.likedBy ?? []).includes(viewerClerkId) : false,
    views:     doc.views,
    createdAt: doc.createdAt instanceof Date
      ? doc.createdAt.toISOString()
      : doc.createdAt,
    replies: (doc.replies ?? []).map((r: any) => ({
      id:        r._id.toString(),
      postId:    doc._id.toString(),
      author:    r.author,
      avatar:    r.avatar,
      clerkId:   r.clerkId ?? "",
      content:   r.content,
      likes:     r.likes,
      likedByMe: viewerClerkId ? (r.likedBy ?? []).includes(viewerClerkId) : false,
      createdAt: r.createdAt instanceof Date
        ? r.createdAt.toISOString()
        : r.createdAt,
    })),
  };
}

// ─── Helper: extract @mention from the start of reply content ────────────────
function extractMention(content: string): string | null {
  const match = content.match(/^@(\S+)\s/);
  return match ? match[1] : null;
}

// ─── Helper: short snippet for notifications (max 40 chars) ──────────────────
function snippet(text: string, max = 40): string {
  const clean = text.replace(/^@\S+\s/, "").trim();
  return clean.length > max ? clean.slice(0, max) + "…" : clean;
}

// GET /api/community/posts?clerkId=xxx
// clerkId query param is used to compute likedByMe for the authenticated user
router.get("/posts", (async (req, res) => {
  try {
    const viewerClerkId = (req.query.clerkId as string) || "";
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts.map(p => formatPost(p, viewerClerkId)));
  } catch (err) {
    console.error("[community] GET /posts error:", err);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
}) as RequestHandler);

// POST /api/community/posts
router.post("/posts", (async (req, res) => {
  try {
    const { author, avatar, category, title, content, tags, clerkId } =
      req.body as CreatePostBody & { clerkId?: string };

    if (!title?.trim() || !content?.trim() || !category || !author?.trim()) {
      return res.status(400).json({ error: "author, category, title and content are required" });
    }

    const post = await Post.create({
      author:  author.trim(),
      avatar:  avatar  || "🐾",
      clerkId: clerkId || "",
      category,
      title:   title.trim(),
      content: content.trim(),
      tags:    Array.isArray(tags) ? tags : [],
    });

    const formatted = formatPost(post, clerkId || "");
    emit("new_post", formatted);
    res.status(201).json(formatted);
  } catch (err) {
    console.error("[community] POST /posts error:", err);
    res.status(500).json({ error: "Failed to create post" });
  }
}) as RequestHandler);

// PATCH /api/community/posts/:id — edit own post (title, content, tags)
router.patch("/posts/:id", (async (req, res) => {
  try {
    const { clerkId, title, content, tags } = req.body as {
      clerkId?: string; title?: string; content?: string; tags?: string[];
    };
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    if (!clerkId || post.clerkId !== clerkId)
      return res.status(403).json({ error: "Not authorized to edit this post" });

    if (title?.trim())   post.title   = title.trim();
    if (content?.trim()) post.content = content.trim();
    if (Array.isArray(tags)) post.tags = tags;
    await post.save();

    const formatted = formatPost(post, clerkId);
    emit("post_updated", formatted);
    res.json(formatted);
  } catch (err) {
    console.error("[community] PATCH /posts/:id error:", err);
    res.status(500).json({ error: "Failed to update post" });
  }
}) as RequestHandler);

// DELETE /api/community/posts/:id — delete own post
router.delete("/posts/:id", (async (req, res) => {
  try {
    const clerkId = (req.query.clerkId as string) || (req.body?.clerkId as string) || "";
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    if (!clerkId || post.clerkId !== clerkId)
      return res.status(403).json({ error: "Not authorized to delete this post" });

    await post.deleteOne();
    emit("post_deleted", { id: req.params.id });
    res.json({ deleted: true });
  } catch (err) {
    console.error("[community] DELETE /posts/:id error:", err);
    res.status(500).json({ error: "Failed to delete post" });
  }
}) as RequestHandler);

// POST /api/community/posts/:id/like  — idempotent, tracks liker in likedBy[]
router.post("/posts/:id/like", (async (req, res) => {
  try {
    const { likerName, likerClerkId } = req.body as {
      likerName?: string;
      likerClerkId?: string;
    };

    // Only like if not already liked
    const post = await Post.findOneAndUpdate(
      { _id: req.params.id, likedBy: { $ne: likerClerkId } },
      { $inc: { likes: 1 }, $addToSet: { likedBy: likerClerkId } },
      { new: true }
    );

    // If post is null here the user already liked it — fetch current data
    const current = post ?? await Post.findById(req.params.id);
    if (!current) return res.status(404).json({ error: "Post not found" });

    emit("post_liked", { id: req.params.id, likes: current.likes });

    if (post && current.clerkId?.trim() && likerName && likerClerkId !== current.clerkId) {
      notifyCommunityLike(current.clerkId, likerName, current.title, current._id.toString()).catch(console.error);
    }

    res.json({ likes: current.likes });
  } catch (err) {
    console.error("[community] POST /posts/:id/like error:", err);
    res.status(500).json({ error: "Failed to like post" });
  }
}) as RequestHandler);

// POST /api/community/posts/:id/unlike — idempotent
router.post("/posts/:id/unlike", (async (req, res) => {
  try {
    const { likerClerkId } = req.body as { likerClerkId?: string };

    const post = await Post.findOneAndUpdate(
      { _id: req.params.id, likedBy: likerClerkId },
      { $inc: { likes: -1 }, $pull: { likedBy: likerClerkId } },
      { new: true }
    );

    const current = post ?? await Post.findById(req.params.id);
    if (!current) return res.status(404).json({ error: "Post not found" });

    const likes = Math.max(0, current.likes);
    emit("post_liked", { id: req.params.id, likes });
    res.json({ likes });
  } catch (err) {
    console.error("[community] POST /posts/:id/unlike error:", err);
    res.status(500).json({ error: "Failed to unlike post" });
  }
}) as RequestHandler);

// POST /api/community/posts/:id/view
router.post("/posts/:id/view", (async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );
    if (post) emit("post_viewed", { id: req.params.id, views: post.views });
    res.json({ ok: true });
  } catch (err) {
    console.error("[community] POST /posts/:id/view error:", err);
    res.status(500).json({ error: "Failed to increment views" });
  }
}) as RequestHandler);

// POST /api/community/posts/:id/replies
router.post("/posts/:id/replies", (async (req, res) => {
  try {
    const { author, avatar, content, clerkId } = req.body as CreateReplyBody & {
      clerkId?: string;
    };
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
            clerkId: clerkId || "",
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
      clerkId:   newReply.clerkId ?? "",
      content:   newReply.content,
      likes:     newReply.likes,
      likedByMe: false,
      createdAt: newReply.createdAt instanceof Date
        ? newReply.createdAt.toISOString()
        : newReply.createdAt,
    };

    emit("new_reply", { postId: req.params.id, reply: replyPayload });

    const postId = post._id.toString();
    const mentionedAuthor = extractMention(content.trim());

    if (post.clerkId?.trim() && clerkId !== post.clerkId && !mentionedAuthor) {
      notifyCommunityReply(post.clerkId, author.trim(), post.title, postId).catch(console.error);
    }

    if (mentionedAuthor) {
      const targetReply = [...post.replies]
        .reverse()
        .find(r => r.author === mentionedAuthor && r._id.toString() !== newReply._id.toString());

      if (targetReply?.clerkId?.trim() && targetReply.clerkId !== clerkId) {
        notifyCommunityReplyToReply(
          targetReply.clerkId,
          author.trim(),
          snippet(content.trim()),
          postId
        ).catch(console.error);
      }

      if (
        post.clerkId?.trim() &&
        post.clerkId !== clerkId &&
        post.clerkId !== targetReply?.clerkId
      ) {
        notifyCommunityReply(post.clerkId, author.trim(), post.title, postId).catch(console.error);
      }
    }

    res.status(201).json(replyPayload);
  } catch (err) {
    console.error("[community] POST /posts/:id/replies error:", err);
    res.status(500).json({ error: "Failed to add reply" });
  }
}) as RequestHandler);

// POST /api/community/replies/:replyId/like — idempotent
router.post("/replies/:replyId/like", (async (req, res) => {
  try {
    const { likerName, likerClerkId } = req.body as {
      likerName?: string;
      likerClerkId?: string;
    };

    // Only like if not already liked by this user
    const post = await Post.findOneAndUpdate(
      { "replies._id": req.params.replyId, "replies.likedBy": { $ne: likerClerkId } },
      {
        $inc:      { "replies.$.likes": 1 },
        $addToSet: { "replies.$.likedBy": likerClerkId },
      },
      { new: true }
    );

    const current = post ?? await Post.findOne({ "replies._id": req.params.replyId });
    if (!current) return res.status(404).json({ error: "Reply not found" });

    const reply = current.replies.find(r => r._id.toString() === req.params.replyId);
    const newLikes = reply?.likes ?? 0;

    emit("reply_liked", {
      postId:  current._id.toString(),
      replyId: req.params.replyId,
      likes:   newLikes,
    });

    if (post && reply?.clerkId?.trim() && likerName && likerClerkId !== reply.clerkId) {
      notifyCommunityReplyLike(
        reply.clerkId,
        likerName,
        snippet(reply.content),
        current._id.toString()
      ).catch(console.error);
    }

    res.json({ likes: newLikes });
  } catch (err) {
    console.error("[community] POST /replies/:replyId/like error:", err);
    res.status(500).json({ error: "Failed to like reply" });
  }
}) as RequestHandler);

export default router;
