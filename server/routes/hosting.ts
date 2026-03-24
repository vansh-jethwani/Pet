import { Router, RequestHandler } from "express";
import { HostListing } from "../models/HostListing.js";

const router = Router();

/* ─── helpers ────────────────────────────────────────────────────────────── */
function formatListing(doc: any) {
  return {
    id:               doc._id.toString(),
    hostName:         doc.hostName,
    hostAvatar:       doc.hostAvatar || "🧑",
    hostClerkId:      doc.hostClerkId || "",
    hostBio:          doc.hostBio,
    hostPhone:        doc.hostPhone || "",
    hostEmail:        doc.hostEmail || "",
    hostPhoto:        doc.hostPhoto || "",
    city:             doc.city,
    state:            doc.state,
    area:             doc.area || "",
    pincode:          doc.pincode || "",
    petTypes:         doc.petTypes || [],
    maxPets:          doc.maxPets || 2,
    petSizeLimit:     doc.petSizeLimit || "any",
    acceptedBreeds:   doc.acceptedBreeds || "",
    pricePerDay:      doc.pricePerDay,
    pricePerMonth:    doc.pricePerMonth || 0,
    services:         doc.services || [],
    available:        doc.available,
    availableFrom:    doc.availableFrom || "",
    availableTo:      doc.availableTo || "",
    workingHours:     doc.workingHours || "24/7",
    homeType:         doc.homeType || "flat",
    hasGarden:        doc.hasGarden || false,
    hasCctv:          doc.hasCctv || false,
    petFriendlySpace: doc.petFriendlySpace || "",
    yearsExperience:  doc.yearsExperience || 0,
    languages:        doc.languages || [],
    emergencyContact: doc.emergencyContact || "",
    ownPets:          doc.ownPets || "",
    certifications:   doc.certifications || [],
    rating:           doc.rating || 0,
    totalReviews:     doc.totalReviews || 0,
    reviews:          (doc.reviews || []).map((r: any) => ({
      id:              r._id?.toString() || "",
      reviewerName:    r.reviewerName,
      reviewerAvatar:  r.reviewerAvatar || "🐾",
      reviewerClerkId: r.reviewerClerkId || "",
      rating:          r.rating,
      comment:         r.comment,
      createdAt:       r.createdAt instanceof Date
        ? r.createdAt.toISOString()
        : r.createdAt || new Date().toISOString(),
    })),
    verified:  doc.verified || false,
    featured:  doc.featured || false,
    status:    doc.status || "active",
    createdAt: doc.createdAt instanceof Date
      ? doc.createdAt.toISOString()
      : doc.createdAt,
  };
}

// ─── GET /api/hosting ─────────────────────────────────────────────────────
// Query params: city, petType, available, sortBy, minPrice, maxPrice, search
router.get("/", (async (req, res) => {
  try {
    const {
      city, petType, available, sortBy, minPrice, maxPrice, search,
    } = req.query as Record<string, string>;

    const query: Record<string, any> = { status: "active" };

    if (city?.trim()) {
      query.city = { $regex: city.trim(), $options: "i" };
    }
    if (petType?.trim() && petType !== "all") {
      query.petTypes = { $in: [petType.toLowerCase()] };
    }
    if (available === "true") {
      query.available = true;
    }
    if (minPrice || maxPrice) {
      query.pricePerDay = {};
      if (minPrice && !isNaN(parseInt(minPrice))) query.pricePerDay.$gte = parseInt(minPrice);
      if (maxPrice && !isNaN(parseInt(maxPrice))) query.pricePerDay.$lte = parseInt(maxPrice);
    }
    if (search?.trim()) {
      const regex = { $regex: search.trim(), $options: "i" };
      query.$or = [
        { hostName: regex },
        { hostBio: regex },
        { city: regex },
        { area: regex },
        { services: regex },
      ];
    }

    let sort: Record<string, 1 | -1> = { featured: -1, rating: -1, createdAt: -1 };
    if (sortBy === "price-asc")   sort = { pricePerDay: 1 };
    if (sortBy === "price-desc")  sort = { pricePerDay: -1 };
    if (sortBy === "rating")      sort = { rating: -1, totalReviews: -1 };
    if (sortBy === "newest")      sort = { createdAt: -1 };
    if (sortBy === "experience")  sort = { yearsExperience: -1, rating: -1 };

    const listings = await HostListing.find(query).sort(sort).lean();
    res.json(listings.map(formatListing));
  } catch (err) {
    console.error("[hosting] GET / error:", err);
    res.status(500).json({ error: "Failed to fetch host listings" });
  }
}) as RequestHandler);

// ─── GET /api/hosting/:id ─────────────────────────────────────────────────
router.get("/:id", (async (req, res) => {
  try {
    const listing = await HostListing.findById(req.params.id).lean();
    if (!listing) return res.status(404).json({ error: "Host listing not found" });
    res.json(formatListing(listing));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch listing" });
  }
}) as RequestHandler);

// ─── POST /api/hosting ────────────────────────────────────────────────────
router.post("/", (async (req, res) => {
  try {
    const body = req.body;

    // Required field validation
    if (!body.hostName?.trim())  return res.status(400).json({ error: "hostName is required" });
    if (!body.hostBio?.trim())   return res.status(400).json({ error: "hostBio is required" });
    if (!body.city?.trim())      return res.status(400).json({ error: "city is required" });
    if (!body.state?.trim())     return res.status(400).json({ error: "state is required" });
    if (!body.pricePerDay || isNaN(Number(body.pricePerDay)) || Number(body.pricePerDay) <= 0) {
      return res.status(400).json({ error: "valid pricePerDay is required" });
    }
    if (!Array.isArray(body.petTypes) || body.petTypes.length === 0) {
      return res.status(400).json({ error: "at least one petType is required" });
    }

    const listing = await HostListing.create({
      hostName:         body.hostName.trim(),
      hostAvatar:       body.hostAvatar || "🧑",
      hostClerkId:      body.hostClerkId || "",
      hostBio:          body.hostBio.trim(),
      hostPhone:        body.hostPhone || "",
      hostEmail:        body.hostEmail || "",
      hostPhoto:        body.hostPhoto || "",
      city:             body.city.trim(),
      state:            body.state.trim(),
      area:             body.area?.trim() || "",
      pincode:          body.pincode?.trim() || "",
      petTypes:         body.petTypes.map((p: string) => p.toLowerCase()),
      maxPets:          parseInt(body.maxPets) || 2,
      petSizeLimit:     body.petSizeLimit || "any",
      acceptedBreeds:   body.acceptedBreeds || "",
      pricePerDay:      parseFloat(body.pricePerDay),
      pricePerMonth:    parseFloat(body.pricePerMonth) || 0,
      services:         Array.isArray(body.services) ? body.services : [],
      available:        body.available !== false,
      availableFrom:    body.availableFrom || "",
      availableTo:      body.availableTo || "",
      workingHours:     body.workingHours || "24/7",
      homeType:         body.homeType || "flat",
      hasGarden:        body.hasGarden || false,
      hasCctv:          body.hasCctv || false,
      petFriendlySpace: body.petFriendlySpace || "",
      yearsExperience:  parseInt(body.yearsExperience) || 0,
      languages:        Array.isArray(body.languages) ? body.languages : ["Hindi", "English"],
      emergencyContact: body.emergencyContact || "",
      ownPets:          body.ownPets || "",
      certifications:   Array.isArray(body.certifications) ? body.certifications : [],
      verified:         false,
      featured:         false,
      status:           "active",
    });

    console.log(`[hosting] New host listing: ${listing.hostName} in ${listing.city}`);
    res.status(201).json(formatListing(listing));
  } catch (err) {
    console.error("[hosting] POST / error:", err);
    res.status(500).json({ error: "Failed to create host listing" });
  }
}) as RequestHandler);

// ─── PATCH /api/hosting/:id ───────────────────────────────────────────────
router.patch("/:id", (async (req, res) => {
  try {
    const { hostClerkId, ...updates } = req.body;
    const listing = await HostListing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: "Listing not found" });

    // Only owner can update (unless clerkId is empty — demo mode)
    if (listing.hostClerkId && hostClerkId && listing.hostClerkId !== hostClerkId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const allowed = [
      "hostBio", "hostPhone", "hostPhoto", "hostAvatar",
      "city", "state", "area", "pincode",
      "petTypes", "maxPets", "petSizeLimit", "acceptedBreeds",
      "pricePerDay", "pricePerMonth",
      "services", "available", "availableFrom", "availableTo", "workingHours",
      "homeType", "hasGarden", "hasCctv", "petFriendlySpace",
      "yearsExperience", "languages", "emergencyContact", "ownPets", "certifications",
    ];
    allowed.forEach(k => {
      if (updates[k] !== undefined) (listing as any)[k] = updates[k];
    });
    await listing.save();
    res.json(formatListing(listing));
  } catch (err) {
    res.status(500).json({ error: "Failed to update listing" });
  }
}) as RequestHandler);

// ─── DELETE /api/hosting/:id ──────────────────────────────────────────────
router.delete("/:id", (async (req, res) => {
  try {
    const { hostClerkId } = req.body;
    const listing = await HostListing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: "Listing not found" });
    if (listing.hostClerkId && hostClerkId && listing.hostClerkId !== hostClerkId) {
      return res.status(403).json({ error: "Not authorized" });
    }
    await listing.deleteOne();
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete listing" });
  }
}) as RequestHandler);

// ─── POST /api/hosting/:id/review ────────────────────────────────────────
router.post("/:id/review", (async (req, res) => {
  try {
    const { reviewerName, reviewerAvatar, reviewerClerkId, rating, comment } = req.body;

    if (!reviewerName?.trim())      return res.status(400).json({ error: "reviewerName is required" });
    if (!comment?.trim())           return res.status(400).json({ error: "comment is required" });
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "rating must be between 1 and 5" });
    }

    const listing = await HostListing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: "Listing not found" });

    // Prevent double-reviewing
    if (reviewerClerkId) {
      const alreadyReviewed = listing.reviews.some(
        r => r.reviewerClerkId === reviewerClerkId
      );
      if (alreadyReviewed) {
        return res.status(409).json({ error: "You have already reviewed this host" });
      }
    }

    listing.reviews.push({
      reviewerName:    reviewerName.trim(),
      reviewerAvatar:  reviewerAvatar || "🐾",
      reviewerClerkId: reviewerClerkId || "",
      rating:          parseInt(rating),
      comment:         comment.trim(),
    } as any);

    // Recalculate rating
    const total = listing.reviews.reduce((s, r) => s + r.rating, 0);
    listing.rating       = Math.round((total / listing.reviews.length) * 10) / 10;
    listing.totalReviews = listing.reviews.length;

    await listing.save();
    res.status(201).json(formatListing(listing));
  } catch (err) {
    console.error("[hosting] POST /:id/review error:", err);
    res.status(500).json({ error: "Failed to add review" });
  }
}) as RequestHandler);

// ─── PATCH /api/hosting/:id/availability ─────────────────────────────────
router.patch("/:id/availability", (async (req, res) => {
  try {
    const { available, hostClerkId } = req.body;
    if (typeof available !== "boolean") {
      return res.status(400).json({ error: "available must be boolean" });
    }
    const listing = await HostListing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: "Listing not found" });
    if (listing.hostClerkId && hostClerkId && listing.hostClerkId !== hostClerkId) {
      return res.status(403).json({ error: "Not authorized" });
    }
    listing.available = available;
    await listing.save();
    res.json({ available: listing.available });
  } catch (err) {
    res.status(500).json({ error: "Failed to update availability" });
  }
}) as RequestHandler);

// ─── GET /api/hosting/host/:clerkId ──────────────────────────────────────
// Get all listings by a specific host
router.get("/host/:clerkId", (async (req, res) => {
  try {
    const listings = await HostListing.find({ hostClerkId: req.params.clerkId }).sort({ createdAt: -1 }).lean();
    res.json(listings.map(formatListing));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch host listings" });
  }
}) as RequestHandler);

export default router;
