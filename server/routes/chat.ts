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

// ─── In-memory cache (rooms map) ─────────────────────────────────────────────
const rooms = new Map<string, Room>();

// ─── Channel helpers ──────────────────────────────────────────────────────────
function ownerChannel(ownerId: string) { return `owner_${ownerId}`; }
function ownerNameChannel(ownerName: string) { return `owner_name_${ownerName}`; }
function seekerChannel(seekerId: string) { return `seeker_${seekerId}`; }

// ─── Public helper ────────────────────────────────────────────────────────────
export function getRoomId(petId: string, seekerId: string): string {
  return `pet_${petId}_seeker_${seekerId}`;
}

// ─── Load room from DB (always refresh from DB to avoid stale cache) ─────────
async function loadRoom(roomId: string): Promise<Room | undefined> {
  // Always try DB first so we get fresh data after server restart
  try {
    const doc = await ChatRoom.findOne({ id: roomId }).lean<any>();
    if (!doc) return undefined;

    // Normalize messages: ensure each message has correct roomId
    const messages: ChatMessage[] = (doc.messages || []).map((m: any) => ({
      id: m.id || String(m._id),
      roomId: m.roomId || roomId,
      senderId: m.senderId || "",
      senderName: m.senderName || "",
      senderAvatar: m.senderAvatar || "🐾",
      text: m.text || "",
      timestamp: m.timestamp || new Date().toISOString(),
      type: m.type || "text",
    }));

    const room: Room = {
      id: doc.id,
      petId: doc.petId,
      petName: doc.petName,
      petPhoto: doc.petPhoto || "",
      ownerId: doc.ownerId,
      ownerName: doc.ownerName,
      seekerId: doc.seekerId,
      seekerName: doc.seekerName,
      seekerAvatar: doc.seekerAvatar || "🐾",
      messages,
      createdAt: doc.createdAt,
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
    id: room.id,
    petId: room.petId,
    petName: room.petName,
    petPhoto: room.petPhoto,
    ownerId: room.ownerId,
    ownerName: room.ownerName,
    seekerId: room.seekerId,
    seekerName: room.seekerName,
    seekerAvatar: room.seekerAvatar,
    messages: room.messages,
    createdAt: room.createdAt,
  };
}

function makeMessage(
  roomId: string,
  data: {
    senderId: string;
    senderName: string;
    senderAvatar: string;
    text: string;
  }
): ChatMessage {
  return {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    roomId,
    senderId: data.senderId,
    senderName: data.senderName,
    senderAvatar: data.senderAvatar,
    text: data.text,
    timestamp: new Date().toISOString(),
    type: "text",
  };
}

/**
 * FIX: isRoomMember now compares string versions of all IDs/names
 * so it works correctly with both Clerk user IDs and display names.
 */
function isRoomMember(room: Room, userId: string): boolean {
  const id = String(userId).trim();
  return (
    String(room.seekerId).trim() === id ||
    String(room.seekerName).trim() === id ||
    String(room.ownerId).trim() === id ||
    String(room.ownerName).trim() === id
  );
}

/**
 * FIX: Persist message to MongoDB correctly using $push + $slice.
 * Keeps last 500 messages per room.
 */
async function persistMessage(roomId: string, msg: ChatMessage): Promise<void> {
  try {
    await ChatRoom.updateOne(
      { id: roomId },
      {
        $push: {
          messages: {
            $each: [msg],
            $slice: -500, // keep last 500 messages
          },
        },
      }
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
    socket.on(
      "owner_subscribe",
      async (data: { ownerId: string; ownerName: string }) => {
        const { ownerId, ownerName } = data;
        socket.join(ownerChannel(ownerId));
        socket.join(ownerNameChannel(ownerName));

        try {
          // FIX: query by BOTH ownerId and ownerName so we find rooms even if
          // the ownerId was stored as a display name before Clerk auth was set up
          const dbRooms = await ChatRoom.find({
            $or: [
              { ownerId: ownerId },
              { ownerName: ownerName },
            ],
          }).lean<any[]>();

          const myRooms = await Promise.all(
            dbRooms.map(async (doc) => {
              // FIX: normalize messages from DB
              const messages: ChatMessage[] = (doc.messages || []).map(
                (m: any) => ({
                  id: m.id || String(m._id),
                  roomId: m.roomId || doc.id,
                  senderId: m.senderId || "",
                  senderName: m.senderName || "",
                  senderAvatar: m.senderAvatar || "🐾",
                  text: m.text || "",
                  timestamp: m.timestamp || new Date().toISOString(),
                  type: m.type || "text",
                })
              );

              const room: Room = {
                id: doc.id,
                petId: doc.petId,
                petName: doc.petName,
                petPhoto: doc.petPhoto || "",
                ownerId: doc.ownerId,
                ownerName: doc.ownerName,
                seekerId: doc.seekerId,
                seekerName: doc.seekerName,
                seekerAvatar: doc.seekerAvatar || "🐾",
                messages,
                createdAt: doc.createdAt,
                participants: rooms.get(doc.id)?.participants ?? new Set(),
              };

              // If ownerId was stored as name, upgrade it in memory and DB
              if (room.ownerId !== ownerId && room.ownerName === ownerName) {
                room.ownerId = ownerId;
                await ChatRoom.updateOne({ id: room.id }, { ownerId });
              }

              rooms.set(room.id, room);
              return serializeRoom(room);
            })
          );

          // Auto-join all room socket channels so owner gets new_message in real-time
          myRooms.forEach((r) => socket.join(r.id));

          socket.emit("owner_inbox", { rooms: myRooms });
          console.log(
            `📬 owner ${ownerId} (${ownerName}) subscribed, ${myRooms.length} rooms`
          );
        } catch (err) {
          console.error("[chat] owner_subscribe error:", err);
          socket.emit("owner_inbox", { rooms: [] });
        }
      }
    );

    // ── SEEKER: subscribe to their inbox ─────────────────────────────────────
    socket.on(
      "seeker_subscribe",
      async (data: { seekerId: string; seekerName: string }) => {
        const { seekerId, seekerName } = data;
        socket.join(seekerChannel(seekerId));

        try {
          const dbRooms = await ChatRoom.find({
            $or: [
              { seekerId: seekerId },
              { seekerName: seekerName },
            ],
          }).lean<any[]>();

          const myRooms = dbRooms.map((doc) => {
            const messages: ChatMessage[] = (doc.messages || []).map(
              (m: any) => ({
                id: m.id || String(m._id),
                roomId: m.roomId || doc.id,
                senderId: m.senderId || "",
                senderName: m.senderName || "",
                senderAvatar: m.senderAvatar || "🐾",
                text: m.text || "",
                timestamp: m.timestamp || new Date().toISOString(),
                type: m.type || "text",
              })
            );

            const room: Room = {
              id: doc.id,
              petId: doc.petId,
              petName: doc.petName,
              petPhoto: doc.petPhoto || "",
              ownerId: doc.ownerId,
              ownerName: doc.ownerName,
              seekerId: doc.seekerId,
              seekerName: doc.seekerName,
              seekerAvatar: doc.seekerAvatar || "🐾",
              messages,
              createdAt: doc.createdAt,
              participants: rooms.get(doc.id)?.participants ?? new Set(),
            };
            rooms.set(room.id, room);
            return serializeRoom(room);
          });

          // Auto-join all room socket channels so seeker gets new_message in real-time
          myRooms.forEach((r) => socket.join(r.id));

          socket.emit("seeker_inbox", { rooms: myRooms });
          console.log(
            `📬 seeker ${seekerId} subscribed, ${myRooms.length} rooms`
          );
        } catch (err) {
          console.error("[chat] seeker_subscribe error:", err);
          socket.emit("seeker_inbox", { rooms: [] });
        }
      }
    );

    // ── SEEKER: join or create a room when they like a pet ───────────────────
    socket.on(
      "join_room",
      async (data: {
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

        try {
          // Always load fresh from DB
          let room = await loadRoom(roomId);
          const isNew = !room;

          if (isNew) {
            room = {
              id: roomId,
              petId: data.petId,
              petName: data.petName,
              petPhoto: data.petPhoto ?? "",
              ownerId: data.ownerId,
              ownerName: data.ownerName,
              seekerId: data.seekerId,
              seekerName: data.seekerName,
              seekerAvatar: data.seekerAvatar,
              messages: [],
              participants: new Set(),
              createdAt: new Date().toISOString(),
            };

            // Persist new room to MongoDB
            await ChatRoom.create({
              id: room.id,
              petId: room.petId,
              petName: room.petName,
              petPhoto: room.petPhoto,
              ownerId: room.ownerId,
              ownerName: room.ownerName,
              seekerId: room.seekerId,
              seekerName: room.seekerName,
              seekerAvatar: room.seekerAvatar,
              messages: [],
              createdAt: room.createdAt,
            });

            rooms.set(roomId, room);
          } else {
            // Update mutable fields
            room.seekerAvatar = data.seekerAvatar;
            room.petName = data.petName;
            room.petPhoto = data.petPhoto ?? room.petPhoto;

            // Only upgrade ownerId if it looks like a display name
            if (data.ownerId && data.ownerId !== room.ownerId) {
              room.ownerId = data.ownerId;
            }
            if (data.ownerName && data.ownerName !== room.ownerName) {
              room.ownerName = data.ownerName;
            }

            await ChatRoom.updateOne(
              { id: roomId },
              {
                petName: room.petName,
                petPhoto: room.petPhoto,
                ownerId: room.ownerId,
                ownerName: room.ownerName,
                seekerAvatar: room.seekerAvatar,
              }
            );
          }

          room.participants.add(socket.id);
          socket.join(roomId);

          // Send full room history back to the seeker
          socket.emit("room_joined", {
            roomId,
            messages: room.messages,
            petName: room.petName,
            petPhoto: room.petPhoto,
            ownerName: room.ownerName,
            ownerId: room.ownerId,
            seekerName: room.seekerName,
            seekerId: room.seekerId,
            seekerAvatar: room.seekerAvatar,
          });

          // Notify owner of new conversation
          if (isNew) {
            const payload = { room: serializeRoom(room) };
            ns.to(ownerChannel(room.ownerId)).emit("new_conversation", payload);
            ns.to(ownerNameChannel(room.ownerName)).emit(
              "new_conversation",
              payload
            );
          }
        } catch (err) {
          console.error("[chat] join_room error:", err);
          socket.emit("error", { message: "Failed to join room" });
        }
      }
    );

    // ── OWNER: join a specific room to read + reply ───────────────────────────
    socket.on(
      "owner_join_room",
      async (data: {
        roomId: string;
        ownerId: string;
        ownerName?: string;
      }) => {
        try {
          // FIX: always load fresh from DB so history is available after restart
          const room = await loadRoom(data.roomId);

          if (!room) {
            socket.emit("error", { message: "Room not found" });
            return;
          }

          // FIX: check membership by both ID and name to handle display-name owners
          const ownerMatches =
            room.ownerId === data.ownerId ||
            room.ownerName === data.ownerId ||
            (data.ownerName &&
              (room.ownerName === data.ownerName ||
                room.ownerId === data.ownerName));

          if (!ownerMatches) {
            console.warn(
              `[chat] owner_join_room denied: ownerId=${data.ownerId} ownerName=${data.ownerName} room.ownerId=${room.ownerId} room.ownerName=${room.ownerName}`
            );
            socket.emit("error", { message: "Access denied" });
            return;
          }

          // Upgrade ownerId if it was stored as display name
          if (data.ownerId && room.ownerId !== data.ownerId) {
            room.ownerId = data.ownerId;
            await ChatRoom.updateOne({ id: data.roomId }, { ownerId: data.ownerId });
          }

          room.participants.add(socket.id);
          socket.join(data.roomId);

          socket.emit("room_joined", {
            roomId: data.roomId,
            messages: room.messages,
            petName: room.petName,
            petPhoto: room.petPhoto,
            ownerName: room.ownerName,
            ownerId: room.ownerId,
            seekerName: room.seekerName,
            seekerId: room.seekerId,
            seekerAvatar: room.seekerAvatar,
          });

          console.log(`👑 owner joined room ${data.roomId}`);
        } catch (err) {
          console.error("[chat] owner_join_room error:", err);
          socket.emit("error", { message: "Failed to join room" });
        }
      }
    );

    // ── GET MESSAGES for a room ───────────────────────────────────────────────
    socket.on(
      "get_messages",
      async (data: { roomId: string; userId: string }) => {
        try {
          // FIX: always load from DB for fresh history
          const room = await loadRoom(data.roomId);
          if (!room) return;

          if (!isRoomMember(room, data.userId)) return;

          room.participants.add(socket.id);
          socket.join(data.roomId);

          socket.emit("room_messages", {
            roomId: data.roomId,
            messages: room.messages,
          });
        } catch (err) {
          console.error("[chat] get_messages error:", err);
        }
      }
    );

    // ── SEND MESSAGE ──────────────────────────────────────────────────────────
    socket.on(
      "send_message",
      async (data: {
        roomId: string;
        senderId: string;
        senderName: string;
        senderAvatar: string;
        text: string;
      }) => {
        if (!data.text?.trim()) return;

        try {
          // FIX: load room from DB if not in memory
          let room = rooms.get(data.roomId);
          if (!room) {
            room = await loadRoom(data.roomId);
          }
          if (!room) {
            console.warn(`[chat] send_message: room ${data.roomId} not found`);
            return;
          }

          // Check membership
          if (!isRoomMember(room, data.senderId)) {
            console.warn(
              `[chat] send_message: sender ${data.senderId} not member of ${data.roomId}`
            );
            return;
          }

          // Auto-join the socket room so the sender gets their own new_message echo
          // This handles the case where join_room completed but the socket
          // was not explicitly added to the room (e.g. page reload race)
          if (!socket.rooms.has(data.roomId)) {
            socket.join(data.roomId);
            room.participants.add(socket.id);
          }

          const msg = makeMessage(data.roomId, {
            senderId: data.senderId,
            senderName: data.senderName,
            senderAvatar: data.senderAvatar,
            text: data.text.trim(),
          });

          // Update in-memory cache
          room.messages.push(msg);
          if (room.messages.length > 500) {
            room.messages = room.messages.slice(-500);
          }

          // FIX: persist to MongoDB correctly
          await persistMessage(data.roomId, msg);

          // 1. Deliver to everyone already in the socket room (both parties if online)
          ns.to(data.roomId).emit("new_message", msg);

          // 2. Push via notification channels — guaranteed delivery regardless of
          //    whether the socket has joined the room directly.
          //    Both owner AND seeker get inbox_message so real-time works for both.
          const inboxPayload = {
            roomId:     data.roomId,
            message:    msg,
            petName:    room.petName,
            seekerName: room.seekerName,
          };

          // Owner channels
          ns.to(ownerChannel(room.ownerId)).emit("inbox_message", inboxPayload);
          ns.to(ownerNameChannel(room.ownerName)).emit("inbox_message", inboxPayload);

          // Seeker channel
          ns.to(seekerChannel(room.seekerId)).emit("inbox_message", inboxPayload);

          // Also emit back to the sender's own socket directly
          // so they get confirmation even if not in a named channel
          socket.emit("inbox_message", inboxPayload);

          console.log(
            `💬 msg in ${data.roomId} from ${data.senderName}: ${data.text.slice(0, 40)}`
          );
        } catch (err) {
          console.error("[chat] send_message error:", err);
        }
      }
    );

    // ── TYPING ────────────────────────────────────────────────────────────────
    socket.on(
      "typing_start",
      (data: { roomId: string; userName: string }) => {
        socket.to(data.roomId).emit("user_typing", { userName: data.userName });
      }
    );

    socket.on("typing_stop", (data: { roomId: string }) => {
      socket.to(data.roomId).emit("user_stopped_typing");
    });

    // ── WebRTC: call signaling ────────────────────────────────────────────────
    socket.on(
      "call_initiate",
      (data: {
        roomId: string;
        callerId: string;
        callerName: string;
        callerAvatar: string;
        callType: "video" | "voice";
      }) => {
        socket.to(data.roomId).emit("incoming_call", {
          roomId: data.roomId,
          callerId: data.callerId,
          callerName: data.callerName,
          callerAvatar: data.callerAvatar,
          callType: data.callType,
          socketId: socket.id,
        });
      }
    );

    socket.on(
      "call_accepted",
      (data: {
        roomId: string;
        callerId: string;
        answererName: string;
        callType: "video" | "voice";
      }) => {
        socket.to(data.roomId).emit("call_accepted", {
          answererName: data.answererName,
          callType: data.callType,
          socketId: socket.id,
        });
      }
    );

    socket.on(
      "call_rejected",
      (data: { roomId: string; reason?: string }) => {
        socket.to(data.roomId).emit("call_rejected", {
          reason: data.reason ?? "User declined",
        });
      }
    );

    socket.on("call_ended", (data: { roomId: string }) => {
      socket.to(data.roomId).emit("call_ended");
    });

    // ── WebRTC SDP / ICE relay ────────────────────────────────────────────────
    socket.on(
      "webrtc_offer",
      (data: {
        roomId: string;
        offer: RTCSessionDescriptionInit;
        targetSocketId: string;
      }) => {
        ns.to(data.targetSocketId).emit("webrtc_offer", {
          offer: data.offer,
          fromSocketId: socket.id,
        });
      }
    );

    socket.on(
      "webrtc_answer",
      (data: {
        roomId: string;
        answer: RTCSessionDescriptionInit;
        targetSocketId: string;
      }) => {
        ns.to(data.targetSocketId).emit("webrtc_answer", {
          answer: data.answer,
          fromSocketId: socket.id,
        });
      }
    );

    socket.on(
      "webrtc_ice_candidate",
      (data: {
        roomId: string;
        candidate: RTCIceCandidateInit;
        targetSocketId: string;
      }) => {
        ns.to(data.targetSocketId).emit("webrtc_ice_candidate", {
          candidate: data.candidate,
          fromSocketId: socket.id,
        });
      }
    );

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

export function getRooms() {
  return rooms;
}
