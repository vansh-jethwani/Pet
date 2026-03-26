import { Router, RequestHandler } from "express";
import {
  InsurancePlan,
  InsurancePolicy,
  InsuranceClaim,
} from "../models/Insurance.js";

const router = Router();

// ─── Seed default plans if none exist ─────────────────────────────────────────
async function seedPlans() {
  const count = await InsurancePlan.countDocuments();
  if (count > 0) return;
  await InsurancePlan.insertMany([
    {
      planId:        "basic-care",
      name:          "Basic Care",
      tier:          "basic",
      monthlyPrice:  15,
      annualPrice:   150,
      coverageLimit: 5000,
      deductible:    250,
      description:   "Essential coverage for accidents and illnesses",
      features: [
        "Accident & Illness coverage",
        "Up to ₹5,000 annual limit",
        "₹250 deductible",
        "24/7 customer support",
        "Covers vet visits up to ₹300",
      ],
    },
    {
      planId:        "premium-coverage",
      name:          "Premium Coverage",
      tier:          "premium",
      monthlyPrice:  35,
      annualPrice:   350,
      coverageLimit: 15000,
      deductible:    100,
      description:   "Comprehensive coverage for peace of mind",
      features: [
        "Accident & Illness coverage",
        "Up to ₹15,000 annual limit",
        "₹100 deductible",
        "Covers hereditary conditions",
        "Covers chronic conditions",
        "Wellness visits included",
        "24/7 customer support",
        "Direct vet payments",
      ],
    },
    {
      planId:        "elite-plus",
      name:          "Elite Plus",
      tier:          "elite",
      monthlyPrice:  55,
      annualPrice:   550,
      coverageLimit: 30000,
      deductible:    50,
      description:   "Maximum coverage with all benefits included",
      features: [
        "Accident & Illness coverage",
        "Up to ₹30,000 annual limit",
        "₹50 deductible",
        "Covers hereditary conditions",
        "Covers chronic conditions",
        "Wellness visits included",
        "Dental & Vision coverage",
        "Behavioral therapy",
        "Prescription medications",
        "24/7 emergency hotline",
        "Direct vet payments",
        "Nationwide coverage",
      ],
    },
  ]);
}

// ─── GET /api/insurance/plans ──────────────────────────────────────────────────
router.get("/plans", (async (_req, res) => {
  try {
    await seedPlans();
    const plans = await InsurancePlan.find({ isActive: true }).lean();
    res.json(plans);
  } catch (err) {
    console.error("[insurance] GET /plans error:", err);
    res.status(500).json({ error: "Failed to fetch plans" });
  }
}) as RequestHandler);

// ─── GET /api/insurance/policies?clerkId=xxx ──────────────────────────────────
router.get("/policies", (async (req, res) => {
  try {
    const { clerkId } = req.query as Record<string, string>;
    if (!clerkId) return res.status(400).json({ error: "clerkId required" });
    const policies = await InsurancePolicy.find({ clerkId }).sort({ createdAt: -1 }).lean();
    res.json(policies.map(formatPolicy));
  } catch (err) {
    console.error("[insurance] GET /policies error:", err);
    res.status(500).json({ error: "Failed to fetch policies" });
  }
}) as RequestHandler);

// ─── POST /api/insurance/policies ─────────────────────────────────────────────
router.post("/policies", (async (req, res) => {
  try {
    const {
      clerkId, ownerName, ownerEmail,
      planId, petName, petType, petBreed, petAge, petGender,
      billingCycle,
    } = req.body;

    if (!clerkId?.trim()) return res.status(400).json({ error: "clerkId required" });
    if (!ownerName?.trim()) return res.status(400).json({ error: "ownerName required" });
    if (!ownerEmail?.trim()) return res.status(400).json({ error: "ownerEmail required" });
    if (!planId?.trim()) return res.status(400).json({ error: "planId required" });
    if (!petName?.trim()) return res.status(400).json({ error: "petName required" });
    if (!petType?.trim()) return res.status(400).json({ error: "petType required" });
    if (!petAge) return res.status(400).json({ error: "petAge required" });

    const plan = await InsurancePlan.findOne({ planId }).lean();
    if (!plan) return res.status(404).json({ error: "Plan not found" });

    const price = billingCycle === "annual"
      ? Math.floor(plan.annualPrice / 12)
      : plan.monthlyPrice;

    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);

    const policyNumber = `PM-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const policy = await InsurancePolicy.create({
      userId:        clerkId,
      clerkId:       clerkId.trim(),
      ownerName:     ownerName.trim(),
      ownerEmail:    ownerEmail.trim(),
      planId:        plan.planId,
      planName:      plan.name,
      planTier:      plan.tier,
      petName:       petName.trim(),
      petType:       petType.trim(),
      petBreed:      petBreed?.trim() || "",
      petAge:        parseInt(petAge) || 1,
      petGender:     petGender || "Male",
      billingCycle:  billingCycle || "monthly",
      price,
      coverageLimit: plan.coverageLimit,
      deductible:    plan.deductible,
      status:        "active",
      startDate:     startDate.toISOString(),
      endDate:       endDate.toISOString(),
      policyNumber,
    });

    res.status(201).json(formatPolicy(policy));
  } catch (err: any) {
    console.error("[insurance] POST /policies error:", err);
    if (err.code === 11000) return res.status(409).json({ error: "Policy already exists" });
    res.status(500).json({ error: "Failed to create policy" });
  }
}) as RequestHandler);

// ─── PATCH /api/insurance/policies/:id/cancel ─────────────────────────────────
router.patch("/policies/:id/cancel", (async (req, res) => {
  try {
    const { clerkId } = req.body;
    if (!clerkId) return res.status(400).json({ error: "clerkId required" });
    const policy = await InsurancePolicy.findOneAndUpdate(
      { _id: req.params.id, clerkId },
      { status: "cancelled" },
      { new: true }
    ).lean();
    if (!policy) return res.status(404).json({ error: "Policy not found" });
    res.json(formatPolicy(policy));
  } catch (err) {
    console.error("[insurance] PATCH /policies/:id/cancel error:", err);
    res.status(500).json({ error: "Failed to cancel policy" });
  }
}) as RequestHandler);

// ─── PATCH /api/insurance/policies/:id/renew ──────────────────────────────────
router.patch("/policies/:id/renew", (async (req, res) => {
  try {
    const { clerkId } = req.body;
    if (!clerkId) return res.status(400).json({ error: "clerkId required" });

    const newEnd = new Date();
    newEnd.setFullYear(newEnd.getFullYear() + 1);

    const policy = await InsurancePolicy.findOneAndUpdate(
      { _id: req.params.id, clerkId },
      { status: "active", endDate: newEnd.toISOString(), startDate: new Date().toISOString() },
      { new: true }
    ).lean();
    if (!policy) return res.status(404).json({ error: "Policy not found" });
    res.json(formatPolicy(policy));
  } catch (err) {
    console.error("[insurance] PATCH /policies/:id/renew error:", err);
    res.status(500).json({ error: "Failed to renew policy" });
  }
}) as RequestHandler);

// ─── GET /api/insurance/claims?clerkId=xxx ────────────────────────────────────
router.get("/claims", (async (req, res) => {
  try {
    const { clerkId } = req.query as Record<string, string>;
    if (!clerkId) return res.status(400).json({ error: "clerkId required" });
    const claims = await InsuranceClaim.find({ clerkId }).sort({ submittedAt: -1 }).lean();
    res.json(claims.map(formatClaim));
  } catch (err) {
    console.error("[insurance] GET /claims error:", err);
    res.status(500).json({ error: "Failed to fetch claims" });
  }
}) as RequestHandler);

// ─── POST /api/insurance/claims ───────────────────────────────────────────────
router.post("/claims", (async (req, res) => {
  try {
    const { clerkId, policyId, policyNumber, petName, claimType, description, amount } = req.body;
    if (!clerkId?.trim()) return res.status(400).json({ error: "clerkId required" });
    if (!policyId?.trim()) return res.status(400).json({ error: "policyId required" });
    if (!claimType?.trim()) return res.status(400).json({ error: "claimType required" });
    if (!description?.trim()) return res.status(400).json({ error: "description required" });
    if (!amount || isNaN(Number(amount))) return res.status(400).json({ error: "Valid amount required" });

    // Verify policy belongs to user and is active
    const policy = await InsurancePolicy.findOne({ _id: policyId, clerkId, status: "active" }).lean();
    if (!policy) return res.status(404).json({ error: "Active policy not found" });

    const claim = await InsuranceClaim.create({
      policyId,
      policyNumber: policyNumber || policy.policyNumber,
      userId:       clerkId,
      clerkId:      clerkId.trim(),
      petName:      petName || policy.petName,
      claimType:    claimType.trim(),
      description:  description.trim(),
      amount:       parseFloat(amount),
      status:       "pending",
      submittedAt:  new Date(),
    });

    res.status(201).json(formatClaim(claim));
  } catch (err) {
    console.error("[insurance] POST /claims error:", err);
    res.status(500).json({ error: "Failed to submit claim" });
  }
}) as RequestHandler);

// ─── Formatters ───────────────────────────────────────────────────────────────
function formatPolicy(doc: any) {
  return {
    id:            doc._id?.toString() ?? "",
    userId:        doc.userId        ?? "",
    clerkId:       doc.clerkId       ?? "",
    ownerName:     doc.ownerName     ?? "",
    ownerEmail:    doc.ownerEmail    ?? "",
    planId:        doc.planId        ?? "",
    planName:      doc.planName      ?? "",
    planTier:      doc.planTier      ?? "",
    petName:       doc.petName       ?? "",
    petType:       doc.petType       ?? "",
    petBreed:      doc.petBreed      ?? "",
    petAge:        doc.petAge        ?? 0,
    petGender:     doc.petGender     ?? "Male",
    billingCycle:  doc.billingCycle  ?? "monthly",
    price:         doc.price         ?? 0,
    coverageLimit: doc.coverageLimit ?? 0,
    deductible:    doc.deductible    ?? 0,
    status:        doc.status        ?? "active",
    startDate:     doc.startDate     ?? "",
    endDate:       doc.endDate       ?? "",
    policyNumber:  doc.policyNumber  ?? "",
    createdAt:     doc.createdAt instanceof Date ? doc.createdAt.toISOString() : doc.createdAt ?? "",
  };
}

function formatClaim(doc: any) {
  return {
    id:           doc._id?.toString() ?? "",
    policyId:     doc.policyId      ?? "",
    policyNumber: doc.policyNumber  ?? "",
    userId:       doc.userId        ?? "",
    clerkId:      doc.clerkId       ?? "",
    petName:      doc.petName       ?? "",
    claimType:    doc.claimType     ?? "",
    description:  doc.description   ?? "",
    amount:       doc.amount        ?? 0,
    status:       doc.status        ?? "pending",
    submittedAt:  doc.submittedAt instanceof Date ? doc.submittedAt.toISOString() : doc.submittedAt ?? "",
    resolvedAt:   doc.resolvedAt    ?? null,
    notes:        doc.notes         ?? "",
  };
}

export default router;
