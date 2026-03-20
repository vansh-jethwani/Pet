import { Router } from "express";
import { Pet } from "../models/Pet.js";
import { io } from "../index.js";

const router = Router();

const normalizePet = (pet: any) => {
  const p = pet.toObject ? pet.toObject() : { ...pet };
  return {
    ...p,
    id: p.id ? p.id.toString() : p._id?.toString(),
    ownerAvatar: p.ownerAvatar || (p.species === "cat" ? "🐱" : "🐕"),
    traits: p.traits || [],
    healthCerts: p.healthCerts || [],
    joinedDate: p.joinedDate || new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
  };
};

router.get("/", async (_req, res) => {
  const pets = await Pet.find().sort({ createdAt: -1 });
  res.json(pets.map(normalizePet));
});

router.post("/", async (req, res) => {
  const data = req.body;
  if (!data.name || !data.species || !data.breed || !data.age || !data.city || !data.location || !data.photo) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const pet = await Pet.create({
    ...data,
    owner: data.owner || "You",
    ownerAvatar: data.ownerAvatar || "🧑",
    ownerVerified: data.ownerVerified || false,
    vaccinated: data.vaccinated ?? true,
    pedigree: data.pedigree ?? false,
    fallbackEmoji: data.fallbackEmoji || (data.species === "cat" ? "🐱" : "🐕"),
    traits: data.traits || [],
    weight: data.weight || "—",
    color: data.color || "—",
    score: data.score ?? 0,
    healthCerts: data.healthCerts || [],
    joinedDate: data.joinedDate || new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
  });

  const normalized = normalizePet(pet);
  io.emit("new_pet", normalized);
  res.status(201).json(normalized);
});

export default router;
