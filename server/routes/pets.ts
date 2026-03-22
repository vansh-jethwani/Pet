import { Router } from "express";
import { Pet } from "../models/Pet.js";
import { getIO } from "../index.js";

const router = Router();

const normalizePet = (pet: any) => {
  const p = pet.toObject ? pet.toObject() : { ...pet };
  return {
    ...p,
    id:           p.id ? p.id.toString() : p._id?.toString(),
    ownerAvatar:  p.ownerAvatar || (p.species === "cat" ? "🐱" : "🐕"),
    traits:       p.traits       || [],
    healthCerts:  p.healthCerts  || [],
    joinedDate:   p.joinedDate   || new Date().toLocaleDateString("en-US", {
      month: "short",
      year:  "numeric",
    }),
  };
};

// GET /api/pets — list all pets newest-first
router.get("/", async (_req, res) => {
  try {
    const pets = await Pet.find().sort({ createdAt: -1 });
    res.json(pets.map(normalizePet));
  } catch (err) {
    console.error("[pets] GET / error:", err);
    res.status(500).json({ error: "Failed to fetch pets" });
  }
});

// POST /api/pets — create a new pet listing
router.post("/", async (req, res) => {
  try {
    const data = req.body;
    if (
      !data.name    ||
      !data.species ||
      !data.breed   ||
      !data.age     ||
      !data.city    ||
      !data.location||
      !data.photo
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const pet = await Pet.create({
      ...data,
      owner:        data.owner       || "You",
      ownerAvatar:  data.ownerAvatar || "🧑",
      ownerVerified:data.ownerVerified || false,
      vaccinated:   data.vaccinated  ?? true,
      pedigree:     data.pedigree    ?? false,
      fallbackEmoji:data.fallbackEmoji || (data.species === "cat" ? "🐱" : "🐕"),
      traits:       data.traits      || [],
      weight:       data.weight      || "—",
      color:        data.color       || "—",
      score:        data.score       ?? 0,
      healthCerts:  data.healthCerts || [],
      joinedDate:   data.joinedDate  || new Date().toLocaleDateString("en-US", {
        month: "short",
        year:  "numeric",
      }),
    });

    const normalized = normalizePet(pet);

    // BUG FIX: use getIO() at call time so we always get the live io instance
    // even though this module is imported before attachSocketServer() runs.
    const io = getIO();
    if (io) {
      io.emit("new_pet", normalized);
    }

    res.status(201).json(normalized);
  } catch (err) {
    console.error("[pets] POST / error:", err);
    res.status(500).json({ error: "Failed to create pet" });
  }
});

export default router;
