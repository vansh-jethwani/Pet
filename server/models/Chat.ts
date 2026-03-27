import mongoose, { Schema, Document } from "mongoose";

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: string;
  type: "text" | "system" | "call_log";
}

export interface IChatRoom extends Document {
  id: string;
  petId: string;
  petName: string;
  petPhoto: string;
  ownerId: string;
  ownerName: string;
  seekerId: string;
  seekerName: string;
  seekerAvatar: string;
  messages: ChatMessage[];
  createdAt: string;
}

// FIX: id field is not required in sub-schema because old messages may use _id only.
// We normalize at read time in chat.ts.
const ChatMessageSchema = new Schema<ChatMessage>(
  {
    id: { type: String, default: "" },          // FIX: not required, has default
    roomId: { type: String, default: "" },      // FIX: not required, has default
    senderId: { type: String, required: true },
    senderName: { type: String, required: true },
    senderAvatar: { type: String, default: "🐾" },
    text: { type: String, required: true },
    timestamp: { type: String, required: true },
    type: { type: String, enum: ["text", "system", "call_log"], default: "text" },
  },
  { _id: true }   // FIX: keep _id so we can fall back to it as message id
);

const ChatRoomSchema = new Schema<IChatRoom>(
  {
    id: { type: String, required: true, unique: true },
    petId: { type: String, required: true },
    petName: { type: String, required: true },
    petPhoto: { type: String, default: "" },
    ownerId: { type: String, required: true },
    ownerName: { type: String, required: true },
    seekerId: { type: String, required: true },
    seekerName: { type: String, required: true },
    seekerAvatar: { type: String, default: "🐾" },
    messages: { type: [ChatMessageSchema], default: [] },
    createdAt: { type: String, required: true },
  },
  { timestamps: false }
);

// FIX: add indexes for fast lookup by ownerId, ownerName, and seekerId
ChatRoomSchema.index({ ownerId: 1 });
ChatRoomSchema.index({ ownerName: 1 });
ChatRoomSchema.index({ seekerId: 1 });
ChatRoomSchema.index({ id: 1 }, { unique: true });

export const ChatRoom =
  (mongoose.models.ChatRoom as mongoose.Model<IChatRoom>) ||
  mongoose.model<IChatRoom>("ChatRoom", ChatRoomSchema);
