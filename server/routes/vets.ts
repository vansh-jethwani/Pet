import { Router, RequestHandler } from "express";
import { Vet } from "../models/Vet.js";
import { notifyVetBooking, notifyVetBookingUser } from "../models/Notification.js";

const router = Router();

/* ─── helpers ────────────────────────────────────────────────────────────── */
function formatVet(doc: any) {
  return {
    id:                doc._id.toString(),
    name:              doc.name,
    email:             doc.email,
    image:             doc.image,
    clerkId:           doc.clerkId ?? "",
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
   FIX: sortBy=price now sorts by minimum offered price (ignoring 0 = not offered)
─────────────────────────────────────────────────────────────────────────── */
router.get("/", (async (req, res) => {
  try {
    const { search, specialty, consultationType, maxPrice, verified, sortBy } =
      req.query as Record<string, string>;

    const query: Record<string, any> = { status: "approved" };

    if (search?.trim()) {
      const regex = { $regex: search.trim(), $options: "i" };
      query.$or = [
        { name: regex }, { specialties: regex }, { bio: regex },
        { location: regex }, { clinic: regex }, { title: regex },
      ];
    }

    if (specialty?.trim()) {
      query.specialties = { $regex: specialty.trim(), $options: "i" };
    }

    if (consultationType && consultationType !== "all") {
      query.consultationTypes = { $in: [consultationType] };
    }

    if (verified === "true") query.verified = true;

    if (maxPrice && !isNaN(parseInt(maxPrice))) {
      const max = parseInt(maxPrice);
      if (consultationType && consultationType !== "all") {
        const priceField =
          consultationType === "video"    ? "videoPrice"    :
          consultationType === "phone"    ? "phonePrice"    :
          consultationType === "inperson" ? "inpersonPrice" : null;
        if (priceField) {
          query.$and = [{ $or: [{ [priceField]: { $lte: max } }, { [priceField]: 0 }] }];
        }
      }
    }

    // FIX: price sort — sort by minimum non-zero price across all offered types
    // Previously sorted by videoPrice which put "not offered" (0) at the top
    let sortObj: Record<string, 1 | -1> = { rating: -1, createdAt: -1 };
    if (sortBy === "experience") sortObj = { experience: -1, rating: -1 };
    // For price sort we fetch all and sort in JS so we can use min(non-zero prices)
    const vets = await Vet.find(query)
      .sort(sortBy === "price" ? { rating: -1 } : sortObj)
      .lean();

    let result = vets.map(formatVet);

    if (sortBy === "price") {
      // FIX: sort by minimum price among actually-offered types (non-zero prices)
      result = result.sort((a, b) => {
        const minPrice = (v: any) => {
          const prices = v.consultationTypes
            .map((t: string) =>
              t === "video" ? v.videoPrice : t === "phone" ? v.phonePrice : v.inpersonPrice
            )
            .filter((p: number) => p > 0);
          return prices.length > 0 ? Math.min(...prices) : Infinity;
        };
        return minPrice(a) - minPrice(b);
      });
    }

    res.json(result);
  } catch (err) {
    console.error("[vets] GET / error:", err);
    res.status(500).json({ error: "Failed to fetch vets" });
  }
}) as RequestHandler);

/* ─── GET /api/vets/admin/all ─────────────────────────────────────────────── */
router.get("/admin/all", (async (_req, res) => {
  try {
    const vets = await Vet.find({}).sort({ createdAt: -1 }).lean();
    res.json(vets.map(formatVet));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch vets" });
  }
}) as RequestHandler);

/* ─── PATCH /api/vets/admin/approve-all ──────────────────────────────────── */
router.patch("/admin/approve-all", (async (_req, res) => {
  try {
    const result = await Vet.updateMany(
      { status: "pending" },
      { $set: { status: "approved", verified: true } }
    );
    res.json({ message: `Approved ${result.modifiedCount} pending vet(s).`, modifiedCount: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ error: "Failed to bulk-approve vets" });
  }
}) as RequestHandler);

/* ─── GET /api/vets/:id ───────────────────────────────────────────────────── */
router.get("/:id", (async (req, res) => {
  try {
    const vet = await Vet.findById(req.params.id).lean();
    if (!vet) return res.status(404).json({ error: "Vet not found" });
    res.json(formatVet(vet));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch vet" });
  }
}) as RequestHandler);

/* ─── POST /api/vets ──────────────────────────────────────────────────────── */
router.post("/", (async (req, res) => {
  try {
    const {
      name, email, image, clerkId,
      title, licenseNumber, experience,
      specialties, qualifications, clinic,
      consultationTypes, videoPrice, phonePrice, inpersonPrice,
      responseTime, location, bio,
    } = req.body;

    if (!name?.trim())          return res.status(400).json({ error: "name is required" });
    if (!email?.trim())         return res.status(400).json({ error: "email is required" });
    if (!licenseNumber?.trim()) return res.status(400).json({ error: "licenseNumber is required" });
    if (!location?.trim())      return res.status(400).json({ error: "location is required" });
    if (!bio?.trim())           return res.status(400).json({ error: "bio is required" });

    const existing = await Vet.findOne({ email: email.trim().toLowerCase() });
    if (existing) {
      if (clerkId && existing.clerkId === clerkId) return res.status(200).json(formatVet(existing));
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
      verified:          true,
      available:         true,
      rating:            0,
      reviews:           0,
      status:            "approved",
    });

    console.log(`[vets] New vet registered & approved: ${vet.name} <${vet.email}>`);
    res.status(201).json(formatVet(vet));
  } catch (err: any) {
    console.error("[vets] POST / error:", err);
    if (err.code === 11000) return res.status(409).json({ error: "A vet account with this email already exists" });
    res.status(500).json({ error: "Failed to create vet profile" });
  }
}) as RequestHandler);

/* ─── PATCH /api/vets/:id/availability ───────────────────────────────────── */
router.patch("/:id/availability", (async (req, res) => {
  try {
    const { available } = req.body;
    if (typeof available !== "boolean") return res.status(400).json({ error: "available must be a boolean" });
    const vet = await Vet.findByIdAndUpdate(req.params.id, { available }, { new: true }).lean();
    if (!vet) return res.status(404).json({ error: "Vet not found" });
    res.json({ available: vet.available });
  } catch (err) {
    res.status(500).json({ error: "Failed to update availability" });
  }
}) as RequestHandler);

/* ─── POST /api/vets/:id/book ─────────────────────────────────────────────── 
   FIX: now calls notifyVetBooking so the vet gets a real-time notification
   FIX: returns proper error messages instead of swallowing validation errors
─────────────────────────────────────────────────────────────────────────── */
router.post("/:id/book", (async (req, res) => {
  try {
    const vet = await Vet.findById(req.params.id).lean();
    if (!vet) return res.status(404).json({ error: "Vet not found" });
    if (!vet.available) return res.status(400).json({ error: "This vet is currently unavailable" });

    const { consultationType, petName, petType, ownerName, ownerEmail, ownerUserId, preferredDate, notes } = req.body;

    if (!consultationType)      return res.status(400).json({ error: "consultationType is required" });
    if (!ownerName?.trim())     return res.status(400).json({ error: "ownerName is required" });
    if (!ownerEmail?.trim())    return res.status(400).json({ error: "ownerEmail is required" });

    if (!vet.consultationTypes.includes(consultationType)) {
      return res.status(400).json({ error: `This vet does not offer ${consultationType} consultations` });
    }

    const priceMap: Record<string, number> = {
      video: vet.videoPrice, phone: vet.phonePrice, inperson: vet.inpersonPrice,
    };

    const booking = {
      id:               `BK-${Date.now()}`,
      vetId:            (vet as any)._id.toString(),
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

    // Notify the VET — includes preferred date in message
    if (vet.clerkId?.trim()) {
      notifyVetBooking(
        vet.clerkId,
        ownerName.trim(),
        petName || "Unknown",
        consultationType,
        preferredDate || undefined
      ).catch(console.error);
    }

    // Notify the USER who made the booking
    if (ownerUserId?.trim()) {
      notifyVetBookingUser(
        ownerUserId.trim(),
        vet.name,
        petName || "Unknown",
        consultationType,
        preferredDate || undefined
      ).catch(console.error);
    }

    console.log(`[vets] Booking created: ${booking.id} with ${vet.name}`);
    res.status(201).json(booking);
  } catch (err) {
    console.error("[vets] POST /:id/book error:", err);
    res.status(500).json({ error: "Failed to create booking" });
  }
}) as RequestHandler);

/* ─── POST /api/vets/:id/review ──────────────────────────────────────────── */
router.post("/:id/review", (async (req, res) => {
  try {
    const { rating } = req.body;
    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "rating must be between 1 and 5" });
    }
    const vet = await Vet.findById(req.params.id);
    if (!vet) return res.status(404).json({ error: "Vet not found" });

    const newCount  = vet.reviews + 1;
    const newRating = Math.round(((vet.rating * vet.reviews + rating) / newCount) * 10) / 10;

    const updated = await Vet.findByIdAndUpdate(
      req.params.id, { rating: newRating, reviews: newCount }, { new: true }
    ).lean();

    res.json({ rating: updated?.rating ?? newRating, reviews: updated?.reviews ?? newCount });
  } catch (err) {
    res.status(500).json({ error: "Failed to submit review" });
  }
}) as RequestHandler);

/* ─── PATCH /api/vets/:id/status ─────────────────────────────────────────── */
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
    res.status(500).json({ error: "Failed to update vet status" });
  }
}) as RequestHandler);

export default router;
