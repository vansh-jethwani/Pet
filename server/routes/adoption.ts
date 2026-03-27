import { Router, RequestHandler } from "express";
import { AdoptionListing } from "../models/AdoptionListing.js";
import { notifyAdoptionApplied } from "../models/Notification.js";

const router = Router();

function formatListing(doc: any) {
  return {
    id: doc._id.toString(),
    petName: doc.petName,
    species: doc.species,
    breed: doc.breed,
    age: doc.age,
    ageUnit: doc.ageUnit || "years",
    gender: doc.gender,
    color: doc.color || "",
    weight: doc.weight || "",
    photo: doc.photo,
    description: doc.description,
    traits: doc.traits || [],
    vaccinated: doc.vaccinated,
    neutered: doc.neutered,
    microchipped: doc.microchipped,
    healthNotes: doc.healthNotes || "",
    listingType: doc.listingType,
    price: doc.price || 0,
    adoptionFee: doc.adoptionFee || 0,
    location: doc.location,
    city: doc.city,
    state: doc.state,
    ownerName: doc.ownerName,
    ownerClerkId: doc.ownerClerkId || "",
    ownerEmail: doc.ownerEmail || "",
    ownerPhone: doc.ownerPhone || "",
    ownerAvatar: doc.ownerAvatar || "🐾",
    shelterOrg: doc.shelterOrg || "",
    status: doc.status,
    featured: doc.featured || false,
    applications: (doc.applications || []).map((a: any) => ({
      id: a._id?.toString() || "",
      applicantName: a.applicantName,
      applicantEmail: a.applicantEmail,
      applicantPhone: a.applicantPhone || "",
      applicantClerkId: a.applicantClerkId || "",
      message: a.message || "",
      status: a.status,
      createdAt: a.createdAt instanceof Date ? a.createdAt.toISOString() : a.createdAt,
    })),
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : doc.createdAt,
    updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : doc.updatedAt,
  };
}

// GET /api/adoption — list all available listings
router.get("/", (async (req, res) => {
  try {
    const { species, listingType, city, gender, status = "available", search, ownerClerkId, sortBy } = req.query as Record<string, string>;

    const query: Record<string, any> = {};

    if (ownerClerkId) {
      query.ownerClerkId = ownerClerkId;
    } else {
      query.status = status;
    }

    if (species && species !== "all") query.species = species;
    if (listingType && listingType !== "all") query.listingType = listingType;
    if (city && city !== "all") query.city = { $regex: city, $options: "i" };
    if (gender && gender !== "all") query.gender = gender;

    if (search?.trim()) {
      const regex = { $regex: search.trim(), $options: "i" };
      query.$or = [
        { petName: regex },
        { breed: regex },
        { description: regex },
        { city: regex },
        { ownerName: regex },
        { shelterOrg: regex },
      ];
    }

    let sort: Record<string, 1 | -1> = { featured: -1, createdAt: -1 };
    if (sortBy === "price-asc") sort = { price: 1, adoptionFee: 1 };
    if (sortBy === "price-desc") sort = { price: -1, adoptionFee: -1 };
    if (sortBy === "newest") sort = { createdAt: -1 };

    const listings = await AdoptionListing.find(query).sort(sort).lean();
    res.json(listings.map(formatListing));
  } catch (err) {
    console.error("[adoption] GET / error:", err);
    res.status(500).json({ error: "Failed to fetch listings" });
  }
}) as RequestHandler);

// GET /api/adoption/:id
router.get("/:id", (async (req, res) => {
  try {
    const listing = await AdoptionListing.findById(req.params.id).lean();
    if (!listing) return res.status(404).json({ error: "Listing not found" });
    res.json(formatListing(listing));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch listing" });
  }
}) as RequestHandler);

// POST /api/adoption — create listing
router.post("/", (async (req, res) => {
  try {
    const body = req.body;
    const required = ["petName", "species", "breed", "age", "gender", "photo", "description", "location", "city", "state", "ownerName", "listingType"];
    for (const f of required) {
      if (!body[f]?.toString().trim()) return res.status(400).json({ error: `${f} is required` });
    }

    const listing = await AdoptionListing.create({
      petName: body.petName.trim(),
      species: body.species,
      breed: body.breed.trim(),
      age: parseFloat(body.age) || 0,
      ageUnit: body.ageUnit || "years",
      gender: body.gender,
      color: body.color || "",
      weight: body.weight || "",
      photo: body.photo.trim(),
      description: body.description.trim(),
      traits: Array.isArray(body.traits) ? body.traits : [],
      vaccinated: body.vaccinated || false,
      neutered: body.neutered || false,
      microchipped: body.microchipped || false,
      healthNotes: body.healthNotes || "",
      listingType: body.listingType,
      price: parseFloat(body.price) || 0,
      adoptionFee: parseFloat(body.adoptionFee) || 0,
      location: body.location.trim(),
      city: body.city.trim(),
      state: body.state.trim(),
      ownerName: body.ownerName.trim(),
      ownerClerkId: body.ownerClerkId || "",
      ownerEmail: body.ownerEmail || "",
      ownerPhone: body.ownerPhone || "",
      ownerAvatar: body.ownerAvatar || "🐾",
      shelterOrg: body.shelterOrg || "",
      status: "available",
      featured: false,
    });

    console.log(`[adoption] New listing: ${listing.petName} (${listing.listingType}) by ${listing.ownerName}`);
    res.status(201).json(formatListing(listing));
  } catch (err) {
    console.error("[adoption] POST / error:", err);
    res.status(500).json({ error: "Failed to create listing" });
  }
}) as RequestHandler);

// PATCH /api/adoption/:id — update listing (owner only)
router.patch("/:id", (async (req, res) => {
  try {
    const { ownerClerkId, ...updates } = req.body;
    const listing = await AdoptionListing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: "Not found" });
    if (listing.ownerClerkId && ownerClerkId && listing.ownerClerkId !== ownerClerkId) {
      return res.status(403).json({ error: "Not authorized" });
    }
    const allowed = ["petName", "breed", "age", "ageUnit", "gender", "color", "weight", "photo", "description", "traits", "vaccinated", "neutered", "microchipped", "healthNotes", "price", "adoptionFee", "location", "city", "state", "ownerPhone", "shelterOrg", "status"];
    allowed.forEach(k => { if (updates[k] !== undefined) (listing as any)[k] = updates[k]; });
    await listing.save();
    res.json(formatListing(listing));
  } catch (err) {
    res.status(500).json({ error: "Failed to update listing" });
  }
}) as RequestHandler);

// DELETE /api/adoption/:id — delete listing (owner only)
router.delete("/:id", (async (req, res) => {
  try {
    const { ownerClerkId } = req.body;
    const listing = await AdoptionListing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: "Not found" });
    if (listing.ownerClerkId && ownerClerkId && listing.ownerClerkId !== ownerClerkId) {
      return res.status(403).json({ error: "Not authorized" });
    }
    await listing.deleteOne();
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete listing" });
  }
}) as RequestHandler);

// POST /api/adoption/:id/apply — submit adoption application
router.post("/:id/apply", (async (req, res) => {
  try {
    const { applicantName, applicantEmail, applicantPhone, applicantClerkId, message } = req.body;
    if (!applicantName?.trim() || !applicantEmail?.trim()) {
      return res.status(400).json({ error: "applicantName and applicantEmail are required" });
    }

    const listing = await AdoptionListing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: "Listing not found" });
    if (listing.status !== "available") return res.status(400).json({ error: "This pet is no longer available" });

    // Prevent duplicate applications
    const already = listing.applications.some(a => a.applicantClerkId === applicantClerkId && applicantClerkId);
    if (already) return res.status(409).json({ error: "You have already applied for this pet" });

    listing.applications.push({
      applicantName: applicantName.trim(),
      applicantEmail: applicantEmail.trim(),
      applicantPhone: applicantPhone || "",
      applicantClerkId: applicantClerkId || "",
      message: message || "",
      status: "pending",
    } as any);

    listing.status = "pending";
    await listing.save();

    if (listing.ownerClerkId) {
      notifyAdoptionApplied(listing.ownerClerkId, applicantName.trim(), listing.petName);
    }

    res.status(201).json({ success: true, message: "Application submitted successfully!" });
  } catch (err) {
    console.error("[adoption] POST /:id/apply error:", err);
    res.status(500).json({ error: "Failed to submit application" });
  }
}) as RequestHandler);

// PATCH /api/adoption/:id/status — update status (owner only)
router.patch("/:id/status", (async (req, res) => {
  try {
    const { status, ownerClerkId } = req.body;
    if (!["available", "adopted", "pending", "sold"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    const listing = await AdoptionListing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: "Not found" });
    if (listing.ownerClerkId && ownerClerkId && listing.ownerClerkId !== ownerClerkId) {
      return res.status(403).json({ error: "Not authorized" });
    }
    listing.status = status;
    await listing.save();
    res.json({ status: listing.status });
  } catch (err) {
    res.status(500).json({ error: "Failed to update status" });
  }
}) as RequestHandler);

export default router;
