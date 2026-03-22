import mongoose, { Schema, Document } from "mongoose";

// ─── Reply Schema ─────────────────────────────────────────────────────────────

export interface IReply {
  _id:     mongoose.Types.ObjectId;
  author:  string;
  avatar:  string;
  // clerkId of the reply author — used to notify them when:
  //   • someone replies to their reply (@mention)
  //   • someone likes their reply
  clerkId: string;
  content: string;
  likes:   number;
  createdAt: Date;
}

const ReplySchema = new Schema<IReply>(
  {
    author:  { type: String, required: true },
    avatar:  { type: String, default: "🐾" },
    clerkId: { type: String, default: "" },
    content: { type: String, required: true },
    likes:   { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// ─── Post Schema ──────────────────────────────────────────────────────────────

export interface IPost extends Document {
  author:   string;
  avatar:   string;
  clerkId:  string;
  category: "tips" | "stories" | "questions" | "events";
  title:    string;
  content:  string;
  tags:     string[];
  likes:    number;
  views:    number;
  replies:  IReply[];
  createdAt: Date;
}

const PostSchema = new Schema<IPost>(
  {
    author:   { type: String, required: true },
    avatar:   { type: String, default: "🐾" },
    clerkId:  { type: String, default: "" },
    category: {
      type: String,
      required: true,
      enum: ["tips", "stories", "questions", "events"],
    },
    title:   { type: String, required: true },
    content: { type: String, required: true },
    tags:    [{ type: String }],
    likes:   { type: Number, default: 0 },
    views:   { type: Number, default: 0 },
    replies: [ReplySchema],
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

PostSchema.index({ clerkId: 1 });

export const Post =
  (mongoose.models.Post as mongoose.Model<IPost> | undefined) ||
  mongoose.model<IPost>("Post", PostSchema);
