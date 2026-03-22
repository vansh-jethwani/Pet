import { Router, RequestHandler } from "express";
import {
  Notification,
  formatNotification,
  NOTIFICATION_DEFAULTS,
  NotificationType,
  createNotification,
} from "../models/Notification.js";

const router = Router();

// Health check — GET /api/notifications/ping
router.get("/ping", ((_req, res) => res.json({ ok: true })) as RequestHandler);

// Unread count — GET /api/notifications/unread-count?userId=xxx
router.get("/unread-count", (async (req, res) => {
  try {
    const { userId } = req.query as Record<string, string>;
    if (!userId) return res.status(400).json({ error: "userId required" });
    const count = await Notification.countDocuments({ userId, read: false });
    res.json({ count });
  } catch (e) {
    res.status(500).json({ error: "Failed" });
  }
}) as RequestHandler);

// List — GET /api/notifications?userId=xxx&limit=30&skip=0
router.get("/", (async (req, res) => {
  try {
    const { userId, limit = "30", skip = "0" } = req.query as Record<string, string>;
    if (!userId) return res.status(400).json({ error: "userId required" });

    const lim = Math.min(parseInt(limit) || 30, 100);
    const sk  = parseInt(skip) || 0;

    const [docs, total, unread] = await Promise.all([
      Notification.find({ userId }).sort({ createdAt: -1 }).skip(sk).limit(lim).lean(),
      Notification.countDocuments({ userId }),
      Notification.countDocuments({ userId, read: false }),
    ]);

    res.json({
      notifications: docs.map(formatNotification),
      total,
      unread,
      hasMore: sk + docs.length < total,
    });
  } catch (e) {
    console.error("[notifications] GET error:", e);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
}) as RequestHandler);

// Mark all read — PATCH /api/notifications/read-all
// MUST be before /:id routes so "read-all" isn't treated as an id
router.patch("/read-all", (async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "userId required" });
    const r = await Notification.updateMany({ userId, read: false }, { read: true });
    res.json({ modified: r.modifiedCount });
  } catch (e) {
    res.status(500).json({ error: "Failed" });
  }
}) as RequestHandler);

// Mark single read — PATCH /api/notifications/:id/read
router.patch("/:id/read", (async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "userId required" });
    const doc = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId }, { read: true }, { new: true }
    ).lean();
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(formatNotification(doc));
  } catch (e) {
    res.status(500).json({ error: "Failed" });
  }
}) as RequestHandler);

// Mark single unread — PATCH /api/notifications/:id/unread
router.patch("/:id/unread", (async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "userId required" });
    const doc = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId }, { read: false }, { new: true }
    ).lean();
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(formatNotification(doc));
  } catch (e) {
    res.status(500).json({ error: "Failed" });
  }
}) as RequestHandler);

// Clear all read — DELETE /api/notifications/clear-all
// MUST be before /:id so "clear-all" isn't treated as a MongoDB ObjectId
router.delete("/clear-all", (async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "userId required" });
    const r = await Notification.deleteMany({ userId, read: true });
    res.json({ deleted: r.deletedCount });
  } catch (e) {
    res.status(500).json({ error: "Failed" });
  }
}) as RequestHandler);

// Delete single — DELETE /api/notifications/:id
router.delete("/:id", (async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "userId required" });
    const r = await Notification.deleteOne({ _id: req.params.id, userId });
    if (r.deletedCount === 0) return res.status(404).json({ error: "Not found" });
    res.json({ deleted: true });
  } catch (e) {
    res.status(500).json({ error: "Failed" });
  }
}) as RequestHandler);

// Test — POST /api/notifications/test { userId, type? }
router.post("/test", (async (req, res) => {
  try {
    const { userId, type = "system" } = req.body;
    if (!userId) return res.status(400).json({ error: "userId required" });
    const safeType = (type in NOTIFICATION_DEFAULTS ? type : "system") as NotificationType;
    const n = await createNotification({
      userId,
      type: safeType,
      message: `Test "${safeType}" notification — ${new Date().toLocaleTimeString()}`,
      actionUrl: "/",
      actionLabel: "Dismiss",
    });
    res.status(201).json(n);
  } catch (e) {
    console.error("[notifications] POST /test error:", e);
    res.status(500).json({ error: "Failed" });
  }
}) as RequestHandler);

export default router;
