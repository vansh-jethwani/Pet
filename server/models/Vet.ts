import mongoose, { Schema, Document } from "mongoose";

export interface IVet extends Document {
  // Account
  name: string;
  email: string;
  image: string;
  clerkId: string;

  // Professional
  title: string;
  licenseNumber: string;
  experience: number;
  specialties: string[];
  qualifications: string;
  clinic: string;

  // Consultation
  consultationTypes: ("video" | "phone" | "inperson")[];
  videoPrice: number;
  phonePrice: number;
  inpersonPrice: number;
  responseTime: string;
  location: string;
  bio: string;

  // Status
  verified: boolean;
  available: boolean;
  rating: number;
  reviews: number;
  // FIX: default changed from "pending" → "approved" so vets appear immediately
  status: "pending" | "approved" | "rejected";

  createdAt: Date;
  updatedAt: Date;
}

const VetSchema = new Schema<IVet>(
  {
    name:          { type: String, required: true },
    email:         { type: String, required: true, unique: true },
    image:         { type: String, default: "👨‍⚕️" },
    clerkId:       { type: String, default: "" },

    title:         { type: String, required: true, default: "DVM" },
    licenseNumber: { type: String, required: true },
    experience:    { type: Number, required: true, default: 0 },
    specialties:   [{ type: String }],
    qualifications:{ type: String, default: "" },
    clinic:        { type: String, default: "" },

    consultationTypes: [{ type: String, enum: ["video", "phone", "inperson"] }],
    videoPrice:    { type: Number, default: 0 },
    phonePrice:    { type: Number, default: 0 },
    inpersonPrice: { type: Number, default: 0 },
    responseTime:  { type: String, default: "1–2 hours" },
    location:      { type: String, required: true },
    bio:           { type: String, required: true },

    verified:  { type: Boolean, default: false },
    available: { type: Boolean, default: true },
    rating:    { type: Number,  default: 0 },
    reviews:   { type: Number,  default: 0 },

    // FIX: default is now "approved" — vets are visible right after signup.
    // Change to "pending" later if you want a manual review step.
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved",
    },
  },
  { timestamps: true }
);

// Index for fast listing queries
VetSchema.index({ status: 1, rating: -1 });
VetSchema.index({ status: 1, experience: -1 });
VetSchema.index({ status: 1, available: 1 });
VetSchema.index({ email: 1 }, { unique: true });

export const Vet =
  (mongoose.models.Vet as mongoose.Model<IVet>) ||
  mongoose.model<IVet>("Vet", VetSchema);
