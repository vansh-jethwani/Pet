import mongoose, { Schema, Document } from "mongoose";

export interface IPetSeller extends Document {
  // Account
  fullName: string;
  email: string;
  phone: string;
  password: string; // hashed
  clerkId: string;

  // Business Identity
  businessName: string;
  sellerType: "individual" | "breeder" | "rescue" | "shelter";
  licenseNumber: string;
  yearsInBusiness: number;
  website: string;
  description: string;

  // Location
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;

  // Pet Specialties
  petTypes: string[]; // ["dog", "cat", "bird", "fish", "reptile", "rabbit", "other"]
  breeds: string[];
  averagePetsPerMonth: number;

  // Verification
  govIdType: "aadhar" | "pan" | "passport" | "driving_license";
  govIdNumber: string;
  govIdUrl: string;
  sellerPhotoUrl: string;

  // Policies
  returnPolicy: string;
  deliveryAvailable: boolean;
  deliveryRadius: number; // km
  healthCertificateProvided: boolean;
  vaccinationIncluded: boolean;

  // Status
  status: "pending" | "approved" | "rejected";
  verified: boolean;
  rating: number;
  totalSales: number;

  // Social / Contact
  instagram: string;
  facebook: string;

  createdAt: Date;
  updatedAt: Date;
}

const PetSellerSchema = new Schema<IPetSeller>(
  {
    fullName:     { type: String, required: true },
    email:        { type: String, required: true, unique: true },
    phone:        { type: String, required: true },
    password:     { type: String, default: "" },
    clerkId:      { type: String, default: "" },

    businessName:        { type: String, required: true },
    sellerType:          { type: String, enum: ["individual", "breeder", "rescue", "shelter"], default: "individual" },
    licenseNumber:       { type: String, default: "" },
    yearsInBusiness:     { type: Number, default: 0 },
    website:             { type: String, default: "" },
    description:         { type: String, required: true },

    address:  { type: String, required: true },
    city:     { type: String, required: true },
    state:    { type: String, required: true },
    pincode:  { type: String, required: true },
    country:  { type: String, default: "India" },

    petTypes:             [{ type: String }],
    breeds:               [{ type: String }],
    averagePetsPerMonth:  { type: Number, default: 0 },

    govIdType:   { type: String, enum: ["aadhar", "pan", "passport", "driving_license"], default: "aadhar" },
    govIdNumber: { type: String, default: "" },
    govIdUrl:    { type: String, default: "" },
    sellerPhotoUrl: { type: String, default: "" },

    returnPolicy:             { type: String, default: "" },
    deliveryAvailable:        { type: Boolean, default: false },
    deliveryRadius:           { type: Number, default: 0 },
    healthCertificateProvided:{ type: Boolean, default: false },
    vaccinationIncluded:      { type: Boolean, default: false },

    status:     { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    verified:   { type: Boolean, default: false },
    rating:     { type: Number, default: 0 },
    totalSales: { type: Number, default: 0 },

    instagram: { type: String, default: "" },
    facebook:  { type: String, default: "" },
  },
  { timestamps: true }
);

PetSellerSchema.index({ status: 1, rating: -1 });
PetSellerSchema.index({ city: 1, state: 1 });
PetSellerSchema.index({ email: 1 }, { unique: true });

export const PetSeller =
  (mongoose.models.PetSeller as mongoose.Model<IPetSeller>) ||
  mongoose.model<IPetSeller>("PetSeller", PetSellerSchema);
