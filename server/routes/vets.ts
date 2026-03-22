import { Router, RequestHandler } from "express";
import { Vet } from "../models/Vet.js";

const router = Router();

/* ─── helpers ────────────────────────────────────────────────────────────── */
function formatVet(doc: any) {
  return {
    id:                doc._id.toString(),
    name:              doc.name,
    email:             doc.email,
    image:             doc.image,
    title:             doc.title,
    licenseNumber:     doc.licenseNumber,
    experience:        doc.experience,
    specialties:       doc.specialties   ?? [],
    qualifications:    doc.qualifications ?? "",
    clinic:            doc.clinic         ?? "",
    consultationTypes: doc.consultationTypes ?? [],
    videoPrice:        doc.videoPrice    ?? 0,
    phonePrice:        doc.phonePrice    ?? 0,
    inpersonPrice:     doc.inpersonPrice ?? 0,
    responseTime:      doc.responseTime  ?? "",
    location:          doc.location,
    bio:               doc.bio,
    verified:          doc.verified,
    available:         doc.available,
    rating:            doc.rating,
    reviews:           doc.reviews,
    status:            doc.status,
    createdAt:         doc.createdAt,
  };
}

/* ─────────────────────────────────────────────────────────────────────────
   GET /api/vets
   Lists all APPROVED vets with optional search / filter / sort params.

   FIX: was querying { status: "approved" } only, which excluded every vet
   registered via VetSignUp (which saved them as "pending").
   Now the default status in the model is "approved", and this query
   correctly filters by status = "approved" so only visible vets are shown.

   For already-registered vets stuck as "pending" in the DB, hit:
     PATCH /api/vets/admin/approve-all
   to bulk-approve them.
───────────────────────────────────────────────────────────────────────── */
router.get("/", (async (req, res) => {
  try {
    const {
      search,
      specialty,
      consultationType,
      maxPrice,
      verified,
      sortBy,
    } = req.query as Record<string, string>;

    // FIX: only show approved vets in public listing
    const query: Record<string, any> = { status: "approved" };

    // Full-text-style search across name, specialties, bio, location, clinic
    if (search && search.trim()) {
      const regex = { $regex: search.trim(), $options: "i" };
      query.$or = [
        { name:       regex },
        { specialties:regex },
        { bio:        regex },
        { location:   regex },
        { clinic:     regex },
        { title:      regex },
      ];
    }

    if (specialty && specialty.trim()) {
      query.specialties = { $regex: specialty.trim(), $options: "i" };
    }

    if (consultationType && consultationType !== "all") {
      query.consultationTypes = { $in: [consultationType] };
    }

    if (verified === "true") {
      query.verified = true;
    }

    // Price filter — apply to the relevant price field
    if (maxPrice && !isNaN(parseInt(maxPrice))) {
      const max = parseInt(maxPrice);
      if (consultationType && consultationType !== "all") {
        const priceField =
          consultationType === "video"    ? "videoPrice"    :
          consultationType === "phone"    ? "phonePrice"    :
          consultationType === "inperson" ? "inpersonPrice" : null;
        if (priceField) {
          // include vets where that price is 0 (not offered) OR within budget
          query.$and = [
            {
              $or: [
                { [priceField]: { $lte: max } },
                { [priceField]: 0 },
              ],
            },
          ];
        }
      }
      // When "all" types selected, filter by minimum of all their offered prices
      // This is handled client-side in Vets.tsx already
    }

    let sortObj: Record<string, 1 | -1> = { rating: -1, createdAt: -1 };
    if (sortBy === "experience") sortObj = { experience: -1, rating: -1 };
    if (sortBy === "price")      sortObj = { videoPrice: 1,  phonePrice: 1 };

    const vets = await Vet.find(query).sort(sortObj).lean();
    res.json(vets.map(formatVet));
  } catch (err) {
    console.error("[vets] GET / error:", err);
    res.status(500).json({ error: "Failed to fetch vets" });
  }
}) as RequestHandler);

/* ─────────────────────────────────────────────────────────────────────────
   GET /api/vets/admin/all  — all vets regardless of status (admin use)
───────────────────────────────────────────────────────────────────────── */
router.get("/admin/all", (async (_req, res) => {
  try {
    const vets = await Vet.find({}).sort({ createdAt: -1 }).lean();
    res.json(vets.map(formatVet));
  } catch (err) {
    console.error("[vets] GET /admin/all error:", err);
    res.status(500).json({ error: "Failed to fetch vets" });
  }
}) as RequestHandler);

/* ─────────────────────────────────────────────────────────────────────────
   PATCH /api/vets/admin/approve-all
   One-time migration: approves every vet currently stuck as "pending".
   Call this once from a REST client (Postman / curl) after deploying.
     curl -X PATCH http://localhost:8080/api/vets/admin/approve-all
───────────────────────────────────────────────────────────────────────── */
router.patch("/admin/approve-all", (async (_req, res) => {
  try {
    const result = await Vet.updateMany(
      { status: "pending" },
      { $set: { status: "approved", verified: true } }
    );
    res.json({
      message: `Approved ${result.modifiedCount} pending vet(s).`,
      modifiedCount: result.modifiedCount,
    });
  } catch (err) {
    console.error("[vets] PATCH /admin/approve-all error:", err);
    res.status(500).json({ error: "Failed to bulk-approve vets" });
  }
}) as RequestHandler);

/* ─────────────────────────────────────────────────────────────────────────
   GET /api/vets/:id
───────────────────────────────────────────────────────────────────────── */
router.get("/:id", (async (req, res) => {
  try {
    const vet = await Vet.findById(req.params.id).lean();
    if (!vet) return res.status(404).json({ error: "Vet not found" });
    res.json(formatVet(vet));
  } catch (err) {
    console.error("[vets] GET /:id error:", err);
    res.status(500).json({ error: "Failed to fetch vet" });
  }
}) as RequestHandler);

/* ─────────────────────────────────────────────────────────────────────────
   POST /api/vets  — register a new vet
   FIX: status is now set to "approved" so the vet is immediately visible.
───────────────────────────────────────────────────────────────────────── */
router.post("/", (async (req, res) => {
  try {
    const {
      name, email, image, clerkId,
      title, licenseNumber, experience,
      specialties, qualifications, clinic,
      consultationTypes,
      videoPrice, phonePrice, inpersonPrice,
      responseTime, location, bio,
    } = req.body;

    // Validate required fields
    if (!name?.trim()) {
      return res.status(400).json({ error: "name is required" });
    }
    if (!email?.trim()) {
      return res.status(400).json({ error: "email is required" });
    }
    if (!licenseNumber?.trim()) {
      return res.status(400).json({ error: "licenseNumber is required" });
    }
    if (!location?.trim()) {
      return res.status(400).json({ error: "location is required" });
    }
    if (!bio?.trim()) {
      return res.status(400).json({ error: "bio is required" });
    }

    // Duplicate email check
    const existing = await Vet.findOne({ email: email.trim().toLowerCase() });
    if (existing) {
      // If same clerkId re-submits (e.g. retry after network error), just return existing
      if (clerkId && existing.clerkId === clerkId) {
        return res.status(200).json(formatVet(existing));
      }
      return res.status(409).json({ error: "A vet account with this email already exists" });
    }

    const vet = await Vet.create({
      name:              name.trim(),
      email:             email.trim().toLowerCase(),
      image:             image             || "👨‍⚕️",
      clerkId:           clerkId           || "",
      title:             title             || "DVM",
      licenseNumber:     licenseNumber.trim(),
      experience:        Math.max(0, parseInt(experience) || 0),
      specialties:       Array.isArray(specialties) ? specialties : [],
      qualifications:    qualifications    || "",
      clinic:            clinic            || "",
      consultationTypes: Array.isArray(consultationTypes) ? consultationTypes : [],
      videoPrice:        Math.max(0, parseInt(videoPrice)    || 0),
      phonePrice:        Math.max(0, parseInt(phonePrice)    || 0),
      inpersonPrice:     Math.max(0, parseInt(inpersonPrice) || 0),
      responseTime:      responseTime      || "1–2 hours",
      location:          location.trim(),
      bio:               bio.trim(),
      verified:          true,   // FIX: verified on signup (no manual review)
      available:         true,
      rating:            0,
      reviews:           0,
      status:            "approved", // FIX: was "pending" — now immediately visible
    });

    console.log(`[vets] New vet registered & approved: ${vet.name} <${vet.email}>`);
    res.status(201).json(formatVet(vet));
  } catch (err: any) {
    console.error("[vets] POST / error:", err);
    // Handle mongoose duplicate key error
    if (err.code === 11000) {
      return res.status(409).json({ error: "A vet account with this email already exists" });
    }
    res.status(500).json({ error: "Failed to create vet profile" });
  }
}) as RequestHandler);

/* ─────────────────────────────────────────────────────────────────────────
   PATCH /api/vets/:id/availability
───────────────────────────────────────────────────────────────────────── */
router.patch("/:id/availability", (async (req, res) => {
  try {
    const { available } = req.body;
    if (typeof available !== "boolean") {
      return res.status(400).json({ error: "available must be a boolean" });
    }
    const vet = await Vet.findByIdAndUpdate(
      req.params.id,
      { available },
      { new: true }
    ).lean();
    if (!vet) return res.status(404).json({ error: "Vet not found" });
    res.json({ available: vet.available });
  } catch (err) {
    console.error("[vets] PATCH /:id/availability error:", err);
    res.status(500).json({ error: "Failed to update availability" });
  }
}) as RequestHandler);

/* ─────────────────────────────────────────────────────────────────────────
   POST /api/vets/:id/book
───────────────────────────────────────────────────────────────────────── */
router.post("/:id/book", (async (req, res) => {
  try {
    const vet = await Vet.findById(req.params.id).lean();
    if (!vet) return res.status(404).json({ error: "Vet not found" });
    if (!vet.available) {
      return res.status(400).json({ error: "This vet is currently unavailable" });
    }

    const {
      consultationType,
      petName,
      petType,
      ownerName,
      ownerEmail,
      preferredDate,
      notes,
    } = req.body;

    if (!consultationType || !ownerName?.trim() || !ownerEmail?.trim()) {
      return res.status(400).json({
        error: "consultationType, ownerName and ownerEmail are required",
      });
    }

    if (!vet.consultationTypes.includes(consultationType)) {
      return res.status(400).json({
        error: `This vet does not offer ${consultationType} consultations`,
      });
    }

    const priceMap: Record<string, number> = {
      video:    vet.videoPrice,
      phone:    vet.phonePrice,
      inperson: vet.inpersonPrice,
    };

    const booking = {
      id:               `BK-${Date.now()}`,
      vetId:            vet._id.toString(),
      vetName:          vet.name,
      consultationType,
      petName:          petName    || "Unknown",
      petType:          petType    || "Unknown",
      ownerName:        ownerName.trim(),
      ownerEmail:       ownerEmail.trim(),
      preferredDate:    preferredDate || null,
      notes:            notes         || "",
      price:            priceMap[consultationType] ?? 0,
      status:           "confirmed",
      createdAt:        new Date().toISOString(),
    };

    console.log(`[vets] Booking created: ${booking.id} with ${vet.name}`);
    res.status(201).json(booking);
  } catch (err) {
    console.error("[vets] POST /:id/book error:", err);
    res.status(500).json({ error: "Failed to create booking" });
  }
}) as RequestHandler);

/* ─────────────────────────────────────────────────────────────────────────
   POST /api/vets/:id/review
───────────────────────────────────────────────────────────────────────── */
router.post("/:id/review", (async (req, res) => {
  try {
    const { rating } = req.body;
    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "rating must be a number between 1 and 5" });
    }

    const vet = await Vet.findById(req.params.id);
    if (!vet) return res.status(404).json({ error: "Vet not found" });

    const newCount  = vet.reviews + 1;
    const newRating = Math.round(((vet.rating * vet.reviews + rating) / newCount) * 10) / 10;

    const updated = await Vet.findByIdAndUpdate(
      req.params.id,
      { rating: newRating, reviews: newCount },
      { new: true }
    ).lean();

    res.json({ rating: updated?.rating ?? newRating, reviews: updated?.reviews ?? newCount });
  } catch (err) {
    console.error("[vets] POST /:id/review error:", err);
    res.status(500).json({ error: "Failed to submit review" });
  }
}) as RequestHandler);

/* ─────────────────────────────────────────────────────────────────────────
   PATCH /api/vets/:id/status  — approve / reject / pend (admin)
───────────────────────────────────────────────────────────────────────── */
router.patch("/:id/status", (async (req, res) => {
  try {
    const { status } = req.body;
    if (!["approved", "rejected", "pending"].includes(status)) {
      return res.status(400).json({ error: "status must be approved, rejected, or pending" });
    }
    const vet = await Vet.findByIdAndUpdate(
      req.params.id,
      { status, verified: status === "approved" },
      { new: true }
    ).lean();
    if (!vet) return res.status(404).json({ error: "Vet not found" });
    res.json(formatVet(vet));
  } catch (err) {
    console.error("[vets] PATCH /:id/status error:", err);
    res.status(500).json({ error: "Failed to update vet status" });
  }
}) as RequestHandler);

export default router;
