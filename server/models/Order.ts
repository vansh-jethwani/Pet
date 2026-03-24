import mongoose, { Schema, Document } from "mongoose";

export interface IOrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  sellerName: string;
}

export interface IOrder extends Document {
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  items: IOrderItem[];
  totalAmount: number;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  address: string;
  phone: string;
  createdAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>({
  productId:  { type: String, required: true },
  name:       { type: String, required: true },
  price:      { type: Number, required: true },
  quantity:   { type: Number, required: true, default: 1 },
  image:      { type: String, default: "" },
  sellerName: { type: String, default: "" },
});

const OrderSchema = new Schema<IOrder>(
  {
    buyerId:     { type: String, required: true },
    buyerName:   { type: String, required: true },
    buyerEmail:  { type: String, required: true },
    items:       [OrderItemSchema],
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
      default: "confirmed",
    },
    address: { type: String, default: "" },
    phone:   { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

OrderSchema.index({ buyerId: 1, createdAt: -1 });

export const Order =
  (mongoose.models.Order as mongoose.Model<IOrder>) ||
  mongoose.model<IOrder>("Order", OrderSchema);
