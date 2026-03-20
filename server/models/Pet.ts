import mongoose, { Schema, Document } from "mongoose";

export interface IPet extends Document {
  name: string;
  species: "dog" | "cat";
  breed: string;
  age: number;
  gender: "Male" | "Female";
  location: string;
  city: string;
  owner: string;
  ownerAvatar: string;
  ownerVerified: boolean;
  vaccinated: boolean;
  pedigree: boolean;
  photo: string;
  fallbackEmoji: string;
  description: string;
  traits: string[];
  weight: string;
  color: string;
  score: number;
  healthCerts: string[];
  joinedDate: string;
  createdAt: Date;
}

const PetSchema = new Schema<IPet>(
  {
    name: { type: String, required: true },
    species: { type: String, required: true, enum: ["dog", "cat"] },
    breed: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, required: true, enum: ["Male", "Female"] },
    location: { type: String, required: true },
    city: { type: String, required: true },
    owner: { type: String, required: true },
    ownerAvatar: { type: String, default: "🐾" },
    ownerVerified: { type: Boolean, default: false },
    vaccinated: { type: Boolean, default: false },
    pedigree: { type: Boolean, default: false },
    photo: { type: String, required: true },
    fallbackEmoji: { type: String, required: true },
    description: { type: String, required: true },
    traits: [{ type: String }],
    weight: { type: String, default: "—" },
    color: { type: String, default: "—" },
    score: { type: Number, default: 0 },
    healthCerts: [{ type: String }],
    joinedDate: { type: String, default: new Date().toISOString().slice(0, 7) },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Pet =
  (mongoose.models.Pet as mongoose.Model<IPet> | undefined) || mongoose.model<IPet>("Pet", PetSchema);
