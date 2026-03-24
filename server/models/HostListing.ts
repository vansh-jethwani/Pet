import mongoose, { Schema, Document } from "mongoose";

export interface IReview {
  _id: mongoose.Types.ObjectId;
  reviewerName: string;
  reviewerAvatar: string;
  reviewerClerkId: string;
  rating: number; // 1–5
  comment: string;
  createdAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    reviewerName:    { type: String, required: true },
    reviewerAvatar:  { type: String, default: "🐾" },
    reviewerClerkId: { type: String, default: "" },
    rating:          { type: Number, required: true, min: 1, max: 5 },
    comment:         { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export interface IHostListing extends Document {
  // Host identity
  hostName:    string;
  hostAvatar:  string;
  hostClerkId: string;
  hostBio:     string;
  hostPhone:   string;
  hostEmail:   string;
  hostPhoto:   string;

  // Location
  city:      string;
  state:     string;
  area:      string;  // locality/area
  pincode:   string;

  // Pet preferences
  petTypes:      string[];  // dog, cat, bird, rabbit, etc.
  maxPets:       number;
  petSizeLimit:  string;    // small, medium, large, any
  acceptedBreeds: string;

  // Pricing (INR)
  pricePerDay:   number;
  pricePerMonth: number;

  // Services
  services:      string[];  // feeding, walking, grooming, training, vet-visits, 24h-care, playtime, bathing

  // Availability
  available:       boolean;
  availableFrom:   string;
  availableTo:     string;
  workingHours:    string;

  // Home details
  homeType:   string;  // flat, bungalow, villa, farm
  hasGarden:  boolean;
  hasCctv:    boolean;
  petFriendlySpace: string;

  // Extras
  yearsExperience:  number;
  languages:        string[];  // Hindi, English, Marathi, etc.
  emergencyContact: string;
  ownPets:          string;
  certifications:   string[];

  // Ratings
  rating:      number;
  totalReviews: number;
  reviews:     IReview[];

  // Status
  verified:  boolean;
  featured:  boolean;
  status:    "active" | "inactive" | "pending";

  createdAt: Date;
}

const HostListingSchema = new Schema<IHostListing>(
  {
    hostName:    { type: String, required: true },
    hostAvatar:  { type: String, default: "🧑" },
    hostClerkId: { type: String, default: "" },
    hostBio:     { type: String, required: true },
    hostPhone:   { type: String, default: "" },
    hostEmail:   { type: String, default: "" },
    hostPhoto:   { type: String, default: "" },

    city:      { type: String, required: true },
    state:     { type: String, required: true },
    area:      { type: String, default: "" },
    pincode:   { type: String, default: "" },

    petTypes:      [{ type: String }],
    maxPets:       { type: Number, default: 2 },
    petSizeLimit:  { type: String, default: "any" },
    acceptedBreeds: { type: String, default: "" },

    pricePerDay:   { type: Number, required: true },
    pricePerMonth: { type: Number, default: 0 },

    services:  [{ type: String }],

    available:       { type: Boolean, default: true },
    availableFrom:   { type: String, default: "" },
    availableTo:     { type: String, default: "" },
    workingHours:    { type: String, default: "24/7" },

    homeType:   { type: String, default: "flat" },
    hasGarden:  { type: Boolean, default: false },
    hasCctv:    { type: Boolean, default: false },
    petFriendlySpace: { type: String, default: "" },

    yearsExperience:  { type: Number, default: 0 },
    languages:        [{ type: String }],
    emergencyContact: { type: String, default: "" },
    ownPets:          { type: String, default: "" },
    certifications:   [{ type: String }],

    rating:       { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    reviews:      [ReviewSchema],

    verified:  { type: Boolean, default: false },
    featured:  { type: Boolean, default: false },
    status:    { type: String, enum: ["active","inactive","pending"], default: "active" },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

HostListingSchema.index({ city: 1, available: 1, rating: -1 });
HostListingSchema.index({ hostClerkId: 1 });
HostListingSchema.index({ petTypes: 1, city: 1 });
HostListingSchema.index({ status: 1, featured: -1, rating: -1 });

export const HostListing =
  (mongoose.models.HostListing as mongoose.Model<IHostListing>) ||
  mongoose.model<IHostListing>("HostListing", HostListingSchema);
