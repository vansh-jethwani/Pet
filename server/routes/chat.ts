/**
 * server/routes/chat.ts
 *
 * ROOT-CAUSE FIX: Same-name / different-email account collision.
 *
 * The original code used display names (ownerName, seekerName) as identity
 * keys in three places:
 *
 *   1. ownerNameChannel(name)  — socket room keyed by display name
 *      → two users named "Vansh" shared the same socket room and received
 *        each other's inbox notifications.
 *
 *   2. owner_subscribe DB query: { $or: [{ ownerId }, { ownerName }] }
 *      → "Vansh B" could retrieve "Vansh A"'s chat rooms because both have
 *        ownerName = "Vansh".
 *
 *   3. isRoomMember() compared ownerName / seekerName strings
 *      → any user with the same display name was treated as a room member,
 *        allowing them to read and write into another person's conversation.
 *
 * THE FIX (applied in every function below):
 *   - Identity is ALWAYS the Clerk user ID (ownerId / seekerId).
 *   - Display names are stored for UI display only — never used for lookup,
 *     access control, or socket channel routing.
 *   - ownerNameChannel() is REMOVED entirely.
 *   - DB queries use only { ownerId } or { seekerId } (never name fields).
 *   - isRoomMember() compares only IDs, never names.
 *   - owner_join_room access check uses only ownerId (never ownerName).
 *   - getRoomId() remains unchanged (petId + seekerId = globally unique).
 */

import { Server, Socket } from "socket.io";
import { ChatRoom } from "../models/Chat.js";

export interface ChatMessage {
  id:           string;
  roomId:       string;
  senderId:     string;
  senderName:   string;
  senderAvatar: string;
  text:         string;
  timestamp:    string;
  type:         "text" | "system";
}

export interface SerializedRoom {
  id:           string;
  petId:        string;
  petName:      string;
  petPhoto:     string;
  ownerId:      string;
  ownerName:    string;
  seekerId:     string;
  seekerName:   string;
  seekerAvatar: string;
  messages:     ChatMessage[];
  createdAt:    string;
}

interface Room extends SerializedRoom {
  participants: Set<string>;
}

// ─── In-memory cache ──────────────────────────────────────────────────────────
const rooms = new Map<string, Room>();

// ─── Channel helpers ──────────────────────────────────────────────────────────
// FIX: Only ID-based channels. ownerNameChannel() is REMOVED — it was the
// primary cause of cross-account message leakage.
function ownerChannel(ownerId: string)   { return `owner_${ownerId}`;  }
function seekerChannel(seekerId: string) { return `seeker_${seekerId}`; }

// ─── Room ID ──────────────────────────────────────────────────────────────────
export function getRoomId(petId: string, seekerId: string): string {
  return `pet_${petId}_seeker_${seekerId}`;
}

// ─── Load room from DB ────────────────────────────────────────────────────────
async function loadRoom(roomId: string): Promise<Room | undefined> {
  try {
    const doc = await ChatRoom.findOne({ id: roomId }).lean<any>();
    if (!doc) return undefined;

    const messages: ChatMessage[] = (doc.messages || []).map((m: any) => ({
      id:           m.id || String(m._id),
      roomId:       m.roomId || roomId,
      senderId:     m.senderId     || "",
      senderName:   m.senderName   || "",
      senderAvatar: m.senderAvatar || "🐾",
      text:         m.text         || "",
      timestamp:    m.timestamp    || new Date().toISOString(),
      type:         m.type         || "text",
    }));

    const room: Room = {
      id:           doc.id,
      petId:        doc.petId,
      petName:      doc.petName,
      petPhoto:     doc.petPhoto     || "",
      ownerId:      doc.ownerId,
      ownerName:    doc.ownerName,
      seekerId:     doc.seekerId,
      seekerName:   doc.seekerName,
      seekerAvatar: doc.seekerAvatar || "🐾",
      messages,
      createdAt:    doc.createdAt,
      participants: rooms.get(roomId)?.participants ?? new Set<string>(),
    };

    rooms.set(roomId, room);
    return room;
  } catch (err) {
    console.error("[chat] loadRoom error:", err);
    return undefined;
  }
}

function serializeRoom(room: Room): SerializedRoom {
  return {
    id:           room.id,
    petId:        room.petId,
    petName:      room.petName,
    petPhoto:     room.petPhoto,
    ownerId:      room.ownerId,
    ownerName:    room.ownerName,
    seekerId:     room.seekerId,
    seekerName:   room.seekerName,
    seekerAvatar: room.seekerAvatar,
    messages:     room.messages,
    createdAt:    room.createdAt,
  };
}

function makeMessage(roomId: string, data: {
  senderId: string; senderName: string; senderAvatar: string; text: string;
}): ChatMessage {
  return {
    id:           `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    roomId,
    senderId:     data.senderId,
    senderName:   data.senderName,
    senderAvatar: data.senderAvatar,
    text:         data.text,
    timestamp:    new Date().toISOString(),
    type:         "text",
  };
}

// ─── FIX: isRoomMember uses ONLY IDs, never names ────────────────────────────
// Previously this compared ownerName and seekerName strings, allowing any user
// with the same display name to be treated as a room member.
function isRoomMember(room: Room, userId: string): boolean {
  if (!userId || !userId.trim()) return false;
  const id = userId.trim();
  return room.seekerId === id || room.ownerId === id;
}

async function persistMessage(roomId: string, msg: ChatMessage): Promise<void> {
  try {
    await ChatRoom.updateOne(
      { id: roomId },
      { $push: { messages: { $each: [msg], $slice: -500 } } }
    );
  } catch (err) {
    console.error("[chat] persistMessage error:", err);
  }
}

// ─── Main handler ─────────────────────────────────────────────────────────────
export function registerChatHandlers(io: Server) {
  const ns = io.of("/chat");

  ns.on("connection", (socket: Socket) => {
    console.log(`💬 [chat] connected ${socket.id}`);

    // ── OWNER: subscribe to their inbox ──────────────────────────────────────
    socket.on("owner_subscribe", async (data: { ownerId: string; ownerName: string }) => {
      const { ownerId, ownerName } = data;

      // FIX: Reject subscription if no real user ID is provided.
      // Previously the server would fall back to querying by ownerName,
      // causing all same-named users to share the same inbox.
      if (!ownerId || !ownerId.trim()) {
        console.warn("[chat] owner_subscribe: empty ownerId — rejecting");
        return;
      }

      // FIX: Subscribe only to the ID-based channel.
      socket.join(ownerChannel(ownerId));
      // ownerNameChannel is intentionally removed — see file header.

      try {
        // FIX: Query ONLY by ownerId. Never fall back to ownerName.
        const dbRooms = await ChatRoom.find({ ownerId }).lean<any[]>();

        const myRooms = await Promise.all(
          dbRooms.map(async (doc) => {
            const messages: ChatMessage[] = (doc.messages || []).map((m: any) => ({
              id:           m.id || String(m._id),
              roomId:       m.roomId || doc.id,
              senderId:     m.senderId     || "",
              senderName:   m.senderName   || "",
              senderAvatar: m.senderAvatar || "🐾",
              text:         m.text         || "",
              timestamp:    m.timestamp    || new Date().toISOString(),
              type:         m.type         || "text",
            }));

            const room: Room = {
              id:           doc.id,
              petId:        doc.petId,
              petName:      doc.petName,
              petPhoto:     doc.petPhoto    || "",
              ownerId:      doc.ownerId,
              ownerName:    doc.ownerName,
              seekerId:     doc.seekerId,
              seekerName:   doc.seekerName,
              seekerAvatar: doc.seekerAvatar || "🐾",
              messages,
              createdAt:    doc.createdAt,
              participants: rooms.get(doc.id)?.participants ?? new Set(),
            };

            rooms.set(room.id, room);
            return serializeRoom(room);
          })
        );

        socket.emit("owner_inbox", { rooms: myRooms });
        console.log(`📬 owner ${ownerId} (${ownerName}) subscribed, ${myRooms.length} rooms`);
      } catch (err) {
        console.error("[chat] owner_subscribe error:", err);
        socket.emit("owner_inbox", { rooms: [] });
      }
    });

    // ── SEEKER: subscribe to their inbox ─────────────────────────────────────
    socket.on("seeker_subscribe", async (data: { seekerId: string; seekerName: string }) => {
      const { seekerId, seekerName } = data;

      // FIX: Reject if no real user ID.
      if (!seekerId || !seekerId.trim()) {
        console.warn("[chat] seeker_subscribe: empty seekerId — rejecting");
        return;
      }

      socket.join(seekerChannel(seekerId));

      try {
        // FIX: Query ONLY by seekerId.
        const dbRooms = await ChatRoom.find({ seekerId }).lean<any[]>();

        const myRooms = dbRooms.map((doc) => {
          const messages: ChatMessage[] = (doc.messages || []).map((m: any) => ({
            id:           m.id || String(m._id),
            roomId:       m.roomId || doc.id,
            senderId:     m.senderId     || "",
            senderName:   m.senderName   || "",
            senderAvatar: m.senderAvatar || "🐾",
            text:         m.text         || "",
            timestamp:    m.timestamp    || new Date().toISOString(),
            type:         m.type         || "text",
          }));

          const room: Room = {
            id:           doc.id,
            petId:        doc.petId,
            petName:      doc.petName,
            petPhoto:     doc.petPhoto    || "",
            ownerId:      doc.ownerId,
            ownerName:    doc.ownerName,
            seekerId:     doc.seekerId,
            seekerName:   doc.seekerName,
            seekerAvatar: doc.seekerAvatar || "🐾",
            messages,
            createdAt:    doc.createdAt,
            participants: rooms.get(doc.id)?.participants ?? new Set(),
          };
          rooms.set(room.id, room);
          return serializeRoom(room);
        });

        socket.emit("seeker_inbox", { rooms: myRooms });
        console.log(`📬 seeker ${seekerId} subscribed, ${myRooms.length} rooms`);
      } catch (err) {
        console.error("[chat] seeker_subscribe error:", err);
        socket.emit("seeker_inbox", { rooms: [] });
      }
    });

    // ── SEEKER: join or create a room when they like a pet ───────────────────
    socket.on("join_room", async (data: {
      petId:        string;
      petName:      string;
      petPhoto?:    string;
      ownerId:      string;
      ownerName:    string;
      seekerId:     string;
      seekerName:   string;
      seekerAvatar: string;
    }) => {
      // FIX: Require real IDs. If seekerId or ownerId is missing, we cannot
      // create a room safely — fall back to a guest ID only as last resort.
      const seekerId = data.seekerId?.trim() || "";
      const ownerId  = data.ownerId?.trim()  || "";

      if (!seekerId) {
        console.warn("[chat] join_room: empty seekerId — cannot create room");
        socket.emit("error", { message: "Not authenticated" });
        return;
      }

      const roomId = getRoomId(data.petId, seekerId);

      try {
        let room = await loadRoom(roomId);
        const isNew = !room;

        if (isNew) {
          room = {
            id:           roomId,
            petId:        data.petId,
            petName:      data.petName,
            petPhoto:     data.petPhoto   ?? "",
            ownerId,
            ownerName:    data.ownerName,
            seekerId,
            seekerName:   data.seekerName,
            seekerAvatar: data.seekerAvatar,
            messages:     [],
            participants: new Set(),
            createdAt:    new Date().toISOString(),
          };

          await ChatRoom.create({
            id:           room.id,
            petId:        room.petId,
            petName:      room.petName,
            petPhoto:     room.petPhoto,
            ownerId:      room.ownerId,
            ownerName:    room.ownerName,
            seekerId:     room.seekerId,
            seekerName:   room.seekerName,
            seekerAvatar: room.seekerAvatar,
            messages:     [],
            createdAt:    room.createdAt,
          });

          rooms.set(roomId, room);
        } else {
          // Update mutable display fields (never IDs)
          room.seekerAvatar = data.seekerAvatar;
          room.petName      = data.petName;
          room.petPhoto     = data.petPhoto ?? room.petPhoto;
          // FIX: Update display name only — do NOT touch ownerId/seekerId
          if (data.ownerName)  room.ownerName  = data.ownerName;
          if (data.seekerName) room.seekerName = data.seekerName;

          await ChatRoom.updateOne({ id: roomId }, {
            petName:      room.petName,
            petPhoto:     room.petPhoto,
            ownerName:    room.ownerName,
            seekerName:   room.seekerName,
            seekerAvatar: room.seekerAvatar,
          });
        }

        room.participants.add(socket.id);
        socket.join(roomId);

        socket.emit("room_joined", {
          roomId,
          messages:     room.messages,
          petName:      room.petName,
          petPhoto:     room.petPhoto,
          ownerName:    room.ownerName,
          ownerId:      room.ownerId,
          seekerName:   room.seekerName,
          seekerId:     room.seekerId,
          seekerAvatar: room.seekerAvatar,
        });

        if (isNew) {
          const payload = { room: serializeRoom(room) };
          // FIX: Notify owner only via their ID-based channel
          ns.to(ownerChannel(room.ownerId)).emit("new_conversation", payload);
        }
      } catch (err) {
        console.error("[chat] join_room error:", err);
        socket.emit("error", { message: "Failed to join room" });
      }
    });

    // ── OWNER: join a specific room to read + reply ───────────────────────────
    socket.on("owner_join_room", async (data: {
      roomId:    string;
      ownerId:   string;
      ownerName?: string;
    }) => {
      // FIX: Require a real ownerId.
      if (!data.ownerId?.trim()) {
        console.warn("[chat] owner_join_room: empty ownerId — rejecting");
        socket.emit("error", { message: "Not authenticated" });
        return;
      }

      try {
        const room = await loadRoom(data.roomId);
        if (!room) {
          socket.emit("error", { message: "Room not found" });
          return;
        }

        // FIX: Access check is ID-only. Display name is never used for auth.
        if (room.ownerId !== data.ownerId.trim()) {
          console.warn(
            `[chat] owner_join_room denied: requesterId=${data.ownerId} ` +
            `roomOwnerId=${room.ownerId} roomId=${data.roomId}`
          );
          socket.emit("error", { message: "Access denied" });
          return;
        }

        room.participants.add(socket.id);
        socket.join(data.roomId);

        socket.emit("room_joined", {
          roomId:       data.roomId,
          messages:     room.messages,
          petName:      room.petName,
          petPhoto:     room.petPhoto,
          ownerName:    room.ownerName,
          ownerId:      room.ownerId,
          seekerName:   room.seekerName,
          seekerId:     room.seekerId,
          seekerAvatar: room.seekerAvatar,
        });

        console.log(`👑 owner ${data.ownerId} joined room ${data.roomId}`);
      } catch (err) {
        console.error("[chat] owner_join_room error:", err);
        socket.emit("error", { message: "Failed to join room" });
      }
    });

    // ── GET MESSAGES ──────────────────────────────────────────────────────────
    socket.on("get_messages", async (data: { roomId: string; userId: string }) => {
      try {
        const room = await loadRoom(data.roomId);
        if (!room) return;

        // FIX: ID-only membership check
        if (!isRoomMember(room, data.userId)) return;

        room.participants.add(socket.id);
        socket.join(data.roomId);

        socket.emit("room_messages", {
          roomId:   data.roomId,
          messages: room.messages,
        });
      } catch (err) {
        console.error("[chat] get_messages error:", err);
      }
    });

    // ── SEND MESSAGE ──────────────────────────────────────────────────────────
    socket.on("send_message", async (data: {
      roomId:       string;
      senderId:     string;
      senderName:   string;
      senderAvatar: string;
      text:         string;
    }) => {
      if (!data.text?.trim()) return;

      // FIX: Require real senderId
      if (!data.senderId?.trim()) {
        console.warn("[chat] send_message: empty senderId — rejecting");
        return;
      }

      try {
        let room = rooms.get(data.roomId);
        if (!room) room = await loadRoom(data.roomId);
        if (!room) {
          console.warn(`[chat] send_message: room ${data.roomId} not found`);
          return;
        }

        // FIX: ID-only membership check — prevents same-name users from
        // sending messages into rooms they don't belong to
        if (!isRoomMember(room, data.senderId)) {
          console.warn(
            `[chat] send_message denied: senderId=${data.senderId} ` +
            `not member of room ${data.roomId} ` +
            `(ownerId=${room.ownerId}, seekerId=${room.seekerId})`
          );
          return;
        }

        // Auto-join socket room so sender receives their own echo
        if (!socket.rooms.has(data.roomId)) {
          socket.join(data.roomId);
          room.participants.add(socket.id);
        }

        const msg = makeMessage(data.roomId, {
          senderId:     data.senderId,
          senderName:   data.senderName,
          senderAvatar: data.senderAvatar,
          text:         data.text.trim(),
        });

        room.messages.push(msg);
        if (room.messages.length > 500) {
          room.messages = room.messages.slice(-500);
        }

        await persistMessage(data.roomId, msg);

        // 1. Deliver to everyone in the socket room
        ns.to(data.roomId).emit("new_message", msg);

        // FIX: Notify owner via ID-only channel (no name channel)
        ns.to(ownerChannel(room.ownerId)).emit("inbox_message", {
          roomId:     data.roomId,
          message:    msg,
          petName:    room.petName,
          seekerName: room.seekerName,
        });

        // 3. Push to seeker notification channel
        ns.to(seekerChannel(room.seekerId)).emit("inbox_message", {
          roomId:  data.roomId,
          message: msg,
          petName: room.petName,
        });

        console.log(
          `💬 msg in ${data.roomId} from ${data.senderName} [${data.senderId}]: ` +
          data.text.slice(0, 40)
        );
      } catch (err) {
        console.error("[chat] send_message error:", err);
      }
    });

    // ── TYPING ────────────────────────────────────────────────────────────────
    socket.on("typing_start", (data: { roomId: string; userName: string }) => {
      socket.to(data.roomId).emit("user_typing", { userName: data.userName });
    });

    socket.on("typing_stop", (data: { roomId: string }) => {
      socket.to(data.roomId).emit("user_stopped_typing");
    });

    // ── WebRTC: call signaling ────────────────────────────────────────────────
    socket.on("call_initiate", (data: {
      roomId:      string;
      callerId:    string;
      callerName:  string;
      callerAvatar:string;
      callType:    "video" | "voice";
    }) => {
      socket.to(data.roomId).emit("incoming_call", {
        roomId:      data.roomId,
        callerId:    data.callerId,
        callerName:  data.callerName,
        callerAvatar:data.callerAvatar,
        callType:    data.callType,
        socketId:    socket.id,
      });
    });

    socket.on("call_accepted", (data: {
      roomId:       string;
      callerId:     string;
      answererName: string;
      callType:     "video" | "voice";
    }) => {
      socket.to(data.roomId).emit("call_accepted", {
        answererName: data.answererName,
        callType:     data.callType,
        socketId:     socket.id,
      });
    });

    socket.on("call_rejected", (data: { roomId: string; reason?: string }) => {
      socket.to(data.roomId).emit("call_rejected", { reason: data.reason ?? "User declined" });
    });

    socket.on("call_ended", (data: { roomId: string }) => {
      socket.to(data.roomId).emit("call_ended");
    });

    // ── WebRTC SDP / ICE relay ────────────────────────────────────────────────
    socket.on("webrtc_offer", (data: {
      roomId:         string;
      offer:          RTCSessionDescriptionInit;
      targetSocketId: string;
    }) => {
      ns.to(data.targetSocketId).emit("webrtc_offer", {
        offer:        data.offer,
        fromSocketId: socket.id,
      });
    });

    socket.on("webrtc_answer", (data: {
      roomId:         string;
      answer:         RTCSessionDescriptionInit;
      targetSocketId: string;
    }) => {
      ns.to(data.targetSocketId).emit("webrtc_answer", {
        answer:       data.answer,
        fromSocketId: socket.id,
      });
    });

    socket.on("webrtc_ice_candidate", (data: {
      roomId:         string;
      candidate:      RTCIceCandidateInit;
      targetSocketId: string;
    }) => {
      ns.to(data.targetSocketId).emit("webrtc_ice_candidate", {
        candidate:    data.candidate,
        fromSocketId: socket.id,
      });
    });

    // ── Disconnect ────────────────────────────────────────────────────────────
    socket.on("disconnect", () => {
      rooms.forEach((room) => {
        if (room.participants.has(socket.id)) {
          room.participants.delete(socket.id);
          ns.to(room.id).emit("participant_left", { socketId: socket.id });
        }
      });
      console.log(`💬 [chat] disconnected ${socket.id}`);
    });
  });

  return ns;
}

export function getRooms() { return rooms; }
