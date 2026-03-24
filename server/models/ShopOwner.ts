import mongoose, { Schema, Document } from "mongoose";

export interface IShopOwner extends Document {
  // Account
  fullName: string;
  email: string;
  phone: string;
  password: string;
  clerkId: string;

  // Business
  shopName: string;
  shopType: "physical" | "online" | "both";
  gstNumber: string;
  panNumber: string;
  yearsInBusiness: number;
  website: string;
  description: string;
  tagline: string;
  logoUrl: string;
  bannerUrl: string;

  // Location
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;

  // Product Categories
  categories: string[]; // ["food", "toys", "accessories", "grooming", "medicine", "cages", "aquarium", "clothing", "supplements", "bedding", "training", "other"]
  petTypesServed: string[]; // ["dog", "cat", "bird", "fish", "reptile", "rabbit", "hamster", "other"]
  totalProducts: number;
  priceRangeMin: number;
  priceRangeMax: number;

  // Verification
  govIdType: "aadhar" | "pan" | "passport" | "driving_license";
  govIdNumber: string;
  govIdUrl: string;
  shopPhotoUrl: string;
  tradeLicenseUrl: string;

  // Operations
  deliveryAvailable: boolean;
  freeDeliveryAbove: number;
  returnPolicyDays: number;
  codAvailable: boolean;
  openingHours: string;
  closingHours: string;
  workingDays: string[];

  // Banking (for payouts)
  bankAccountName: string;
  bankAccountNumber: string;
  bankIfsc: string;
  upiId: string;

  // Social
  instagram: string;
  facebook: string;
  whatsapp: string;

  // Status
  status: "pending" | "approved" | "rejected";
  verified: boolean;
  featured: boolean;
  rating: number;
  totalOrders: number;

  createdAt: Date;
  updatedAt: Date;
}

const ShopOwnerSchema = new Schema<IShopOwner>(
  {
    fullName:  { type: String, required: true },
    email:     { type: String, required: true, unique: true },
    phone:     { type: String, required: true },
    password:  { type: String, default: "" },
    clerkId:   { type: String, default: "" },

    shopName:          { type: String, required: true },
    shopType:          { type: String, enum: ["physical", "online", "both"], default: "both" },
    gstNumber:         { type: String, default: "" },
    panNumber:         { type: String, default: "" },
    yearsInBusiness:   { type: Number, default: 0 },
    website:           { type: String, default: "" },
    description:       { type: String, required: true },
    tagline:           { type: String, default: "" },
    logoUrl:           { type: String, default: "" },
    bannerUrl:         { type: String, default: "" },

    address:  { type: String, required: true },
    city:     { type: String, required: true },
    state:    { type: String, required: true },
    pincode:  { type: String, required: true },
    country:  { type: String, default: "India" },

    categories:       [{ type: String }],
    petTypesServed:   [{ type: String }],
    totalProducts:    { type: Number, default: 0 },
    priceRangeMin:    { type: Number, default: 0 },
    priceRangeMax:    { type: Number, default: 0 },

    govIdType:       { type: String, enum: ["aadhar", "pan", "passport", "driving_license"], default: "pan" },
    govIdNumber:     { type: String, default: "" },
    govIdUrl:        { type: String, default: "" },
    shopPhotoUrl:    { type: String, default: "" },
    tradeLicenseUrl: { type: String, default: "" },

    deliveryAvailable:  { type: Boolean, default: true },
    freeDeliveryAbove:  { type: Number, default: 500 },
    returnPolicyDays:   { type: Number, default: 7 },
    codAvailable:       { type: Boolean, default: true },
    openingHours:       { type: String, default: "09:00" },
    closingHours:       { type: String, default: "21:00" },
    workingDays:        [{ type: String }],

    bankAccountName:   { type: String, default: "" },
    bankAccountNumber: { type: String, default: "" },
    bankIfsc:          { type: String, default: "" },
    upiId:             { type: String, default: "" },

    instagram: { type: String, default: "" },
    facebook:  { type: String, default: "" },
    whatsapp:  { type: String, default: "" },

    status:      { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    verified:    { type: Boolean, default: false },
    featured:    { type: Boolean, default: false },
    rating:      { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ShopOwnerSchema.index({ status: 1, rating: -1 });
ShopOwnerSchema.index({ city: 1, state: 1 });
ShopOwnerSchema.index({ email: 1 }, { unique: true });
ShopOwnerSchema.index({ categories: 1 });

export const ShopOwner =
  (mongoose.models.ShopOwner as mongoose.Model<IShopOwner>) ||
  mongoose.model<IShopOwner>("ShopOwner", ShopOwnerSchema);
