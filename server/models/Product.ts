import mongoose, { Schema, Document } from "mongoose";

export interface IProduct extends Document {
  name: string;
  description: string;
  category: "food" | "toys" | "grooming" | "accessories" | "medicine" | "housing";
  petType: "dog" | "cat" | "fish" | "bird" | "all";
  price: number; // in INR
  stock: number;
  image: string;
  brand: string;
  sellerId: string; // Clerk user ID
  sellerName: string;
  sellerEmail: string;
  rating: number;
  reviews: number;
  approved: boolean;
  createdAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    name:        { type: String, required: true },
    description: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: ["food", "toys", "grooming", "accessories", "medicine", "housing"],
    },
    petType: {
      type: String,
      required: true,
      enum: ["dog", "cat", "fish", "bird", "all"],
    },
    price:       { type: Number, required: true, min: 0 },
    stock:       { type: Number, required: true, default: 0 },
    image:       { type: String, default: "" },
    brand:       { type: String, required: true },
    sellerId:    { type: String, required: true },
    sellerName:  { type: String, required: true },
    sellerEmail: { type: String, required: true },
    rating:      { type: Number, default: 0 },
    reviews:     { type: Number, default: 0 },
    approved:    { type: Boolean, default: true },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

ProductSchema.index({ petType: 1, category: 1 });
ProductSchema.index({ sellerId: 1 });
ProductSchema.index({ approved: 1, createdAt: -1 });

export const Product =
  (mongoose.models.Product as mongoose.Model<IProduct>) ||
  mongoose.model<IProduct>("Product", ProductSchema);
