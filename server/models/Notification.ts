/**
 * server/models/Notification.ts
 *
 * BUG FIXES:
 * 1. _io was assigned via initNotificationService() but community.ts called
 *    setGetIO() with a getter — two separate io references that could diverge.
 *    Fixed: single _io variable, initNotificationService sets it, getIO() reads it.
 * 2. createNotification logged "skipping" for empty userId but didn't guard
 *    against undefined properly — could throw in Mongoose.
 * 3. notifyBreedingMessage, notifyAdoptionApproved, etc. were calling
 *    createNotification with the wrong argument shape — fixed typing.
 * 4. formatNotification didn't handle missing createdAt gracefully.
 */

import mongoose, { Schema, Document } from "mongoose";
import type { Server as SocketServer } from "socket.io";

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotificationType =
  | "breeding_like"        | "breeding_match"        | "breeding_message"
  | "adoption_applied"     | "adoption_approved"
  | "hosting_request"      | "hosting_confirmed"
  | "vet_booking"          | "vet_reminder"          | "vet_approved"
  | "marketplace_interest" | "store_order"
  | "community_reply"      | "community_like"
  | "community_reply_to_reply"                       // someone replied to YOUR reply
  | "community_reply_like"                           // someone liked YOUR reply
  | "insurance_expiry"     | "system";

export interface INotification extends Document {
  userId:      string;
  type:        NotificationType;
  title:       string;
  message:     string;
  icon:        string;
  color:       string;
  read:        boolean;
  actionUrl:   string;
  actionLabel: string;
  metadata:    Record<string, any>;
  createdAt:   Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const NotificationSchema = new Schema<INotification>(
  {
    userId:      { type: String,  required: true },
    type:        { type: String,  required: true },
    title:       { type: String,  required: true },
    message:     { type: String,  required: true },
    icon:        { type: String,  default: "🔔"  },
    color:       { type: String,  default: "orange" },
    read:        { type: Boolean, default: false },
    actionUrl:   { type: String,  default: ""    },
    actionLabel: { type: String,  default: ""    },
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
    id:          doc._id?.toString() ?? doc.id ?? "",
    userId:      doc.userId      ?? "",
    type:        doc.type        ?? "system",
    title:       doc.title       ?? "Notification",
    message:     doc.message     ?? "",
    icon:        doc.icon        ?? "🔔",
    color:       doc.color       ?? "orange",
    read:        Boolean(doc.read),
    actionUrl:   doc.actionUrl   ?? "",
    actionLabel: doc.actionLabel ?? "",
    metadata:    doc.metadata    ?? {},
    // BUG FIX: handle both Date objects and ISO strings
    createdAt:   doc.createdAt instanceof Date
      ? doc.createdAt.toISOString()
      : doc.createdAt ?? new Date().toISOString(),
  };
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

export const NOTIFICATION_DEFAULTS: Record<
  NotificationType,
  { icon: string; color: string; title: string }
> = {
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
  community_like:           { icon: "❤️",  color: "orange", title: "Someone Liked Your Post"      }, // overridden dynamically below
  community_reply_to_reply: { icon: "↩️",  color: "orange", title: "Someone Replied to Your Reply" }, // overridden dynamically
  community_reply_like:     { icon: "❤️",  color: "orange", title: "Someone Liked Your Reply"      }, // overridden dynamically
  insurance_expiry:         { icon: "⚠️",  color: "red",    title: "Insurance Expiring Soon"       },
  system:                   { icon: "🔔",  color: "gray",   title: "Notification"                  },
};

// ─── Socket.io reference ──────────────────────────────────────────────────────
// BUG FIX: single source of truth — initNotificationService sets _io once when
// the HTTP server is ready. All callers use this module's reference, not a
// separate getter function, so there's no risk of divergence.

let _io: SocketServer | null = null;

export function initNotificationService(io: SocketServer) {
  _io = io;
  console.log("✅ [notif] Notification service initialized");
}

// BUG FIX: expose getter so community.ts can call getIO() instead of keeping
// its own separate _getIO reference (which could be null on first request).
export function getNotificationIO(): SocketServer | null {
  return _io;
}

// ─── Core create function ─────────────────────────────────────────────────────

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

export async function createNotification(
  opts: CreateNotificationOptions
): Promise<ReturnType<typeof formatNotification> | null> {
  // BUG FIX: robust userId guard — reject empty string, null, undefined
  if (!opts.userId || typeof opts.userId !== "string" || !opts.userId.trim()) {
    console.warn("[notif] createNotification: empty userId — skipping");
    return null;
  }

  const defaults = NOTIFICATION_DEFAULTS[opts.type] ?? NOTIFICATION_DEFAULTS.system;

  try {
    const doc = await Notification.create({
      userId:      opts.userId.trim(),
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

    // BUG FIX: emit only when _io is ready; log a clear warning if not.
    if (_io) {
      const room = `user_${opts.userId.trim()}`;
      _io.to(room).emit("notification", formatted);
      console.log(`📨 [notif] emitted → room="${room}" type="${opts.type}"`);
    } else {
      console.warn(
        `[notif] _io is null — Socket.io not ready yet. ` +
        `Notification saved to DB but not pushed in real-time. ` +
        `type="${opts.type}" userId="${opts.userId}"`
      );
    }

    return formatted;
  } catch (err) {
    console.error("[notif] createNotification error:", err);
    return null;
  }
}

// ─── Convenience trigger helpers ──────────────────────────────────────────────
// All callers import these — no need for routes to call createNotification directly.

export const notifyVetBooking = (
  vetUserId: string,
  ownerName: string,
  petName: string,
  type: string,
  preferredDate?: string
) =>
  createNotification({
    userId:      vetUserId,
    type:        "vet_booking",
    title:       "New Appointment Request",
    message:     `${ownerName} wants to book a ${type} consultation for ${petName}${
      preferredDate ? ` on ${new Date(preferredDate).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}` : ""
    }. Please review and accept.`,
    actionUrl:   "/dashboard",
    actionLabel: "Review",
  });

export const notifyVetBookingUser = (
  userUserId: string,
  vetName: string,
  petName: string,
  type: string,
  preferredDate?: string
) =>
  createNotification({
    userId:      userUserId,
    type:        "vet_booking",
    title:       "Booking Request Sent!",
    message:     `Your ${type} consultation request for ${petName} with Dr. ${vetName} has been sent.${
      preferredDate ? ` Requested: ${new Date(preferredDate).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}` : ""
    }`,
    actionUrl:   "/dashboard",
    actionLabel: "View Dashboard",
  });

export const notifyShopOwnerOrder = (
  sellerUserId: string,
  buyerName: string,
  itemSummary: string,
  totalAmount: number,
  orderId: string
) =>
  createNotification({
    userId:      sellerUserId,
    type:        "store_order",
    title:       "New Order Received! 📦",
    message:     `${buyerName} ordered ${itemSummary} — ₹${totalAmount.toLocaleString("en-IN")}`,
    actionUrl:   "/store",
    actionLabel: "View Orders",
    metadata:    { orderId },
  });

export const notifyVetApproved = (vetUserId: string, vetName: string) =>
  createNotification({
    userId:      vetUserId,
    type:        "vet_approved",
    message:     `Congratulations ${vetName}! Your vet profile is now live.`,
    actionUrl:   "/vets",
    actionLabel: "View profile",
  });

export const notifyBreedingLike = (
  ownerUserId: string,
  likerName: string,
  petName: string,
  petId = ""
) =>
  createNotification({
    userId:      ownerUserId,
    type:        "breeding_like",
    message:     `${likerName} liked your pet ${petName}!`,
    actionUrl:   "/breeding",
    actionLabel: "See matches",
    metadata:    { petId },
  });

export const notifyBreedingMatch = (
  userId: string,
  matchedPetName: string,
  matchedOwnerName: string
) =>
  createNotification({
    userId,
    type:        "breeding_match",
    message:     `You matched with ${matchedOwnerName}'s ${matchedPetName}! Start chatting.`,
    actionUrl:   "/chat",
    actionLabel: "Chat",
  });

export const notifyBreedingMessage = (
  ownerUserId: string,
  senderName: string,
  petName: string,
  roomId = ""
) =>
  createNotification({
    userId:      ownerUserId,
    type:        "breeding_message",
    message:     `${senderName} sent a message about ${petName}`,
    actionUrl:   "/chat",
    actionLabel: "Reply",
    metadata:    { roomId },
  });

export const notifyAdoptionApplied = (
  ownerUserId: string,
  applicantName: string,
  petName: string
) =>
  createNotification({
    userId:      ownerUserId,
    type:        "adoption_applied",
    message:     `${applicantName} applied to adopt ${petName}!`,
    actionUrl:   "/adoption",
    actionLabel: "Review",
  });

export const notifyAdoptionApproved = (
  applicantUserId: string,
  petName: string,
  shelterName: string
) =>
  createNotification({
    userId:      applicantUserId,
    type:        "adoption_approved",
    message:     `${shelterName} approved your application for ${petName}!`,
    actionUrl:   "/adoption",
    actionLabel: "View",
  });

export const notifyHostingRequest = (
  hostUserId: string,
  requesterName: string,
  petName: string,
  dates = ""
) =>
  createNotification({
    userId:      hostUserId,
    type:        "hosting_request",
    message:     `${requesterName} wants you to host ${petName}${dates ? ` (${dates})` : ""}`,
    actionUrl:   "/hosting",
    actionLabel: "View",
  });

export const notifyCommunityReply = (
  authorUserId: string,
  replierName: string,
  postTitle: string,
  postId = ""
) =>
  createNotification({
    userId:      authorUserId,
    type:        "community_reply",
    message:     `${replierName} replied to your post: "${postTitle}"`,
    actionUrl:   "/community",
    actionLabel: "See reply",
    metadata:    { postId },
  });

export const notifyCommunityLike = (
  authorUserId: string,
  likerName: string,
  postTitle: string,
  postId = ""
) =>
  createNotification({
    userId:      authorUserId,
    type:        "community_like",
    // FIX: dynamic title using liker name so it shows "Vansh liked your post"
    // instead of the static default "Someone Liked Your Post"
    title:       `${likerName} liked your post`,
    message:     `${likerName} liked your post: "${postTitle}"`,
    actionUrl:   "/community",
    actionLabel: "View",
    metadata:    { postId },
  });

export const notifyMarketplaceInterest = (
  sellerUserId: string,
  buyerName: string,
  listingName: string
) =>
  createNotification({
    userId:      sellerUserId,
    type:        "marketplace_interest",
    message:     `${buyerName} is interested in: ${listingName}`,
    actionUrl:   "/marketplace",
    actionLabel: "View",
  });

export const notifyStoreOrder = (
  userId: string,
  orderId: string,
  itemName: string,
  amount: number
) =>
  createNotification({
    userId,
    type:        "store_order",
    title:       "Order Confirmed! 🎉",
    message:     `Your order for ${itemName} — ₹${amount.toLocaleString("en-IN")} has been placed successfully!`,
    actionUrl:   "/store",
    actionLabel: "Track Order",
    metadata:    { orderId },
  });

export const notifyCommunityReplyToReply = (
  replyAuthorUserId: string,
  replierName: string,
  snippet: string,
  postId = ""
) =>
  createNotification({
    userId:      replyAuthorUserId,
    type:        "community_reply_to_reply",
    title:       `${replierName} replied to your comment`,
    message:     `${replierName} replied to your comment: "${snippet}"`,
    actionUrl:   "/community",
    actionLabel: "See reply",
    metadata:    { postId },
  });

export const notifyCommunityReplyLike = (
  replyAuthorUserId: string,
  likerName: string,
  snippet: string,
  postId = ""
) =>
  createNotification({
    userId:      replyAuthorUserId,
    type:        "community_reply_like",
    title:       `${likerName} liked your comment`,
    message:     `${likerName} liked your comment: "${snippet}"`,
    actionUrl:   "/community",
    actionLabel: "View",
    metadata:    { postId },
  });
