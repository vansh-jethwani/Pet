import { Router } from "express";
import { BreedingMatch } from "../models/BreedingMatch.js";

const router = Router();

// GET /api/breeding-matches?clerkUserId=xxx  — fetch all matched petIds for a user
router.get("/", async (req, res) => {
  try {
    const { clerkUserId } = req.query;
    if (!clerkUserId || typeof clerkUserId !== "string") {
      return res.status(400).json({ error: "clerkUserId required" });
    }
    const matches = await BreedingMatch.find({ clerkUserId }).sort({ createdAt: -1 });
    res.json(matches.map(m => ({ petId: m.petId, createdAt: m.createdAt })));
  } catch (err) {
    console.error("[breeding-matches] GET error:", err);
    res.status(500).json({ error: "Failed to fetch matches" });
  }
});

// POST /api/breeding-matches  — save a new match
router.post("/", async (req, res) => {
  try {
    const { clerkUserId, petId } = req.body;
    if (!clerkUserId || !petId) {
      return res.status(400).json({ error: "clerkUserId and petId required" });
    }
    // upsert avoids duplicates
    await BreedingMatch.updateOne(
      { clerkUserId, petId },
      { $setOnInsert: { clerkUserId, petId } },
      { upsert: true }
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error("[breeding-matches] POST error:", err);
    res.status(500).json({ error: "Failed to save match" });
  }
});

// DELETE /api/breeding-matches  — remove a match
router.delete("/", async (req, res) => {
  try {
    const { clerkUserId, petId } = req.body;
    if (!clerkUserId || !petId) {
      return res.status(400).json({ error: "clerkUserId and petId required" });
    }
    await BreedingMatch.deleteOne({ clerkUserId, petId });
    res.json({ ok: true });
  } catch (err) {
    console.error("[breeding-matches] DELETE error:", err);
    res.status(500).json({ error: "Failed to delete match" });
  }
});

export default router;
