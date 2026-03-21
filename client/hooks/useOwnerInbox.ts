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
  unreadCount: number;
  isOpen: boolean;
}

interface UseOwnerInboxOptions {
  ownerId: string;
  ownerName: string;
  ownerAvatar: string;
  enabled: boolean;
}

function getSocketUrl(): string {
  if (typeof window === "undefined") return "";
  return window.location.origin;
}

function getSocketOptions() {
  return {
    transports: ["websocket", "polling"] as ("websocket" | "polling")[],
    path: "/socket.io",
    reconnection: true,
    reconnectionAttempts: 15,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    extraHeaders: {
      "ngrok-skip-browser-warning": "true",
    },
  };
}

export function useOwnerInbox({
  ownerId, ownerName, ownerAvatar, enabled,
}: UseOwnerInboxOptions) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected]   = useState(false);
  const [rooms,       setRooms]         = useState<InboxRoom[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [totalUnread,  setTotalUnread]  = useState(0);

  const activeRoomIdRef = useRef<string | null>(null);
  const handleSetActiveRoomId = useCallback((id: string | null) => {
    activeRoomIdRef.current = id;
    setActiveRoomId(id);
  }, []);

  useEffect(() => {
    setTotalUnread(rooms.reduce((sum, r) => sum + r.unreadCount, 0));
  }, [rooms]);

  useEffect(() => {
    if (!enabled || !ownerId) return;

    const socket = io(`${getSocketUrl()}/chat`, getSocketOptions());
    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("owner_subscribe", { ownerId, ownerName });
    });

    socket.on("connect_error", (err) => {
      console.error("[useOwnerInbox] Connection error:", err.message);
    });

    socket.on("disconnect", (reason) => {
      console.warn("[useOwnerInbox] Disconnected:", reason);
      setIsConnected(false);
    });

    socket.on("owner_inbox", (data: { rooms: Omit<InboxRoom, "unreadCount" | "isOpen">[] }) => {
      setRooms(data.rooms.map((r) => ({ ...r, unreadCount: 0, isOpen: false })));
    });

    socket.on("new_conversation", (data: { room: Omit<InboxRoom, "unreadCount" | "isOpen"> }) => {
      setRooms((prev) => {
        if (prev.some((r) => r.id === data.room.id)) return prev;
        return [{ ...data.room, unreadCount: 1, isOpen: false }, ...prev];
      });
    });

    socket.on("inbox_message", (data: {
      roomId: string; message: ChatMessage; seekerName: string; petName: string;
    }) => {
      setRooms((prev) =>
        prev.map((room) => {
          if (room.id !== data.roomId) return room;
          const alreadyExists = room.messages.some((m) => m.id === data.message.id);
          return {
            ...room,
            messages: alreadyExists ? room.messages : [...room.messages, data.message],
          };
        })
      );
    });

    socket.on("new_message", (msg: ChatMessage) => {
      setRooms((prev) =>
        prev.map((room) => {
          if (room.id !== msg.roomId) return room;
          if (room.messages.some((m) => m.id === msg.id)) return room;
          return {
            ...room,
            messages: [...room.messages, msg],
            unreadCount: activeRoomIdRef.current === msg.roomId ? 0 : room.unreadCount + 1,
          };
        })
      );
    });

    return () => { socket.disconnect(); };
  }, [enabled, ownerId, ownerName]);

  const openRoom = useCallback((roomId: string) => {
    handleSetActiveRoomId(roomId);
    setRooms((prev) =>
      prev.map((r) => r.id === roomId ? { ...r, unreadCount: 0, isOpen: true } : { ...r, isOpen: false })
    );
    socketRef.current?.emit("owner_join_room", { roomId, ownerId, ownerName });
  }, [ownerId, ownerName, handleSetActiveRoomId]);

  const closeRoom = useCallback(() => {
    handleSetActiveRoomId(null);
    setRooms((prev) => prev.map((r) => ({ ...r, isOpen: false })));
  }, [handleSetActiveRoomId]);

  const sendMessage = useCallback((roomId: string, text: string) => {
    if (!text.trim()) return;
    socketRef.current?.emit("send_message", {
      roomId, senderId: ownerId, senderName: ownerName,
      senderAvatar: ownerAvatar, text: text.trim(),
    });
  }, [ownerId, ownerName, ownerAvatar]);

  const sendTypingStart = useCallback((roomId: string) => {
    socketRef.current?.emit("typing_start", { roomId, userName: ownerName });
  }, [ownerName]);

  const sendTypingStop = useCallback((roomId: string) => {
    socketRef.current?.emit("typing_stop", { roomId });
  }, []);

  const activeRoom = rooms.find((r) => r.id === activeRoomId) ?? null;

  return {
    isConnected, rooms, activeRoom, activeRoomId, totalUnread,
    openRoom, closeRoom, sendMessage, sendTypingStart, sendTypingStop,
  };
}
