/**
 * server/models/Notification.ts
 * Single source of truth for everything notification-related.
 * No services/ folder needed - everything lives here.
 */

import mongoose, { Schema, Document } from "mongoose";
import type { Server as SocketServer } from "socket.io";

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotificationType =
  | "breeding_like" | "breeding_match" | "breeding_message"
  | "adoption_applied" | "adoption_approved"
  | "hosting_request" | "hosting_confirmed"
  | "vet_booking" | "vet_reminder" | "vet_approved"
  | "marketplace_interest" | "store_order"
  | "community_reply" | "community_like"
  | "insurance_expiry" | "system";

export interface INotification extends Document {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  icon: string;
  color: string;
  read: boolean;
  actionUrl: string;
  actionLabel: string;
  metadata: Record<string, any>;
  createdAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const NotificationSchema = new Schema<INotification>(
  {
    userId:      { type: String,  required: true },
    type:        { type: String,  required: true },
    title:       { type: String,  required: true },
    message:     { type: String,  required: true },
    icon:        { type: String,  default: "🔔" },
    color:       { type: String,  default: "orange" },
    read:        { type: Boolean, default: false },
    actionUrl:   { type: String,  default: "" },
    actionLabel: { type: String,  default: "" },
    metadata:    { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, read: 1 });

export const Notification =
  (mongoose.models.Notification as mongoose.Model<INotification>) ||
  mongoose.model<INotification>("Notification", NotificationSchema);

// ─── Format ───────────────────────────────────────────────────────────────────

export function formatNotification(doc: any) {
  return {
    id:          doc._id.toString(),
    userId:      doc.userId,
    type:        doc.type,
    title:       doc.title,
    message:     doc.message,
    icon:        doc.icon        || "🔔",
    color:       doc.color       || "orange",
    read:        Boolean(doc.read),
    actionUrl:   doc.actionUrl   || "",
    actionLabel: doc.actionLabel || "",
    metadata:    doc.metadata    || {},
    createdAt:   doc.createdAt,
  };
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

export const NOTIFICATION_DEFAULTS: Record<NotificationType, { icon: string; color: string; title: string }> = {
  breeding_like:        { icon: "❤️",  color: "orange", title: "New Like on Breeding Match"   },
  breeding_match:       { icon: "🎉",  color: "orange", title: "It's a Match!"                },
  breeding_message:     { icon: "💬",  color: "blue",   title: "New Message"                  },
  adoption_applied:     { icon: "🐾",  color: "purple", title: "Adoption Application"         },
  adoption_approved:    { icon: "✅",  color: "green",  title: "Adoption Approved!"           },
  hosting_request:      { icon: "🏡",  color: "yellow", title: "Hosting Request"              },
  hosting_confirmed:    { icon: "✅",  color: "green",  title: "Hosting Confirmed"            },
  vet_booking:          { icon: "🩺",  color: "red",    title: "New Consultation Booked"      },
  vet_reminder:         { icon: "⏰",  color: "red",    title: "Upcoming Consultation"        },
  vet_approved:         { icon: "🎖️", color: "green",  title: "Vet Profile Approved"         },
  marketplace_interest: { icon: "🛍️", color: "blue",   title: "Marketplace Interest"         },
  store_order:          { icon: "📦",  color: "green",  title: "New Order"                    },
  community_reply:      { icon: "💬",  color: "orange", title: "New Reply on Your Post"       },
  community_like:       { icon: "❤️",  color: "orange", title: "Someone Liked Your Post"      },
  insurance_expiry:     { icon: "⚠️",  color: "red",    title: "Insurance Expiring Soon"      },
  system:               { icon: "🔔",  color: "gray",   title: "Notification"                 },
};

// ─── Service (no separate services/ folder) ───────────────────────────────────

let _io: SocketServer | null = null;

export function initNotificationService(io: SocketServer) {
  _io = io;
  console.log("✅ [notif] Notification service initialized");
}

export interface CreateNotificationOptions {
  userId:       string;
  type:         NotificationType;
  message:      string;
  title?:       string;
  icon?:        string;
  color?:       string;
  actionUrl?:   string;
  actionLabel?: string;
  metadata?:    Record<string, any>;
}

export async function createNotification(opts: CreateNotificationOptions) {
  if (!opts.userId) {
    console.warn("[notif] createNotification called with empty userId — skipping");
    return null;
  }

  const defaults = NOTIFICATION_DEFAULTS[opts.type] ?? NOTIFICATION_DEFAULTS.system;

  const doc = await Notification.create({
    userId:      opts.userId,
    type:        opts.type,
    title:       opts.title       ?? defaults.title,
    message:     opts.message,
    icon:        opts.icon        ?? defaults.icon,
    color:       opts.color       ?? defaults.color,
    read:        false,
    actionUrl:   opts.actionUrl   ?? "",
    actionLabel: opts.actionLabel ?? "",
    metadata:    opts.metadata    ?? {},
  });

  const formatted = formatNotification(doc);

  if (_io) {
    const room = `user_${opts.userId}`;
    _io.to(room).emit("notification", formatted);
    console.log(`📨 [notif] emitted to room="${room}" type="${opts.type}"`);
  } else {
    console.warn("[notif] _io is null — Socket.io not initialized yet");
  }

  return formatted;
}

// ─── Trigger helpers (imported by route files — no circular deps) ─────────────

export const notifyVetBooking = (vetUserId: string, ownerName: string, petName: string, type: string) =>
  createNotification({ userId: vetUserId, type: "vet_booking", message: `${ownerName} booked a ${type} consultation for ${petName}`, actionUrl: "/dashboard", actionLabel: "View" });

export const notifyVetApproved = (vetUserId: string, vetName: string) =>
  createNotification({ userId: vetUserId, type: "vet_approved", message: `Congratulations ${vetName}! Your vet profile is now live.`, actionUrl: "/vets", actionLabel: "View profile" });

export const notifyBreedingLike = (ownerUserId: string, likerName: string, petName: string, petId = "") =>
  createNotification({ userId: ownerUserId, type: "breeding_like", message: `${likerName} liked your pet ${petName}!`, actionUrl: "/breeding", actionLabel: "See matches", metadata: { petId } });

export const notifyBreedingMatch = (userId: string, matchedPetName: string, matchedOwnerName: string) =>
  createNotification({ userId, type: "breeding_match", message: `You matched with ${matchedOwnerName}'s ${matchedPetName}! Start chatting.`, actionUrl: "/chat", actionLabel: "Chat" });

export const notifyBreedingMessage = (ownerUserId: string, senderName: string, petName: string, roomId = "") =>
  createNotification({ userId: ownerUserId, type: "breeding_message", message: `${senderName} sent a message about ${petName}`, actionUrl: "/chat", actionLabel: "Reply", metadata: { roomId } });

export const notifyAdoptionApplied = (ownerUserId: string, applicantName: string, petName: string) =>
  createNotification({ userId: ownerUserId, type: "adoption_applied", message: `${applicantName} applied to adopt ${petName}!`, actionUrl: "/adoption", actionLabel: "Review" });

export const notifyAdoptionApproved = (applicantUserId: string, petName: string, shelterName: string) =>
  createNotification({ userId: applicantUserId, type: "adoption_approved", message: `${shelterName} approved your application for ${petName}!`, actionUrl: "/adoption", actionLabel: "View" });

export const notifyHostingRequest = (hostUserId: string, requesterName: string, petName: string, dates = "") =>
  createNotification({ userId: hostUserId, type: "hosting_request", message: `${requesterName} wants you to host ${petName}${dates ? ` (${dates})` : ""}`, actionUrl: "/hosting", actionLabel: "View" });

export const notifyCommunityReply = (authorUserId: string, replierName: string, postTitle: string, postId = "") =>
  createNotification({ userId: authorUserId, type: "community_reply", message: `${replierName} replied to your post: "${postTitle}"`, actionUrl: "/community", actionLabel: "See reply", metadata: { postId } });

export const notifyCommunityLike = (authorUserId: string, likerName: string, postTitle: string) =>
  createNotification({ userId: authorUserId, type: "community_like", message: `${likerName} liked your post: "${postTitle}"`, actionUrl: "/community", actionLabel: "View" });

export const notifyMarketplaceInterest = (sellerUserId: string, buyerName: string, listingName: string) =>
  createNotification({ userId: sellerUserId, type: "marketplace_interest", message: `${buyerName} is interested in: ${listingName}`, actionUrl: "/marketplace", actionLabel: "View" });

export const notifyStoreOrder = (userId: string, orderId: string, itemName: string, amount: number) =>
  createNotification({ userId, type: "store_order", message: `Order ${orderId} confirmed: ${itemName} — $${amount}`, actionUrl: "/store", actionLabel: "Track", metadata: { orderId } });
