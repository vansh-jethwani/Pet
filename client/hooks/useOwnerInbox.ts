/**
 * client/hooks/useOwnerInbox.ts
 *
 * FIX: owner_subscribe now sends ownerId (Clerk user ID) only.
 * The server no longer accepts a name-based fallback, so we must always
 * have a real userId before subscribing. If ownerId is empty we wait.
 *
 * openRoom similarly sends only ownerId to owner_join_room.
 * No display-name is used as an identity or lookup key.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { ChatMessage } from "./useChat";

export interface InboxRoom {
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
  // client-only
  unreadCount:  number;
  isOpen:       boolean;
}

interface UseOwnerInboxOptions {
  ownerId:    string;   // MUST be the Clerk user ID — never a display name
  ownerName:  string;   // display name only, never used as identity key
  ownerAvatar:string;
  enabled:    boolean;
}

export function useOwnerInbox({
  ownerId,
  ownerName,
  ownerAvatar,
  enabled,
}: UseOwnerInboxOptions) {
  const socketRef     = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [rooms,       setRooms]       = useState<InboxRoom[]>([]);
  const [activeRoomId,setActiveRoomId]= useState<string | null>(null);
  const [totalUnread, setTotalUnread] = useState(0);

  // Keep activeRoomId in a ref so socket callbacks always see current value
  const activeRoomIdRef = useRef<string | null>(null);

  const handleSetActiveRoomId = useCallback((id: string | null) => {
    activeRoomIdRef.current = id;
    setActiveRoomId(id);
  }, []);

  useEffect(() => {
    setTotalUnread(rooms.reduce((sum, r) => sum + r.unreadCount, 0));
  }, [rooms]);

  useEffect(() => {
    // FIX: Don't connect at all if we don't have a real user ID.
    // Previously the hook would subscribe using an empty ownerId which the
    // server matched against ownerName — causing cross-account leakage.
    if (!enabled || !ownerId || !ownerId.trim()) return;

    const socket = io("/chat", { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      // FIX: Send only the Clerk user ID. ownerName is for display only.
      socket.emit("owner_subscribe", { ownerId, ownerName });
    });

    socket.on("disconnect", () => setIsConnected(false));

    // Full inbox snapshot on connect
    socket.on("owner_inbox", (data: { rooms: Omit<InboxRoom, "unreadCount" | "isOpen">[] }) => {
      setRooms(
        data.rooms.map((r) => ({ ...r, unreadCount: 0, isOpen: false }))
      );
    });

    // A seeker started a brand-new conversation
    socket.on("new_conversation", (data: { room: Omit<InboxRoom, "unreadCount" | "isOpen"> }) => {
      setRooms((prev) => {
        if (prev.some((r) => r.id === data.room.id)) return prev;
        return [{ ...data.room, unreadCount: 1, isOpen: false }, ...prev];
      });
    });

    // Preview update only — unread count handled by new_message
    socket.on("inbox_message", (data: {
      roomId:  string;
      message: ChatMessage;
    }) => {
      setRooms((prev) =>
        prev.map((room) => {
          if (room.id !== data.roomId) return room;
          const already = room.messages.some((m) => m.id === data.message.id);
          return {
            ...room,
            messages: already ? room.messages : [...room.messages, data.message],
          };
        })
      );
    });

    // Real-time message delivery — single source for unread count
    socket.on("new_message", (msg: ChatMessage) => {
      setRooms((prev) =>
        prev.map((room) => {
          if (room.id !== msg.roomId) return room;
          if (room.messages.some((m) => m.id === msg.id)) return room;
          return {
            ...room,
            messages:    [...room.messages, msg],
            unreadCount: activeRoomIdRef.current === msg.roomId
              ? 0
              : room.unreadCount + 1,
          };
        })
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [enabled, ownerId, ownerName]);

  // ── Open a conversation ───────────────────────────────────────────────────
  const openRoom = useCallback((roomId: string) => {
    handleSetActiveRoomId(roomId);

    setRooms((prev) =>
      prev.map((r) =>
        r.id === roomId
          ? { ...r, unreadCount: 0, isOpen: true }
          : { ...r, isOpen: false }
      )
    );

    // FIX: Send only ownerId to the server — never ownerName as identity
    socketRef.current?.emit("owner_join_room", { roomId, ownerId });
  }, [ownerId, handleSetActiveRoomId]);

  const closeRoom = useCallback(() => {
    handleSetActiveRoomId(null);
    setRooms((prev) => prev.map((r) => ({ ...r, isOpen: false })));
  }, [handleSetActiveRoomId]);

  // ── Send a reply ──────────────────────────────────────────────────────────
  const sendMessage = useCallback((roomId: string, text: string) => {
    if (!text.trim()) return;
    socketRef.current?.emit("send_message", {
      roomId,
      senderId:     ownerId,     // always Clerk user ID
      senderName:   ownerName,
      senderAvatar: ownerAvatar,
      text:         text.trim(),
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
