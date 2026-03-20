import { Server, Socket } from "socket.io";
import { ChatRoom } from "../models/Chat.js";

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

export interface SerializedRoom {
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

interface Room extends SerializedRoom {
  participants: Set<string>;
}

// ─── In-memory stores ─────────────────────────────────────────────────────────
const rooms = new Map<string, Room>();

// userId → personal notification channel socket room name
function ownerChannel(ownerId: string)  { return `owner_${ownerId}`; }
function ownerNameChannel(ownerName: string) { return `owner_name_${ownerName}`; }
function seekerChannel(seekerId: string){ return `seeker_${seekerId}`; }

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function getRoomId(petId: string, seekerId: string): string {
  return `pet_${petId}_seeker_${seekerId}`;
}

async function loadRoom(roomId: string): Promise<Room | undefined> {
  if (rooms.has(roomId)) return rooms.get(roomId);
  const doc = await ChatRoom.findOne({ id: roomId }).lean();
  if (!doc) return undefined;
  const room: Room = {
    ...doc,
    participants: new Set<string>(),
  };
  rooms.set(roomId, room);
  return room;
}

function serializeRoom(room: Room): SerializedRoom {
  return {
    id:          room.id,
    petId:       room.petId,
    petName:     room.petName,
    petPhoto:    room.petPhoto,
    ownerId:     room.ownerId,
    ownerName:   room.ownerName,
    seekerId:    room.seekerId,
    seekerName:  room.seekerName,
    seekerAvatar:room.seekerAvatar,
    messages:    room.messages,
    createdAt:   room.createdAt,
  };
}

function makeMessage(
  roomId: string,
  data: { senderId: string; senderName: string; senderAvatar: string; text: string }
): ChatMessage {
  return {
    id:          `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    roomId,
    senderId:    data.senderId,
    senderName:  data.senderName,
    senderAvatar:data.senderAvatar,
    text:        data.text,
    timestamp:   new Date().toISOString(),
    type:        "text",
  };
}

function isRoomMember(room: Room, userId: string) {
  return (
    room.seekerId === userId ||
    room.seekerName === userId ||
    room.ownerId === userId ||
    room.ownerName === userId
  );
}

async function promoteOwnerId(room: Room, ownerId: string, ownerName: string) {
  if (!room) return;
  if (room.ownerId !== ownerId) {
    // Only promote when the authenticated ownerId appears for the ownerName
    if (room.ownerName === ownerName || room.ownerId === ownerName) {
      room.ownerId = ownerId;
      await ChatRoom.updateOne({ id: room.id }, { ownerId });
    }
  }
}

// ─── Main handler ─────────────────────────────────────────────────────────────
export function registerChatHandlers(io: Server) {
  const ns = io.of("/chat");

  ns.on("connection", (socket: Socket) => {
    console.log(`💬 [chat] connected ${socket.id}`);

    // ── OWNER: subscribe to all their pet rooms ───────────────────────────────
    // Called when owner opens /chat page
    socket.on("owner_subscribe", async (data: { ownerId: string; ownerName: string }) => {
      socket.join(ownerChannel(data.ownerId));
      socket.join(ownerNameChannel(data.ownerName));

      const dbRooms = await ChatRoom.find({
        $or: [
          { ownerId: data.ownerId },
          { ownerName: data.ownerName },
        ],
      }).lean();

      const myRooms = await Promise.all(dbRooms.map(async (doc) => {
        const roomObj: Room = { ...doc, participants: new Set<string>() };
        if (roomObj.ownerId !== data.ownerId && roomObj.ownerName === data.ownerName) {
          roomObj.ownerId = data.ownerId;
          await ChatRoom.updateOne({ id: roomObj.id }, { ownerId: data.ownerId });
        }
        rooms.set(doc.id, roomObj);
        return serializeRoom(roomObj);
      }));

      socket.emit("owner_inbox", { rooms: myRooms });
      console.log(`📬 owner ${data.ownerId} (${data.ownerName}) subscribed, ${myRooms.length} rooms`);
    });

    // ── SEEKER: subscribe to all rooms they started ───────────────────────────
    // Called when seeker opens /chat page
    socket.on("seeker_subscribe", async (data: { seekerId: string; seekerName: string }) => {
      socket.join(seekerChannel(data.seekerId));

      const dbRooms = await ChatRoom.find({ seekerId: data.seekerId }).lean();

      const myRooms = dbRooms.map((doc) => {
        const roomObj: Room = { ...doc, participants: new Set<string>() };
        rooms.set(doc.id, roomObj);
        return serializeRoom(roomObj);
      });

      socket.emit("seeker_inbox", { rooms: myRooms });
      console.log(`📬 seeker ${data.seekerId} subscribed, ${myRooms.length} rooms`);
    });

    // ── SEEKER: create or re-join a room when they like a pet ────────────────
    socket.on("join_room", async (data: {
      petId: string;
      petName: string;
      petPhoto?: string;
      ownerId: string;
      ownerName: string;
      seekerId: string;
      seekerName: string;
      seekerAvatar: string;
    }) => {
      const roomId = getRoomId(data.petId, data.seekerId);

      let room = await loadRoom(roomId);
      if (!room) {
        const doc = await ChatRoom.findOne({ id: roomId }).lean();
        if (doc) {
          room = { ...doc, participants: new Set<string>() };
          rooms.set(roomId, room);
        }
      }

      const isNew = !room;
      if (isNew) {
        room = {
          id:           roomId,
          petId:        data.petId,
          petName:      data.petName,
          petPhoto:     data.petPhoto ?? "",
          ownerId:      data.ownerId,
          ownerName:    data.ownerName,
          seekerId:     data.seekerId,
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
        room.seekerAvatar = data.seekerAvatar;
        room.ownerId = data.ownerId;
        room.ownerName = data.ownerName;
        room.petName = data.petName;
        room.petPhoto = data.petPhoto ?? room.petPhoto;

        await ChatRoom.updateOne({ id: roomId }, {
          petName: room.petName,
          petPhoto: room.petPhoto,
          ownerId: room.ownerId,
          ownerName: room.ownerName,
          seekerAvatar: room.seekerAvatar,
        });
      }

      room.participants.add(socket.id);
      socket.join(roomId);

      // Send full room state back to this seeker
      socket.emit("room_joined", {
        roomId,
        messages:    room.messages,
        petName:     room.petName,
        petPhoto:    room.petPhoto,
        ownerName:   room.ownerName,
        ownerId:     room.ownerId,
        seekerName:  room.seekerName,
        seekerId:    room.seekerId,
        seekerAvatar:room.seekerAvatar,
      });

      // Notify owner about a brand new conversation (inbox side)
      if (isNew) {
        const payload = { room: serializeRoom(room) };
        const ownerNotifyId = room.ownerId || room.ownerName;
        ns.to(ownerChannel(ownerNotifyId)).emit("new_conversation", payload);
        ns.to(ownerNameChannel(room.ownerName)).emit("new_conversation", payload);
      }

      // Notify others already in the room
      if (!isNew) {
        socket.to(roomId).emit("participant_joined", {
          seekerName:   data.seekerName,
          seekerAvatar: data.seekerAvatar,
        });
      }
    });

    // ── OWNER: join a specific room to read + reply ───────────────────────────
    socket.on("owner_join_room", async (data: { roomId: string; ownerId: string; ownerName?: string }) => {
      let room = rooms.get(data.roomId);
      if (!room) {
        const doc = await ChatRoom.findOne({ id: data.roomId }).lean();
        if (doc) {
          room = { ...doc, participants: new Set<string>() };
          rooms.set(doc.id, room);
        }
      }

      const ownerMatches = room && (room.ownerId === data.ownerId || room.ownerName === data.ownerId || (data.ownerName && room.ownerName === data.ownerName));
      if (!room || !ownerMatches) {
        socket.emit("error", { message: "Room not found or access denied" });
        return;
      }

      await promoteOwnerId(room, data.ownerId, data.ownerName ?? "");

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

      console.log(`👑 owner joined room ${data.roomId}`);
    });

    // ── GET MESSAGES for a specific room (used when switching convs) ──────────
    socket.on("get_messages", async (data: { roomId: string; userId: string }) => {
      let room = rooms.get(data.roomId);
      if (!room) {
        const doc = await ChatRoom.findOne({ id: data.roomId }).lean();
        if (!doc) return;
        room = { ...doc, participants: new Set<string>() };
        rooms.set(room.id, room);
      }

      const isMember = isRoomMember(room, data.userId);
      if (!isMember) return;

      // Join the socket room so future messages arrive
      room.participants.add(socket.id);
      socket.join(data.roomId);

      socket.emit("room_messages", {
        roomId:   data.roomId,
        messages: room.messages,
      });
    });

    // ── SEND MESSAGE ──────────────────────────────────────────────────────────
    socket.on("send_message", async (data: {
      roomId:       string;
      senderId:     string;
      senderName:   string;
      senderAvatar: string;
      text:         string;
    }) => {
      let room = rooms.get(data.roomId);
      if (!room) {
        const doc = await ChatRoom.findOne({ id: data.roomId }).lean();
        if (doc) {
          room = { ...doc, participants: new Set<string>() };
          rooms.set(room.id, room);
        }
      }
      if (!room || !data.text?.trim()) return;

      // Verify sender is a member of this room (supports Clerk IDs + fallback names)
      const isMember = isRoomMember(room, data.senderId);
      if (!isMember) return;

      const msg = makeMessage(data.roomId, {
        senderId:     data.senderId,
        senderName:   data.senderName,
        senderAvatar: data.senderAvatar,
        text:         data.text.trim(),
      });

      room.messages.push(msg);
      if (room.messages.length > 200) room.messages = room.messages.slice(-200);

      await ChatRoom.findOneAndUpdate(
        { id: data.roomId },
        {
          $push: {
            messages: {
              $each: [msg],
              $slice: -200,
            },
          },
        },
        { upsert: true, new: true }
      );

      // 1. Deliver to everyone currently in the socket room (both parties if online)
      ns.to(data.roomId).emit("new_message", msg);

      // 2. Push to owner's notification channel (inbox badge + preview update)
      //    even if they haven't joined this specific room socket yet
      ns.to(ownerChannel(room.ownerId)).emit("inbox_message", {
        roomId:     data.roomId,
        message:    msg,
        petName:    room.petName,
        seekerName: room.seekerName,
      });
      ns.to(ownerNameChannel(room.ownerName)).emit("inbox_message", {
        roomId:     data.roomId,
        message:    msg,
        petName:    room.petName,
        seekerName: room.seekerName,
      });

      // 3. Push to seeker's notification channel too (for their inbox)
      ns.to(seekerChannel(room.seekerId)).emit("inbox_message", {
        roomId:  data.roomId,
        message: msg,
        petName: room.petName,
      });

      console.log(`💬 msg in ${data.roomId} from ${data.senderName}: ${data.text.slice(0, 40)}`);
    });

    // ── TYPING ────────────────────────────────────────────────────────────────
    socket.on("typing_start", (data: { roomId: string; userName: string }) => {
      socket.to(data.roomId).emit("user_typing", { userName: data.userName });
    });

    socket.on("typing_stop", (data: { roomId: string }) => {
      socket.to(data.roomId).emit("user_stopped_typing");
    });

    // ── WebRTC: call initiation ───────────────────────────────────────────────
    socket.on("call_initiate", (data: {
      roomId:      string;
      callerId:    string;
      callerName:  string;
      callerAvatar:string;
      callType:    "video" | "voice";
    }) => {
      socket.to(data.roomId).emit("incoming_call", {
        roomId:       data.roomId,
        callerId:     data.callerId,
        callerName:   data.callerName,
        callerAvatar: data.callerAvatar,
        callType:     data.callType,
        socketId:     socket.id,
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
      socket.to(data.roomId).emit("call_rejected", {
        reason: data.reason ?? "User declined",
      });
    });

    socket.on("call_ended", (data: { roomId: string }) => {
      socket.to(data.roomId).emit("call_ended");
    });

    // ── WebRTC: SDP / ICE relay ───────────────────────────────────────────────
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
      rooms.forEach(room => {
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
