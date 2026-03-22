import { useState, useEffect, useRef, useCallback } from "react";
import { useUser } from "@clerk/clerk-react";
import { io, Socket } from "socket.io-client";

export interface AppNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  icon: string;
  color: string;
  read: boolean;
  actionUrl: string;
  actionLabel: string;
  metadata: Record<string, any>;
  createdAt: string;
}

export function useNotifications() {
  const { user } = useUser();
  const userId = user?.id;

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading,      setLoading]       = useState(false);
  const [hasMore,      setHasMore]       = useState(false);
  const [isConnected,  setIsConnected]   = useState(false);
  const [justReceived, setJustReceived]  = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const skipRef   = useRef(0);

  // Fetch stored notifications from MongoDB
  const fetchNotifications = useCallback(async (uid: string, reset: boolean) => {
    setLoading(true);
    try {
      const skip = reset ? 0 : skipRef.current;
      const res = await fetch(`/api/notifications?userId=${encodeURIComponent(uid)}&limit=30&skip=${skip}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setNotifications(prev =>
        reset
          ? data.notifications
          : [...prev, ...data.notifications.filter((n: AppNotification) => !prev.some(p => p.id === n.id))]
      );
      setHasMore(data.hasMore ?? false);
      skipRef.current = reset ? data.notifications.length : skipRef.current + data.notifications.length;
    } catch (err) {
      console.error("[notif] fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Socket connection — one per userId session
  useEffect(() => {
    if (!userId) return;

    // Load history from MongoDB immediately
    skipRef.current = 0;
    fetchNotifications(userId, true);

    // Connect to main Socket.io namespace
    const socket = io(window.location.origin, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    const doSubscribe = () => {
      socket.emit("notification_subscribe", { userId });
      console.log("[notif] subscribed, room=user_" + userId + " socketId=" + socket.id);
    };

    socket.on("connect", () => {
      setIsConnected(true);
      doSubscribe();
    });

    socket.on("connect_error", (err) => {
      console.error("[notif] socket connect_error:", err.message);
    });

    socket.on("disconnect", (reason) => {
      setIsConnected(false);
      console.warn("[notif] disconnected:", reason);
    });

    // Real-time notification arrives
    socket.on("notification", (n: AppNotification) => {
      console.log("[notif] 🔔 received:", n.type, n.message);
      setNotifications(prev => prev.some(x => x.id === n.id) ? prev : [n, ...prev]);
      setJustReceived(true);
      setTimeout(() => setJustReceived(false), 3000);
    });

    // Cross-tab sync
    socket.on("notification_read",     ({ id }: { id: string }) =>
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n)));
    socket.on("notifications_read_all", () =>
      setNotifications(prev => prev.map(n => ({ ...n, read: true }))));
    socket.on("notification_deleted",   ({ id }: { id: string }) =>
      setNotifications(prev => prev.filter(n => n.id !== id)));

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [userId, fetchNotifications]);

  // Actions
  const markRead = useCallback(async (id: string) => {
    if (!userId) return;
    setNotifications(p => p.map(n => n.id === id ? { ...n, read: true } : n));
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      socketRef.current?.emit("notification_read", { userId, id });
    } catch {
      setNotifications(p => p.map(n => n.id === id ? { ...n, read: false } : n));
    }
  }, [userId]);

  const markUnread = useCallback(async (id: string) => {
    if (!userId) return;
    setNotifications(p => p.map(n => n.id === id ? { ...n, read: false } : n));
    try {
      await fetch(`/api/notifications/${id}/unread`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
    } catch {
      setNotifications(p => p.map(n => n.id === id ? { ...n, read: true } : n));
    }
  }, [userId]);

  const markAllRead = useCallback(async () => {
    if (!userId) return;
    setNotifications(p => p.map(n => ({ ...n, read: true })));
    try {
      await fetch("/api/notifications/read-all", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      socketRef.current?.emit("notifications_read_all", { userId });
    } catch {
      fetchNotifications(userId, true);
    }
  }, [userId, fetchNotifications]);

  const deleteNotification = useCallback(async (id: string) => {
    if (!userId) return;
    setNotifications(p => p.filter(n => n.id !== id));
    try {
      await fetch(`/api/notifications/${id}`, {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      socketRef.current?.emit("notification_deleted", { userId, id });
    } catch {
      fetchNotifications(userId, true);
    }
  }, [userId, fetchNotifications]);

  const clearAllRead = useCallback(async () => {
    if (!userId) return;
    setNotifications(p => p.filter(n => !n.read));
    try {
      await fetch("/api/notifications/clear-all", {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
    } catch {
      fetchNotifications(userId, true);
    }
  }, [userId, fetchNotifications]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore && userId) fetchNotifications(userId, false);
  }, [loading, hasMore, userId, fetchNotifications]);

  const refresh = useCallback(() => {
    if (!userId) return;
    skipRef.current = 0;
    fetchNotifications(userId, true);
  }, [userId, fetchNotifications]);

  return {
    notifications,
    unreadCount: notifications.filter(n => !n.read).length,
    loading,
    hasMore,
    isConnected,
    justReceived,
    markRead,
    markUnread,
    markAllRead,
    deleteNotification,
    clearAllRead,
    loadMore,
    refresh,
  };
}
