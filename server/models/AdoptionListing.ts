import mongoose, { Schema, Document } from "mongoose";

export interface IAdoptionApplication {
  _id: mongoose.Types.ObjectId;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  applicantClerkId: string;
  message: string;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
}

const ApplicationSchema = new Schema<IAdoptionApplication>(
  {
    applicantName:     { type: String, required: true },
    applicantEmail:    { type: String, required: true },
    applicantPhone:    { type: String, default: "" },
    applicantClerkId:  { type: String, default: "" },
    message:           { type: String, default: "" },
    status:            { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export interface IAdoptionListing extends Document {
  // Pet info
  petName:        string;
  species:        "dog" | "cat" | "bird" | "rabbit" | "fish" | "reptile" | "hamster" | "other";
  breed:          string;
  age:            number;
  ageUnit:        "months" | "years";
  gender:         "male" | "female";
  color:          string;
  weight:         string;
  photo:          string;
  description:    string;
  traits:         string[];

  // Health
  vaccinated:     boolean;
  neutered:       boolean;
  microchipped:   boolean;
  healthNotes:    string;

  // Listing
  listingType:    "adopt" | "sell";
  price:          number;      // 0 = free / adoption fee
  adoptionFee:    number;
  location:       string;
  city:           string;
  state:          string;

  // Owner info
  ownerName:      string;
  ownerClerkId:   string;
  ownerEmail:     string;
  ownerPhone:     string;
  ownerAvatar:    string;
  shelterOrg:     string;      // if from shelter

  // Status
  status:         "available" | "adopted" | "pending" | "sold";
  featured:       boolean;
  applications:   IAdoptionApplication[];

  createdAt:      Date;
  updatedAt:      Date;
}

const AdoptionListingSchema = new Schema<IAdoptionListing>(
  {
    petName:     { type: String, required: true },
    species:     { type: String, required: true, enum: ["dog","cat","bird","rabbit","fish","reptile","hamster","other"] },
    breed:       { type: String, required: true },
    age:         { type: Number, required: true },
    ageUnit:     { type: String, enum: ["months","years"], default: "years" },
    gender:      { type: String, required: true, enum: ["male","female"] },
    color:       { type: String, default: "" },
    weight:      { type: String, default: "" },
    photo:       { type: String, required: true },
    description: { type: String, required: true },
    traits:      [{ type: String }],

    vaccinated:    { type: Boolean, default: false },
    neutered:      { type: Boolean, default: false },
    microchipped:  { type: Boolean, default: false },
    healthNotes:   { type: String, default: "" },

    listingType:  { type: String, enum: ["adopt","sell"], default: "adopt" },
    price:        { type: Number, default: 0 },
    adoptionFee:  { type: Number, default: 0 },
    location:     { type: String, required: true },
    city:         { type: String, required: true },
    state:        { type: String, required: true },

    ownerName:     { type: String, required: true },
    ownerClerkId:  { type: String, default: "" },
    ownerEmail:    { type: String, default: "" },
    ownerPhone:    { type: String, default: "" },
    ownerAvatar:   { type: String, default: "🐾" },
    shelterOrg:    { type: String, default: "" },

    status:    { type: String, enum: ["available","adopted","pending","sold"], default: "available" },
    featured:  { type: Boolean, default: false },
    applications: [ApplicationSchema],
  },
  { timestamps: true }
);

AdoptionListingSchema.index({ species: 1, status: 1, createdAt: -1 });
AdoptionListingSchema.index({ ownerClerkId: 1 });
AdoptionListingSchema.index({ city: 1, status: 1 });
AdoptionListingSchema.index({ listingType: 1, status: 1 });

export const AdoptionListing =
  (mongoose.models.AdoptionListing as mongoose.Model<IAdoptionListing>) ||
  mongoose.model<IAdoptionListing>("AdoptionListing", AdoptionListingSchema);
