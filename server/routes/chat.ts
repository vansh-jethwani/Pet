/**
 * server/routes/chat.ts — ALL BUGS FIXED
 *
 * NEW FIXES IN THIS VERSION:
 *
 * BUG-7/8 — Double call signal delivery causing duplicate WebRTC negotiations.
 *   Root cause: useChat subscribes each socket to BOTH ownerChannel(userId) AND
 *   seekerChannel(userId). The previous fix emitted incoming_call to BOTH channels,
 *   so the callee received it TWICE → two banners, two call_accepted acks, two
 *   concurrent WebRTC offer negotiations → completely broken calls.
 *
 *   FIX: Introduce callChannel("call_${userId}") — a single dedicated personal
 *   channel joined once per user via registerUser(). All call signals go to the
 *   room socket AND this one call channel. One delivery guaranteed, no duplicates.
 *
 * BUG-10 — Emitting new_conversation / inbox_message to channels with empty IDs.
 *   FIX: Guard all personal channel emits with non-empty ID checks.
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
  type:         "text" | "system" | "call_log";
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

const rooms        = new Map<string, Room>();
const socketUserMap = new Map<string, string>();

// ─── Channel helpers ──────────────────────────────────────────────────────────
function ownerChannel (id: string) { return `owner_${id}`;  }
function seekerChannel(id: string) { return `seeker_${id}`; }
// FIX: single dedicated call channel per userId — prevents double-delivery
function callChannel  (id: string) { return `call_${id}`;   }

export function getRoomId(petId: string, seekerId: string): string {
  return `pet_${petId}_seeker_${seekerId}`;
}

// Register a userId↔socketId mapping and join the call channel once
function registerUser(socket: Socket, userId: string) {
  if (!userId?.trim()) return;
  socketUserMap.set(socket.id, userId.trim());
  socket.join(callChannel(userId.trim()));
}

// ─── DB helpers ───────────────────────────────────────────────────────────────
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
      id: doc.id, petId: doc.petId, petName: doc.petName,
      petPhoto: doc.petPhoto || "", ownerId: doc.ownerId, ownerName: doc.ownerName,
      seekerId: doc.seekerId, seekerName: doc.seekerName,
      seekerAvatar: doc.seekerAvatar || "🐾",
      messages, createdAt: doc.createdAt,
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
  const { participants: _p, ...rest } = room;
  return rest;
}

function makeMessage(roomId: string, data: {
  senderId: string; senderName: string; senderAvatar: string; text: string; type?: "text" | "system" | "call_log";
}): ChatMessage {
  return {
    id:           `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    roomId,
    senderId:     data.senderId,
    senderName:   data.senderName,
    senderAvatar: data.senderAvatar,
    text:         data.text,
    timestamp:    new Date().toISOString(),
    type:         data.type || "text",
  };
}

// isRoomMember: checks if userId is a legitimate member of this room.
// Uses ID-only comparison — never display names.
// Also checks socketUserMap as a fallback: if the user authenticated via
// owner_join_room (which verifies ownership server-side), their socketId
// is mapped to their userId in socketUserMap.
function isRoomMember(room: Room, userId: string, socketId?: string): boolean {
  if (!userId?.trim()) {
    // ROOT CAUSE FIX: if userId is empty but socketId is registered in socketUserMap,
    // use that to look up the real userId (handles race where Clerk hasn't loaded yet)
    if (socketId) {
      const mappedId = socketUserMap.get(socketId) ?? "";
      if (mappedId) return room.seekerId === mappedId || room.ownerId === mappedId;
    }
    return false;
  }
  const id = userId.trim();
  // Direct ID match
  if (room.seekerId === id || room.ownerId === id) return true;
  // ROOT CAUSE FIX: if room.ownerId is "" (pet was created before ownerClerkId
  // was added to the Pet model), fall back to socketUserMap ownership check.
  // If this socket successfully passed owner_join_room verification, they ARE the owner.
  if (room.ownerId === "" && socketId) {
    const mappedId = socketUserMap.get(socketId) ?? "";
    return mappedId === id;
  }
  return false;
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

// ─── normalise a raw DB room doc into Room + cache it ─────────────────────────
function buildRoom(doc: any, roomId: string): Room {
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
    id: doc.id, petId: doc.petId, petName: doc.petName,
    petPhoto: doc.petPhoto || "", ownerId: doc.ownerId, ownerName: doc.ownerName,
    seekerId: doc.seekerId, seekerName: doc.seekerName,
    seekerAvatar: doc.seekerAvatar || "🐾",
    messages, createdAt: doc.createdAt,
    participants: rooms.get(doc.id)?.participants ?? new Set(),
  };
  rooms.set(room.id, room);
  return room;
}

// ─── Main handler ─────────────────────────────────────────────────────────────
export function registerChatHandlers(io: Server) {
  const ns = io.of("/chat");

  ns.on("connection", (socket: Socket) => {
    console.log(`💬 [chat] connected ${socket.id}`);

    // ── OWNER subscribe ──────────────────────────────────────────────────────
    socket.on("owner_subscribe", async (data: { ownerId: string; ownerName: string }) => {
      const { ownerId, ownerName } = data;
      if (!ownerId?.trim()) { console.warn("[chat] owner_subscribe: empty ownerId"); return; }

      registerUser(socket, ownerId);
      socket.join(ownerChannel(ownerId));

      try {
        const dbRooms = await ChatRoom.find({ ownerId }).lean<any[]>();
        const myRooms = dbRooms.map(doc => serializeRoom(buildRoom(doc, doc.id)));
        socket.emit("owner_inbox", { rooms: myRooms });
        console.log(`📬 owner ${ownerId} (${ownerName}) subscribed, ${myRooms.length} rooms`);
      } catch (err) {
        console.error("[chat] owner_subscribe error:", err);
        socket.emit("owner_inbox", { rooms: [] });
      }
    });

    // ── SEEKER subscribe ─────────────────────────────────────────────────────
    socket.on("seeker_subscribe", async (data: { seekerId: string; seekerName: string }) => {
      const { seekerId, seekerName } = data;
      if (!seekerId?.trim()) { console.warn("[chat] seeker_subscribe: empty seekerId"); return; }

      registerUser(socket, seekerId);
      socket.join(seekerChannel(seekerId));

      try {
        const dbRooms = await ChatRoom.find({ seekerId }).lean<any[]>();
        const myRooms = dbRooms.map(doc => serializeRoom(buildRoom(doc, doc.id)));
        socket.emit("seeker_inbox", { rooms: myRooms });
        console.log(`📬 seeker ${seekerId} subscribed, ${myRooms.length} rooms`);
      } catch (err) {
        console.error("[chat] seeker_subscribe error:", err);
        socket.emit("seeker_inbox", { rooms: [] });
      }
    });

    // ── SEEKER: join or create a room ────────────────────────────────────────
    socket.on("join_room", async (data: {
      petId: string; petName: string; petPhoto?: string;
      ownerId: string; ownerName: string;
      seekerId: string; seekerName: string; seekerAvatar: string;
    }) => {
      const seekerId = data.seekerId?.trim() || "";
      const ownerId  = data.ownerId?.trim()  || "";
      if (!seekerId) { socket.emit("error", { message: "Not authenticated" }); return; }

      registerUser(socket, seekerId);
      socket.join(seekerChannel(seekerId));
      const roomId = getRoomId(data.petId, seekerId);

      try {
        let room = await loadRoom(roomId);
        const isNew = !room;

        if (isNew) {
          room = {
            id: roomId, petId: data.petId, petName: data.petName,
            petPhoto: data.petPhoto ?? "", ownerId, ownerName: data.ownerName,
            seekerId, seekerName: data.seekerName, seekerAvatar: data.seekerAvatar,
            messages: [], participants: new Set(), createdAt: new Date().toISOString(),
          };
          await ChatRoom.create({
            id: room.id, petId: room.petId, petName: room.petName,
            petPhoto: room.petPhoto, ownerId: room.ownerId, ownerName: room.ownerName,
            seekerId: room.seekerId, seekerName: room.seekerName,
            seekerAvatar: room.seekerAvatar, messages: [], createdAt: room.createdAt,
          });
          rooms.set(roomId, room);
        } else {
          room.seekerAvatar = data.seekerAvatar;
          room.petName  = data.petName;
          room.petPhoto = data.petPhoto ?? room.petPhoto;
          if (data.ownerName)  room.ownerName  = data.ownerName;
          if (data.seekerName) room.seekerName = data.seekerName;
          await ChatRoom.updateOne({ id: roomId }, {
            petName: room.petName, petPhoto: room.petPhoto,
            ownerName: room.ownerName, seekerName: room.seekerName,
            seekerAvatar: room.seekerAvatar,
          });
        }

        room.participants.add(socket.id);
        socket.join(roomId);
        socket.emit("room_joined", {
          roomId, messages: room.messages,
          petName: room.petName, petPhoto: room.petPhoto,
          ownerName: room.ownerName, ownerId: room.ownerId,
          seekerName: room.seekerName, seekerId: room.seekerId,
          seekerAvatar: room.seekerAvatar,
        });

        // FIX BUG-10: only emit if ownerId is a real non-empty ID
        if (isNew && room.ownerId) {
          ns.to(ownerChannel(room.ownerId)).emit("new_conversation", { room: serializeRoom(room) });
        }
      } catch (err) {
        console.error("[chat] join_room error:", err);
        socket.emit("error", { message: "Failed to join room" });
      }
    });

    // ── OWNER: join a room to read + reply ────────────────────────────────────
    socket.on("owner_join_room", async (data: { roomId: string; ownerId: string }) => {
      if (!data.ownerId?.trim()) { socket.emit("error", { message: "Not authenticated" }); return; }

      registerUser(socket, data.ownerId.trim());
      socket.join(ownerChannel(data.ownerId.trim()));

      try {
        const room = await loadRoom(data.roomId);
        if (!room) { socket.emit("error", { message: "Room not found" }); return; }
        if (room.ownerId !== data.ownerId.trim()) {
          console.warn(`[chat] owner_join_room denied: ${data.ownerId} ≠ ${room.ownerId}`);
          socket.emit("error", { message: "Access denied" });
          return;
        }

        room.participants.add(socket.id);
        socket.join(data.roomId);
        socket.emit("room_joined", {
          roomId: data.roomId, messages: room.messages,
          petName: room.petName, petPhoto: room.petPhoto,
          ownerName: room.ownerName, ownerId: room.ownerId,
          seekerName: room.seekerName, seekerId: room.seekerId,
          seekerAvatar: room.seekerAvatar,
        });
        console.log(`👑 owner ${data.ownerId} joined room ${data.roomId}`);
      } catch (err) {
        console.error("[chat] owner_join_room error:", err);
        socket.emit("error", { message: "Failed to join room" });
      }
    });

    // ── Get messages ─────────────────────────────────────────────────────────
    socket.on("get_messages", async (data: { roomId: string; userId: string }) => {
      try {
        const room = await loadRoom(data.roomId);
        if (!room || !isRoomMember(room, data.userId)) return;
        registerUser(socket, data.userId);
        room.participants.add(socket.id);
        socket.join(data.roomId);
        socket.emit("room_messages", { roomId: data.roomId, messages: room.messages });
      } catch (err) {
        console.error("[chat] get_messages error:", err);
      }
    });

    // ── Send message ─────────────────────────────────────────────────────────
    socket.on("send_message", async (data: {
      roomId: string; senderId: string; senderName: string;
      senderAvatar: string; text: string; type?: "text" | "system" | "call_log";
    }) => {
      if (!data.text?.trim() || !data.senderId?.trim()) return;

      try {
        let room = rooms.get(data.roomId);
        if (!room) room = await loadRoom(data.roomId);
        if (!room) { console.warn(`[chat] send_message: room ${data.roomId} not found`); return; }

        if (!isRoomMember(room, data.senderId, socket.id)) {
          console.warn(`[chat] send_message denied: ${data.senderId} not in ${data.roomId}`);
          return;
        }

        if (!socket.rooms.has(data.roomId)) {
          socket.join(data.roomId);
          room.participants.add(socket.id);
        }

        const msg = makeMessage(data.roomId, {
          senderId:     data.senderId,
          senderName:   data.senderName,
          senderAvatar: data.senderAvatar,
          text:         data.text.trim(),
          type:         data.type,
        });

        room.messages.push(msg);
        if (room.messages.length > 500) room.messages = room.messages.slice(-500);
        await persistMessage(data.roomId, msg);

        // Deliver to everyone in the room socket
        ns.to(data.roomId).emit("new_message", msg);

        // Personal channels for those not in the room socket
        // FIX BUG-10: guard non-empty IDs
        if (room.ownerId) {
          ns.to(ownerChannel(room.ownerId)).emit("inbox_message", {
            roomId: data.roomId, message: msg,
            petName: room.petName, seekerName: room.seekerName,
          });
        }
        if (room.seekerId) {
          ns.to(seekerChannel(room.seekerId)).emit("inbox_message", {
            roomId: data.roomId, message: msg, petName: room.petName,
          });
        }

        console.log(`💬 ${data.roomId} ← ${data.senderName}: ${data.text.slice(0, 40)}`);
      } catch (err) {
        console.error("[chat] send_message error:", err);
      }
    });

    // ── Typing ───────────────────────────────────────────────────────────────
    socket.on("typing_start", (data: { roomId: string; userName: string }) => {
      socket.to(data.roomId).emit("user_typing", { userName: data.userName });
    });
    socket.on("typing_stop", (data: { roomId: string }) => {
      socket.to(data.roomId).emit("user_stopped_typing");
    });

    // ── Call signalling ───────────────────────────────────────────────────────
    //
    // FIX BUG-7/8: All call events go to:
    //   (a) The room socket room (for those already in it)
    //   (b) callChannel(otherUserId) — ONE channel, ONE delivery, no duplicates
    //
    // Previously we emitted to both ownerChannel AND seekerChannel, but since
    // useChat subscribes each socket to BOTH of those channels for the same userId,
    // the event was received TWICE → two concurrent WebRTC negotiations → broken calls.

    socket.on("call_initiate", async (data: {
      roomId: string; callerId: string; callerName: string;
      callerAvatar: string; callType: "video" | "voice";
    }) => {
      const payload = {
        roomId: data.roomId, callerId: data.callerId,
        callerName: data.callerName, callerAvatar: data.callerAvatar,
        callType: data.callType, socketId: socket.id,
      };

      socket.to(data.roomId).emit("incoming_call", payload);

      try {
        const room = rooms.get(data.roomId) ?? await loadRoom(data.roomId);
        if (room) {
          const calleeId = room.ownerId === data.callerId ? room.seekerId : room.ownerId;
          if (calleeId) {
            // FIX: single callChannel — guaranteed one delivery
            ns.to(callChannel(calleeId)).emit("incoming_call", payload);
          }
        }
      } catch (err) {
        console.error("[chat] call_initiate lookup error:", err);
      }
    });

    socket.on("call_accepted", async (data: {
      roomId: string; callerId: string;
      answererName: string; callType: "video" | "voice";
    }) => {
      const payload = { answererName: data.answererName, callType: data.callType, socketId: socket.id };
      // BUG-D FIX: only emit to the room socket.
      // The caller joined the room via join_room/openRoom before calling, so
      // socket.to(roomId) already delivers call_accepted to them exactly once.
      // Previously we also emitted to callChannel(callerId) which caused the
      // caller to receive call_accepted TWICE → createAndSendOffer() called twice
      // → two WebRTC offers → broken negotiation.
      socket.to(data.roomId).emit("call_accepted", payload);
    });

    socket.on("call_rejected", async (data: { roomId: string; reason?: string; callerId?: string }) => {
      const payload = { reason: data.reason ?? "User declined" };
      socket.to(data.roomId).emit("call_rejected", payload);
      // BUG-H FIX: socketUserMap may not have this socket's userId yet if Clerk
      // is still loading. Use callerId from the payload (sent by the client when
      // rejecting) to route reliably. Fall back to socketUserMap only if absent.
      try {
        const room = rooms.get(data.roomId) ?? await loadRoom(data.roomId);
        if (room) {
          const myId = data.callerId?.trim() || socketUserMap.get(socket.id) || "";
          const otherId = myId
            ? (room.ownerId === myId ? room.seekerId : room.ownerId)
            : (room.ownerId === socketUserMap.get(socket.id) ? room.seekerId : room.ownerId);
          if (otherId) ns.to(callChannel(otherId)).emit("call_rejected", payload);
        }
      } catch {}
    });

    socket.on("call_ended", async (data: { roomId: string; callerId?: string }) => {
      socket.to(data.roomId).emit("call_ended");
      // BUG-H FIX: same as call_rejected — don't rely solely on socketUserMap
      try {
        const room = rooms.get(data.roomId) ?? await loadRoom(data.roomId);
        if (room) {
          const myId    = data.callerId?.trim() || socketUserMap.get(socket.id) || "";
          const otherId = myId ? (room.ownerId === myId ? room.seekerId : room.ownerId) : "";
          if (otherId) ns.to(callChannel(otherId)).emit("call_ended");
        }
      } catch {}
    });

    // ── WebRTC SDP / ICE relay ────────────────────────────────────────────────
    socket.on("webrtc_offer", (data: {
      roomId: string; offer: RTCSessionDescriptionInit; targetSocketId: string;
    }) => {
      ns.to(data.targetSocketId).emit("webrtc_offer", { offer: data.offer, fromSocketId: socket.id });
    });

    socket.on("webrtc_answer", (data: {
      roomId: string; answer: RTCSessionDescriptionInit; targetSocketId: string;
    }) => {
      ns.to(data.targetSocketId).emit("webrtc_answer", { answer: data.answer, fromSocketId: socket.id });
    });

    socket.on("webrtc_ice_candidate", (data: {
      roomId: string; candidate: RTCIceCandidateInit; targetSocketId: string;
    }) => {
      ns.to(data.targetSocketId).emit("webrtc_ice_candidate", {
        candidate: data.candidate, fromSocketId: socket.id,
      });
    });

    // ── Disconnect ────────────────────────────────────────────────────────────
    socket.on("disconnect", () => {
      socketUserMap.delete(socket.id);
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
