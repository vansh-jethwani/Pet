import mongoose, { Schema, Document } from "mongoose";

export interface IInsurancePlan extends Document {
  planId: string;
  name: string;
  tier: "basic" | "premium" | "elite";
  monthlyPrice: number;
  annualPrice: number;
  coverageLimit: number;
  deductible: number;
  features: string[];
  description: string;
  isActive: boolean;
}

export interface IInsurancePolicy extends Document {
  userId: string;
  clerkId: string;
  ownerName: string;
  ownerEmail: string;
  planId: string;
  planName: string;
  planTier: string;
  petName: string;
  petType: string;
  petBreed: string;
  petAge: number;
  petGender: "Male" | "Female";
  billingCycle: "monthly" | "annual";
  price: number;
  coverageLimit: number;
  deductible: number;
  status: "active" | "pending" | "expired" | "cancelled";
  startDate: string;
  endDate: string;
  policyNumber: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IInsuranceClaim extends Document {
  policyId: string;
  policyNumber: string;
  userId: string;
  clerkId: string;
  petName: string;
  claimType: string;
  description: string;
  amount: number;
  receipts: string[];
  status: "pending" | "under_review" | "approved" | "rejected";
  submittedAt: Date;
  resolvedAt?: Date;
  notes?: string;
}

const InsurancePlanSchema = new Schema<IInsurancePlan>({
  planId:         { type: String, required: true, unique: true },
  name:           { type: String, required: true },
  tier:           { type: String, enum: ["basic", "premium", "elite"], required: true },
  monthlyPrice:   { type: Number, required: true },
  annualPrice:    { type: Number, required: true },
  coverageLimit:  { type: Number, required: true },
  deductible:     { type: Number, required: true },
  features:       [{ type: String }],
  description:    { type: String, required: true },
  isActive:       { type: Boolean, default: true },
});

const InsurancePolicySchema = new Schema<IInsurancePolicy>(
  {
    userId:        { type: String, required: true },
    clerkId:       { type: String, required: true },
    ownerName:     { type: String, required: true },
    ownerEmail:    { type: String, required: true },
    planId:        { type: String, required: true },
    planName:      { type: String, required: true },
    planTier:      { type: String, required: true },
    petName:       { type: String, required: true },
    petType:       { type: String, required: true },
    petBreed:      { type: String, default: "" },
    petAge:        { type: Number, required: true },
    petGender:     { type: String, enum: ["Male", "Female"], required: true },
    billingCycle:  { type: String, enum: ["monthly", "annual"], required: true },
    price:         { type: Number, required: true },
    coverageLimit: { type: Number, required: true },
    deductible:    { type: Number, required: true },
    status:        { type: String, enum: ["active", "pending", "expired", "cancelled"], default: "active" },
    startDate:     { type: String, required: true },
    endDate:       { type: String, required: true },
    policyNumber:  { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

const InsuranceClaimSchema = new Schema<IInsuranceClaim>(
  {
    policyId:     { type: String, required: true },
    policyNumber: { type: String, required: true },
    userId:       { type: String, required: true },
    clerkId:      { type: String, required: true },
    petName:      { type: String, required: true },
    claimType:    { type: String, required: true },
    description:  { type: String, required: true },
    amount:       { type: Number, required: true },
    receipts:     [{ type: String }],
    status:       { type: String, enum: ["pending", "under_review", "approved", "rejected"], default: "pending" },
    submittedAt:  { type: Date, default: Date.now },
    resolvedAt:   { type: Date },
    notes:        { type: String },
  },
  { timestamps: true }
);

InsurancePolicySchema.index({ clerkId: 1, status: 1 });
InsurancePolicySchema.index({ policyNumber: 1 });
InsuranceClaimSchema.index({ clerkId: 1 });
InsuranceClaimSchema.index({ policyId: 1 });

export const InsurancePlan =
  (mongoose.models.InsurancePlan as mongoose.Model<IInsurancePlan>) ||
  mongoose.model<IInsurancePlan>("InsurancePlan", InsurancePlanSchema);

export const InsurancePolicy =
  (mongoose.models.InsurancePolicy as mongoose.Model<IInsurancePolicy>) ||
  mongoose.model<IInsurancePolicy>("InsurancePolicy", InsurancePolicySchema);

export const InsuranceClaim =
  (mongoose.models.InsuranceClaim as mongoose.Model<IInsuranceClaim>) ||
  mongoose.model<IInsuranceClaim>("InsuranceClaim", InsuranceClaimSchema);
