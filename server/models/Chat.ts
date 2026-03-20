import mongoose, { Schema, Document } from "mongoose";

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: string;
  type: "text" | "system";
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

const ChatMessageSchema = new Schema<ChatMessage>(
  {
    id: { type: String, required: true },
    roomId: { type: String, required: true },
    senderId: { type: String, required: true },
    senderName: { type: String, required: true },
    senderAvatar: { type: String, required: true },
    text: { type: String, required: true },
    timestamp: { type: String, required: true },
    type: { type: String, enum: ["text", "system"], default: "text" },
  },
  { _id: false }
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
    seekerAvatar: { type: String, required: true },
    messages: { type: [ChatMessageSchema], default: [] },
    createdAt: { type: String, required: true },
  },
  { timestamps: false }
);

export const ChatRoom = mongoose.models.ChatRoom as mongoose.Model<IChatRoom> || mongoose.model<IChatRoom>("ChatRoom", ChatRoomSchema);
