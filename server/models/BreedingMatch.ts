import mongoose, { Schema, Document } from "mongoose";

export interface IBreedingMatch extends Document {
  clerkUserId: string;
  petId: string;
  createdAt: Date;
}

const BreedingMatchSchema = new Schema<IBreedingMatch>(
  {
    clerkUserId: { type: String, required: true },
    petId:       { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Prevent duplicate matches for same user+pet
BreedingMatchSchema.index({ clerkUserId: 1, petId: 1 }, { unique: true });

export const BreedingMatch =
  (mongoose.models.BreedingMatch as mongoose.Model<IBreedingMatch> | undefined) ||
  mongoose.model<IBreedingMatch>("BreedingMatch", BreedingMatchSchema);
