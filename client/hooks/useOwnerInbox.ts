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
  unreadCount:  number;
  isOpen:       boolean;
}

interface UseOwnerInboxOptions {
  ownerId:     string;
  ownerName:   string;
  ownerAvatar: string;
  enabled:     boolean;
}

function sortRooms(rooms: InboxRoom[]): InboxRoom[] {
  return [...rooms].sort((a, b) => {
    const la = a.messages[a.messages.length - 1]?.timestamp ?? a.createdAt;
    const lb = b.messages[b.messages.length - 1]?.timestamp ?? b.createdAt;
    return lb.localeCompare(la);
  });
}

function dedupeAndReplace(prev: ChatMessage[], msg: ChatMessage): ChatMessage[] {
  if (prev.some(m => m.id === msg.id)) return prev;
  const optIdx = prev.findIndex(
    m => m.id.startsWith("opt_") &&
      m.senderId === msg.senderId &&
      m.text === msg.text &&
      Math.abs(new Date(m.timestamp).getTime() - new Date(msg.timestamp).getTime()) < 10000
  );
  if (optIdx !== -1) {
    const next = [...prev];
    next[optIdx] = msg;
    return next;
  }
  return [...prev, msg];
}

export function useOwnerInbox({ ownerId, ownerName, ownerAvatar, enabled }: UseOwnerInboxOptions) {
  const socketRef     = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [rooms,       setRooms]       = useState<InboxRoom[]>([]);
  const [activeRoomId,setActiveRoomId]= useState<string | null>(null);
  const [totalUnread, setTotalUnread] = useState(0);
  // FIX BUG-11: expose typing state so OwnerInbox can show typing indicator
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({}); // roomId → userName

  const activeRoomIdRef = useRef<string | null>(null);
  const ownerIdRef      = useRef(ownerId);
  const ownerNameRef    = useRef(ownerName);
  const ownerAvatarRef  = useRef(ownerAvatar);
  useEffect(() => { ownerIdRef.current     = ownerId;     }, [ownerId]);
  useEffect(() => { ownerNameRef.current   = ownerName;   }, [ownerName]);
  useEffect(() => { ownerAvatarRef.current = ownerAvatar; }, [ownerAvatar]);

  const handleSetActiveRoomId = useCallback((id: string | null) => {
    activeRoomIdRef.current = id;
    setActiveRoomId(id);
  }, []);

  useEffect(() => {
    setTotalUnread(rooms.reduce((s, r) => s + r.unreadCount, 0));
  }, [rooms]);

  useEffect(() => {
    if (!enabled || !ownerId?.trim()) return;

    const socket = io("/chat", { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    const doSubscribe = () => {
      const id   = ownerIdRef.current;
      const name = ownerNameRef.current;
      if (!id?.trim() || !socket.connected) return;
      socket.emit("owner_subscribe", { ownerId: id, ownerName: name });
    };

    socket.on("connect",    () => { setIsConnected(true);  doSubscribe(); });
    socket.on("disconnect", () =>   setIsConnected(false));

    socket.on("owner_inbox", (data: { rooms: Omit<InboxRoom, "unreadCount"|"isOpen">[] }) => {
      setRooms(sortRooms(data.rooms.map(r => ({ ...r, unreadCount: 0, isOpen: false }))));
    });

    socket.on("new_conversation", (data: { room: Omit<InboxRoom, "unreadCount"|"isOpen"> }) => {
      setRooms(prev => {
        if (prev.some(r => r.id === data.room.id)) return prev;
        return sortRooms([{ ...data.room, unreadCount: 1, isOpen: false }, ...prev]);
      });
    });

    socket.on("inbox_message", (data: { roomId: string; message: ChatMessage }) => {
      setRooms(prev => sortRooms(prev.map(room => {
        if (room.id !== data.roomId) return room;
        return { ...room, messages: dedupeAndReplace(room.messages, data.message) };
      })));
    });

    socket.on("new_message", (msg: ChatMessage) => {
      setRooms(prev => sortRooms(prev.map(room => {
        if (room.id !== msg.roomId) return room;
        const updatedMessages = dedupeAndReplace(room.messages, msg);
        return {
          ...room,
          messages: updatedMessages,
          unreadCount: activeRoomIdRef.current === msg.roomId ? 0 : room.unreadCount + 1,
        };
      })));
    });

    // FIX BUG-11: listen for typing events and expose them via typingUsers state
    socket.on("user_typing", (data: { userName: string }) => {
      const roomId = activeRoomIdRef.current;
      if (!roomId) return;
      setTypingUsers(prev => ({ ...prev, [roomId]: data.userName }));
    });

    socket.on("user_stopped_typing", () => {
      const roomId = activeRoomIdRef.current;
      if (!roomId) return;
      setTypingUsers(prev => {
        const next = { ...prev };
        delete next[roomId];
        return next;
      });
    });

    return () => { socket.disconnect(); };
  }, [enabled, ownerId]);

  // Re-subscribe when ownerId becomes available (Clerk async load)
  useEffect(() => {
    if (!ownerId?.trim()) return;
    const s = socketRef.current;
    if (!s?.connected) return;
    s.emit("owner_subscribe", { ownerId, ownerName });
  }, [ownerId, ownerName]);

  const openRoom = useCallback((roomId: string) => {
    handleSetActiveRoomId(roomId);
    setRooms(prev => prev.map(r =>
      r.id === roomId ? { ...r, unreadCount: 0, isOpen: true } : { ...r, isOpen: false }
    ));
    // Clear any stale typing indicator when opening a room
    setTypingUsers(prev => {
      const next = { ...prev };
      delete next[roomId];
      return next;
    });
    socketRef.current?.emit("owner_join_room", { roomId, ownerId: ownerIdRef.current });
  }, [handleSetActiveRoomId]);

  const closeRoom = useCallback(() => {
    handleSetActiveRoomId(null);
    setRooms(prev => prev.map(r => ({ ...r, isOpen: false })));
  }, [handleSetActiveRoomId]);

  const sendMessage = useCallback((roomId: string, text: string) => {
    if (!text.trim()) return;
    const id   = ownerIdRef.current;
    const name = ownerNameRef.current;
    const av   = ownerAvatarRef.current;

    const optimistic: ChatMessage = {
      id:           `opt_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
      roomId,
      senderId:     id,
      senderName:   name,
      senderAvatar: av,
      text:         text.trim(),
      timestamp:    new Date().toISOString(),
      type:         "text",
    };
    setRooms(prev => sortRooms(prev.map(r =>
      r.id === roomId ? { ...r, messages: [...r.messages, optimistic] } : r
    )));

    socketRef.current?.emit("send_message", {
      roomId,
      senderId:     id,
      senderName:   name,
      senderAvatar: av,
      text:         text.trim(),
    });
  }, []);

  const sendTypingStart = useCallback((roomId: string) => {
    socketRef.current?.emit("typing_start", { roomId, userName: ownerNameRef.current });
  }, []);

  const sendTypingStop = useCallback((roomId: string) => {
    socketRef.current?.emit("typing_stop", { roomId });
  }, []);

  const activeRoom = rooms.find(r => r.id === activeRoomId) ?? null;
  // Convenience: typing user for the currently active room
  const typingUser = activeRoomId ? (typingUsers[activeRoomId] ?? null) : null;

  return {
    isConnected, rooms, activeRoom, activeRoomId, totalUnread,
    typingUser,   // FIX BUG-11: now exposed so OwnerInbox can render indicator
    openRoom, closeRoom, sendMessage, sendTypingStart, sendTypingStop,
  };
}
