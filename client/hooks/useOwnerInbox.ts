import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { ChatMessage } from "./useChat";

export interface InboxRoom {
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
  // client-only
  unreadCount: number;
  isOpen: boolean;
}

interface UseOwnerInboxOptions {
  ownerId: string;
  ownerName: string;
  ownerAvatar: string;
  /** Only start connecting when enabled=true (owner is logged in) */
  enabled: boolean;
}

export function useOwnerInbox({
  ownerId,
  ownerName,
  ownerAvatar,
  enabled,
}: UseOwnerInboxOptions) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [rooms, setRooms] = useState<InboxRoom[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [totalUnread, setTotalUnread] = useState(0);

  // Recompute totalUnread whenever rooms change
  useEffect(() => {
    setTotalUnread(rooms.reduce((sum, r) => sum + r.unreadCount, 0));
  }, [rooms]);

  useEffect(() => {
    if (!enabled || !ownerId) return;

    const socket = io("/chat", {
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      // Subscribe to owner inbox immediately on connect
      socket.emit("owner_subscribe", { ownerId, ownerName });
    });

    socket.on("disconnect", () => setIsConnected(false));

    // Full inbox snapshot on first connect
    socket.on(
      "owner_inbox",
      (data: { rooms: Omit<InboxRoom, "unreadCount" | "isOpen">[] }) => {
        setRooms(
          data.rooms.map((r) => ({
            ...r,
            unreadCount: 0,
            isOpen: false,
          }))
        );
      }
    );

    // A seeker started a brand-new conversation
    socket.on(
      "new_conversation",
      (data: { room: Omit<InboxRoom, "unreadCount" | "isOpen"> }) => {
        setRooms((prev) => {
          if (prev.some((r) => r.id === data.room.id)) return prev;
          return [
            { ...data.room, unreadCount: 0, isOpen: false },
            ...prev,
          ];
        });
      }
    );

    // A new message arrived in one of the owner's rooms
    socket.on(
      "inbox_message",
      (data: {
        roomId: string;
        message: ChatMessage;
        seekerName: string;
        petName: string;
      }) => {
        setRooms((prev) =>
          prev.map((room) => {
            if (room.id !== data.roomId) return room;
            const alreadyExists = room.messages.some(
              (m) => m.id === data.message.id
            );
            return {
              ...room,
              messages: alreadyExists
                ? room.messages
                : [...room.messages, data.message],
              // Only increment unread if this room is not currently open
              unreadCount:
                activeRoomId === data.roomId
                  ? 0
                  : room.unreadCount + 1,
            };
          })
        );
      }
    );

    // Direct room messages (when owner has actively joined a room)
    socket.on("new_message", (msg: ChatMessage) => {
      setRooms((prev) =>
        prev.map((room) => {
          if (room.id !== msg.roomId) return room;
          if (room.messages.some((m) => m.id === msg.id)) return room;
          return {
            ...room,
            messages: [...room.messages, msg],
          };
        })
      );
    });

    // Seeker typing
    socket.on("user_typing", ({ userName }: { userName: string }) => {
      // Handled at component level via activeRoomId
    });

    socket.on("user_stopped_typing", () => {});

    return () => {
      socket.disconnect();
    };
  }, [enabled, ownerId, ownerName]);

  // ── Open a conversation ───────────────────────────────────────────────────
  const openRoom = useCallback(
    (roomId: string) => {
      setActiveRoomId(roomId);

      // Clear unread for this room
      setRooms((prev) =>
        prev.map((r) => (r.id === roomId ? { ...r, unreadCount: 0, isOpen: true } : { ...r, isOpen: false }))
      );

      // Join the socket room so we receive real-time messages
      socketRef.current?.emit("owner_join_room", { roomId, ownerId, ownerName });
    },
    [ownerId, ownerName]
  );

  const closeRoom = useCallback(() => {
    setActiveRoomId(null);
    setRooms((prev) => prev.map((r) => ({ ...r, isOpen: false })));
  }, []);

  // ── Send a reply ──────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    (roomId: string, text: string) => {
      if (!text.trim()) return;
      socketRef.current?.emit("send_message", {
        roomId,
        senderId: ownerId,
        senderName: ownerName,
        senderAvatar: ownerAvatar,
        text: text.trim(),
      });
    },
    [ownerId, ownerName, ownerAvatar]
  );

  const sendTypingStart = useCallback(
    (roomId: string) => {
      socketRef.current?.emit("typing_start", { roomId, userName: ownerName });
    },
    [ownerName]
  );

  const sendTypingStop = useCallback((roomId: string) => {
    socketRef.current?.emit("typing_stop", { roomId });
  }, []);

  const activeRoom = rooms.find((r) => r.id === activeRoomId) ?? null;

  return {
    isConnected,
    rooms,
    activeRoom,
    activeRoomId,
    totalUnread,
    openRoom,
    closeRoom,
    sendMessage,
    sendTypingStart,
    sendTypingStop,
  };
}
