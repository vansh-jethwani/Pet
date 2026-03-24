import { Router, RequestHandler } from "express";
import { PetSeller }  from "../models/PetSeller.js";
import { ShopOwner }  from "../models/ShopOwner.js";

const router = Router();

/* ─── helpers ─────────────────────────────────────────────────────────────── */
function formatPetSeller(doc: any) {
  return {
    id:                       doc._id.toString(),
    fullName:                 doc.fullName,
    email:                    doc.email,
    phone:                    doc.phone,
    clerkId:                  doc.clerkId ?? "",
    businessName:             doc.businessName,
    sellerType:               doc.sellerType,
    licenseNumber:            doc.licenseNumber ?? "",
    yearsInBusiness:          doc.yearsInBusiness,
    website:                  doc.website ?? "",
    description:              doc.description,
    address:                  doc.address,
    city:                     doc.city,
    state:                    doc.state,
    pincode:                  doc.pincode,
    country:                  doc.country,
    petTypes:                 doc.petTypes ?? [],
    breeds:                   doc.breeds ?? [],
    averagePetsPerMonth:      doc.averagePetsPerMonth,
    govIdType:                doc.govIdType,
    govIdNumber:              doc.govIdNumber ?? "",
    govIdUrl:                 doc.govIdUrl ?? "",
    sellerPhotoUrl:           doc.sellerPhotoUrl ?? "",
    returnPolicy:             doc.returnPolicy ?? "",
    deliveryAvailable:        doc.deliveryAvailable,
    deliveryRadius:           doc.deliveryRadius,
    healthCertificateProvided:doc.healthCertificateProvided,
    vaccinationIncluded:      doc.vaccinationIncluded,
    status:                   doc.status,
    verified:                 doc.verified,
    rating:                   doc.rating,
    totalSales:               doc.totalSales,
    instagram:                doc.instagram ?? "",
    facebook:                 doc.facebook ?? "",
    createdAt:                doc.createdAt,
  };
}

function formatShopOwner(doc: any) {
  return {
    id:               doc._id.toString(),
    fullName:         doc.fullName,
    email:            doc.email,
    phone:            doc.phone,
    clerkId:          doc.clerkId ?? "",
    shopName:         doc.shopName,
    shopType:         doc.shopType,
    gstNumber:        doc.gstNumber ?? "",
    panNumber:        doc.panNumber ?? "",
    yearsInBusiness:  doc.yearsInBusiness,
    website:          doc.website ?? "",
    description:      doc.description,
    tagline:          doc.tagline ?? "",
    logoUrl:          doc.logoUrl ?? "",
    bannerUrl:        doc.bannerUrl ?? "",
    address:          doc.address,
    city:             doc.city,
    state:            doc.state,
    pincode:          doc.pincode,
    country:          doc.country,
    categories:       doc.categories ?? [],
    petTypesServed:   doc.petTypesServed ?? [],
    totalProducts:    doc.totalProducts,
    priceRangeMin:    doc.priceRangeMin,
    priceRangeMax:    doc.priceRangeMax,
    govIdType:        doc.govIdType,
    govIdNumber:      doc.govIdNumber ?? "",
    govIdUrl:         doc.govIdUrl ?? "",
    shopPhotoUrl:     doc.shopPhotoUrl ?? "",
    tradeLicenseUrl:  doc.tradeLicenseUrl ?? "",
    deliveryAvailable:doc.deliveryAvailable,
    freeDeliveryAbove:doc.freeDeliveryAbove,
    returnPolicyDays: doc.returnPolicyDays,
    codAvailable:     doc.codAvailable,
    openingHours:     doc.openingHours,
    closingHours:     doc.closingHours,
    workingDays:      doc.workingDays ?? [],
    bankAccountName:  doc.bankAccountName ?? "",
    bankIfsc:         doc.bankIfsc ?? "",
    upiId:            doc.upiId ?? "",
    instagram:        doc.instagram ?? "",
    facebook:         doc.facebook ?? "",
    whatsapp:         doc.whatsapp ?? "",
    status:           doc.status,
    verified:         doc.verified,
    featured:         doc.featured,
    rating:           doc.rating,
    totalOrders:      doc.totalOrders,
    createdAt:        doc.createdAt,
  };
}

/* ══════════════════════════════════════════════════════════════════════════
   PET SELLER ROUTES
══════════════════════════════════════════════════════════════════════════ */

// GET /api/sellers/pets  — list all approved pet sellers
router.get("/pets", (async (req, res) => {
  try {
    const { city, state, petType, status = "approved" } = req.query as Record<string, string>;
    const query: Record<string, any> = { status };
    if (city)    query.city    = { $regex: city,    $options: "i" };
    if (state)   query.state   = { $regex: state,   $options: "i" };
    if (petType) query.petTypes = { $in: [petType] };

    const sellers = await PetSeller.find(query).sort({ rating: -1, createdAt: -1 }).lean();
    res.json(sellers.map(formatPetSeller));
  } catch (err) {
    console.error("[sellers] GET /pets error:", err);
    res.status(500).json({ error: "Failed to fetch pet sellers" });
  }
}) as RequestHandler);

// GET /api/sellers/pets/:id
router.get("/pets/:id", (async (req, res) => {
  try {
    const seller = await PetSeller.findById(req.params.id).lean();
    if (!seller) return res.status(404).json({ error: "Pet seller not found" });
    res.json(formatPetSeller(seller));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch pet seller" });
  }
}) as RequestHandler);

// POST /api/sellers/pets  — register a new pet seller
router.post("/pets", (async (req, res) => {
  try {
    const body = req.body;

    // Required field validation
    const required = ["fullName", "email", "phone", "businessName", "description", "address", "city", "state", "pincode"];
    for (const field of required) {
      if (!body[field]?.toString().trim()) {
        return res.status(400).json({ error: `${field} is required` });
      }
    }

    // Email uniqueness check
    const existing = await PetSeller.findOne({ email: body.email.trim().toLowerCase() });
    if (existing) {
      if (body.clerkId && existing.clerkId === body.clerkId) {
        return res.status(200).json(formatPetSeller(existing));
      }
      return res.status(409).json({ error: "A pet seller account with this email already exists" });
    }

    const seller = await PetSeller.create({
      fullName:                  body.fullName.trim(),
      email:                     body.email.trim().toLowerCase(),
      phone:                     body.phone.trim(),
      clerkId:                   body.clerkId ?? "",
      businessName:              body.businessName.trim(),
      sellerType:                body.sellerType ?? "individual",
      licenseNumber:             body.licenseNumber ?? "",
      yearsInBusiness:           parseInt(body.yearsInBusiness) || 0,
      website:                   body.website ?? "",
      description:               body.description.trim(),
      address:                   body.address.trim(),
      city:                      body.city.trim(),
      state:                     body.state.trim(),
      pincode:                   body.pincode.trim(),
      country:                   body.country ?? "India",
      petTypes:                  Array.isArray(body.petTypes) ? body.petTypes : [],
      breeds:                    Array.isArray(body.breeds) ? body.breeds : [],
      averagePetsPerMonth:       parseInt(body.averagePetsPerMonth) || 0,
      govIdType:                 body.govIdType ?? "aadhar",
      govIdNumber:               body.govIdNumber ?? "",
      govIdUrl:                  body.govIdUrl ?? "",
      sellerPhotoUrl:            body.sellerPhotoUrl ?? "",
      returnPolicy:              body.returnPolicy ?? "",
      deliveryAvailable:         body.deliveryAvailable ?? false,
      deliveryRadius:            parseInt(body.deliveryRadius) || 0,
      healthCertificateProvided: body.healthCertificateProvided ?? false,
      vaccinationIncluded:       body.vaccinationIncluded ?? false,
      instagram:                 body.instagram ?? "",
      facebook:                  body.facebook ?? "",
      status:                    "pending",
      verified:                  false,
    });

    console.log(`[sellers] New pet seller registered: ${seller.businessName} <${seller.email}>`);
    res.status(201).json(formatPetSeller(seller));
  } catch (err: any) {
    console.error("[sellers] POST /pets error:", err);
    if (err.code === 11000) return res.status(409).json({ error: "Email already registered" });
    res.status(500).json({ error: "Failed to register pet seller" });
  }
}) as RequestHandler);

// PATCH /api/sellers/pets/:id/status — admin approve/reject
router.patch("/pets/:id/status", (async (req, res) => {
  try {
    const { status } = req.body;
    if (!["approved", "rejected", "pending"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    const seller = await PetSeller.findByIdAndUpdate(
      req.params.id,
      { status, verified: status === "approved" },
      { new: true }
    ).lean();
    if (!seller) return res.status(404).json({ error: "Not found" });
    res.json(formatPetSeller(seller));
  } catch (err) {
    res.status(500).json({ error: "Failed to update status" });
  }
}) as RequestHandler);

/* ══════════════════════════════════════════════════════════════════════════
   SHOP OWNER ROUTES
══════════════════════════════════════════════════════════════════════════ */

// GET /api/sellers/shops  — list all approved shops
router.get("/shops", (async (req, res) => {
  try {
    const { city, category, petType, status = "approved" } = req.query as Record<string, string>;
    const query: Record<string, any> = { status };
    if (city)     query.city           = { $regex: city,     $options: "i" };
    if (category) query.categories     = { $in: [category] };
    if (petType)  query.petTypesServed = { $in: [petType]  };

    const shops = await ShopOwner.find(query).sort({ featured: -1, rating: -1, createdAt: -1 }).lean();
    res.json(shops.map(formatShopOwner));
  } catch (err) {
    console.error("[sellers] GET /shops error:", err);
    res.status(500).json({ error: "Failed to fetch shops" });
  }
}) as RequestHandler);

// GET /api/sellers/shops/:id
router.get("/shops/:id", (async (req, res) => {
  try {
    const shop = await ShopOwner.findById(req.params.id).lean();
    if (!shop) return res.status(404).json({ error: "Shop not found" });
    res.json(formatShopOwner(shop));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch shop" });
  }
}) as RequestHandler);

// POST /api/sellers/shops  — register a new shop owner
router.post("/shops", (async (req, res) => {
  try {
    const body = req.body;

    const required = ["fullName", "email", "phone", "shopName", "description", "address", "city", "state", "pincode"];
    for (const field of required) {
      if (!body[field]?.toString().trim()) {
        return res.status(400).json({ error: `${field} is required` });
      }
    }

    const existing = await ShopOwner.findOne({ email: body.email.trim().toLowerCase() });
    if (existing) {
      if (body.clerkId && existing.clerkId === body.clerkId) {
        return res.status(200).json(formatShopOwner(existing));
      }
      return res.status(409).json({ error: "A shop account with this email already exists" });
    }

    const shop = await ShopOwner.create({
      fullName:         body.fullName.trim(),
      email:            body.email.trim().toLowerCase(),
      phone:            body.phone.trim(),
      clerkId:          body.clerkId ?? "",
      shopName:         body.shopName.trim(),
      shopType:         body.shopType ?? "both",
      gstNumber:        body.gstNumber ?? "",
      panNumber:        body.panNumber ?? "",
      yearsInBusiness:  parseInt(body.yearsInBusiness) || 0,
      website:          body.website ?? "",
      description:      body.description.trim(),
      tagline:          body.tagline ?? "",
      logoUrl:          body.logoUrl ?? "",
      bannerUrl:        body.bannerUrl ?? "",
      address:          body.address.trim(),
      city:             body.city.trim(),
      state:            body.state.trim(),
      pincode:          body.pincode.trim(),
      country:          body.country ?? "India",
      categories:       Array.isArray(body.categories)     ? body.categories     : [],
      petTypesServed:   Array.isArray(body.petTypesServed) ? body.petTypesServed : [],
      totalProducts:    parseInt(body.totalProducts) || 0,
      priceRangeMin:    parseInt(body.priceRangeMin) || 0,
      priceRangeMax:    parseInt(body.priceRangeMax) || 0,
      govIdType:        body.govIdType ?? "pan",
      govIdNumber:      body.govIdNumber ?? "",
      govIdUrl:         body.govIdUrl ?? "",
      shopPhotoUrl:     body.shopPhotoUrl ?? "",
      tradeLicenseUrl:  body.tradeLicenseUrl ?? "",
      deliveryAvailable:body.deliveryAvailable ?? true,
      freeDeliveryAbove:parseInt(body.freeDeliveryAbove) || 500,
      returnPolicyDays: parseInt(body.returnPolicyDays) || 7,
      codAvailable:     body.codAvailable ?? true,
      openingHours:     body.openingHours ?? "09:00",
      closingHours:     body.closingHours ?? "21:00",
      workingDays:      Array.isArray(body.workingDays) ? body.workingDays : ["Mon","Tue","Wed","Thu","Fri","Sat"],
      bankAccountName:  body.bankAccountName ?? "",
      bankAccountNumber:body.bankAccountNumber ?? "",
      bankIfsc:         body.bankIfsc ?? "",
      upiId:            body.upiId ?? "",
      instagram:        body.instagram ?? "",
      facebook:         body.facebook ?? "",
      whatsapp:         body.whatsapp ?? "",
      status:           "pending",
      verified:         false,
      featured:         false,
    });

    console.log(`[sellers] New shop registered: ${shop.shopName} <${shop.email}>`);
    res.status(201).json(formatShopOwner(shop));
  } catch (err: any) {
    console.error("[sellers] POST /shops error:", err);
    if (err.code === 11000) return res.status(409).json({ error: "Email already registered" });
    res.status(500).json({ error: "Failed to register shop" });
  }
}) as RequestHandler);

// PATCH /api/sellers/shops/:id/status
router.patch("/shops/:id/status", (async (req, res) => {
  try {
    const { status } = req.body;
    if (!["approved", "rejected", "pending"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    const shop = await ShopOwner.findByIdAndUpdate(
      req.params.id,
      { status, verified: status === "approved" },
      { new: true }
    ).lean();
    if (!shop) return res.status(404).json({ error: "Not found" });
    res.json(formatShopOwner(shop));
  } catch (err) {
    res.status(500).json({ error: "Failed to update status" });
  }
}) as RequestHandler);

export default router;
