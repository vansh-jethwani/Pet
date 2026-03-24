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
      createdAt: r.createdAt instanceof Date
        ? r.createdAt.toISOString()
        : r.createdAt,
    })),
  };
}

// ─── Helper: extract @mention from the start of reply content ────────────────
// Returns the mentioned author name if the content starts with "@Author message"
function extractMention(content: string): string | null {
  const match = content.match(/^@(\S+)\s/);
  return match ? match[1] : null;
}

// ─── Helper: short snippet for notifications (max 40 chars) ──────────────────
function snippet(text: string, max = 40): string {
  const clean = text.replace(/^@\S+\s/, "").trim(); // strip leading @mention
  return clean.length > max ? clean.slice(0, max) + "…" : clean;
}

// GET /api/community/posts
router.get("/posts", (async (_req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts.map(formatPost));
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

    const formatted = formatPost(post);
    emit("new_post", formatted);
    res.status(201).json(formatted);
  } catch (err) {
    console.error("[community] POST /posts error:", err);
    res.status(500).json({ error: "Failed to create post" });
  }
}) as RequestHandler);

// POST /api/community/posts/:id/like
router.post("/posts/:id/like", (async (req, res) => {
  try {
    const { likerName, likerClerkId } = req.body as {
      likerName?: string;
      likerClerkId?: string;
    };
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $inc: { likes: 1 } },
      { new: true }
    );
    if (!post) return res.status(404).json({ error: "Post not found" });

    emit("post_liked", { id: req.params.id, likes: post.likes });

    if (post.clerkId?.trim() && likerName && likerClerkId !== post.clerkId) {
      notifyCommunityLike(post.clerkId, likerName, post.title, post._id.toString()).catch(console.error);
    }

    res.json({ likes: post.likes });
  } catch (err) {
    console.error("[community] POST /posts/:id/like error:", err);
    res.status(500).json({ error: "Failed to like post" });
  }
}) as RequestHandler);

// POST /api/community/posts/:id/unlike
router.post("/posts/:id/unlike", (async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $inc: { likes: -1 } },
      { new: true }
    );
    if (!post) return res.status(404).json({ error: "Post not found" });
    const likes = Math.max(0, post.likes);
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
            clerkId: clerkId || "",   // ← SAVE clerkId on the reply subdoc
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
      createdAt: newReply.createdAt instanceof Date
        ? newReply.createdAt.toISOString()
        : newReply.createdAt,
    };

    emit("new_reply", { postId: req.params.id, reply: replyPayload });

    const postId = post._id.toString();

    // ── Notify 1: post author gets notified when someone replies to their post
    //    (skip if replier IS the post author, or if it's a reply-to-reply @mention)
    const mentionedAuthor = extractMention(content.trim());
    if (post.clerkId?.trim() && clerkId !== post.clerkId && !mentionedAuthor) {
      notifyCommunityReply(post.clerkId, author.trim(), post.title, postId).catch(console.error);
    }

    // ── Notify 2: if this reply starts with @SomeAuthor (reply-to-reply),
    //    find that reply author's clerkId and notify them.
    if (mentionedAuthor) {
      // Find the most-recent reply by that author to get their clerkId
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

      // ALSO notify post author if the reply-to-reply is on their post
      // and they are not the replier or the mentioned person
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

// POST /api/community/replies/:replyId/like
router.post("/replies/:replyId/like", (async (req, res) => {
  try {
    // Accept likerName + likerClerkId so we can notify the reply author
    const { likerName, likerClerkId } = req.body as {
      likerName?: string;
      likerClerkId?: string;
    };

    const post = await Post.findOneAndUpdate(
      { "replies._id": req.params.replyId },
      { $inc: { "replies.$.likes": 1 } },
      { new: true }
    );
    if (!post) return res.status(404).json({ error: "Reply not found" });

    const reply = post.replies.find(r => r._id.toString() === req.params.replyId);
    const newLikes = reply?.likes ?? 0;

    emit("reply_liked", {
      postId:  post._id.toString(),
      replyId: req.params.replyId,
      likes:   newLikes,
    });

    // Notify the reply author if they are not the one liking their own reply
    if (
      reply?.clerkId?.trim() &&
      likerName &&
      likerClerkId !== reply.clerkId
    ) {
      const replySnippet = snippet(reply.content);
      notifyCommunityReplyLike(
        reply.clerkId,
        likerName,
        replySnippet,
        post._id.toString()
      ).catch(console.error);
    }

    res.json({ likes: newLikes });
  } catch (err) {
    console.error("[community] POST /replies/:replyId/like error:", err);
    res.status(500).json({ error: "Failed to like reply" });
  }
}) as RequestHandler);

export default router;
