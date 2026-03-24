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
  const [loading,       setLoading]       = useState(false);
  const [hasMore,       setHasMore]       = useState(false);
  const [isConnected,   setIsConnected]   = useState(false);
  const [justReceived,  setJustReceived]  = useState(false);

  const socketRef     = useRef<Socket | null>(null);
  const skipRef       = useRef(0);
  // Keep userId in a ref so socket callbacks always see the latest value
  const userIdRef     = useRef<string | undefined>(undefined);
  const wiggleTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { userIdRef.current = userId; }, [userId]);

  // ── Fetch from REST ──────────────────────────────────────────────────────
  const fetchNotifications = useCallback(async (uid: string, reset: boolean) => {
    setLoading(true);
    try {
      const skip = reset ? 0 : skipRef.current;
      const res  = await fetch(
        `/api/notifications?userId=${encodeURIComponent(uid)}&limit=30&skip=${skip}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setNotifications(prev =>
        reset
          ? data.notifications
          : [
              ...prev,
              ...data.notifications.filter(
                (n: AppNotification) => !prev.some(p => p.id === n.id)
              ),
            ]
      );
      setHasMore(data.hasMore ?? false);
      skipRef.current = reset
        ? data.notifications.length
        : skipRef.current + data.notifications.length;
    } catch (err) {
      console.error("[notif] fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Socket setup — recreated when userId changes ──────────────────────────
  useEffect(() => {
    if (!userId) return;

    // Load stored notifications from MongoDB right away
    skipRef.current = 0;
    fetchNotifications(userId, true);

    // Disconnect any previous socket before creating a new one
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    const socket = io(window.location.origin, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      reconnection:         true,
      reconnectionAttempts: Infinity,
      reconnectionDelay:    1000,
      reconnectionDelayMax: 5000,
    });
    socketRef.current = socket;

    // Subscribe helper — called on every (re)connect so the server room is
    // always joined even after a brief disconnection.
    const doSubscribe = () => {
      const uid = userIdRef.current;
      if (!uid) return;
      socket.emit("notification_subscribe", { userId: uid });
      console.log(
        `[notif] subscribed → room=user_${uid} socketId=${socket.id}`
      );
    };

    socket.on("connect", () => {
      setIsConnected(true);
      // doSubscribe on EVERY connect — this covers both the initial connection
      // AND every automatic reconnect. In Socket.io v4 the socket fires
      // "connect" again after each successful reconnection, so a separate
      // "reconnect" listener is not needed (and would target the Manager, not
      // the socket instance).
      doSubscribe();
    });

    socket.on("connect_error", (err) => {
      console.error("[notif] connect_error:", err.message);
    });

    socket.on("disconnect", (reason) => {
      setIsConnected(false);
      console.warn("[notif] disconnected:", reason);
    });

    // ── Real-time notification ──
    socket.on("notification", (n: AppNotification) => {
      console.log("[notif] 🔔 received:", n.type, n.message);
      setNotifications(prev =>
        prev.some(x => x.id === n.id) ? prev : [n, ...prev]
      );
      // Wiggle the bell for 3 s
      if (wiggleTimer.current) clearTimeout(wiggleTimer.current);
      setJustReceived(true);
      wiggleTimer.current = setTimeout(() => setJustReceived(false), 3000);
    });

    // ── Cross-tab sync ──
    socket.on("notification_read", ({ id }: { id: string }) =>
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    );
    socket.on("notifications_read_all", () =>
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    );
    socket.on("notification_deleted", ({ id }: { id: string }) =>
      setNotifications(prev => prev.filter(n => n.id !== id))
    );

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      if (wiggleTimer.current) clearTimeout(wiggleTimer.current);
    };
  }, [userId, fetchNotifications]);

  // ── Actions ──────────────────────────────────────────────────────────────

  const markRead = useCallback(async (id: string) => {
    const uid = userIdRef.current;
    if (!uid) return;
    // Optimistic
    setNotifications(p => p.map(n => n.id === id ? { ...n, read: true } : n));
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: uid }),
      });
      if (!res.ok) throw new Error("failed");
      socketRef.current?.emit("notification_read", { userId: uid, id });
    } catch {
      // Revert on failure
      setNotifications(p => p.map(n => n.id === id ? { ...n, read: false } : n));
    }
  }, []);

  const markUnread = useCallback(async (id: string) => {
    const uid = userIdRef.current;
    if (!uid) return;
    setNotifications(p => p.map(n => n.id === id ? { ...n, read: false } : n));
    try {
      await fetch(`/api/notifications/${id}/unread`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: uid }),
      });
    } catch {
      setNotifications(p => p.map(n => n.id === id ? { ...n, read: true } : n));
    }
  }, []);

  const markAllRead = useCallback(async () => {
    const uid = userIdRef.current;
    if (!uid) return;
    setNotifications(p => p.map(n => ({ ...n, read: true })));
    try {
      await fetch("/api/notifications/read-all", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: uid }),
      });
      socketRef.current?.emit("notifications_read_all", { userId: uid });
    } catch {
      fetchNotifications(uid, true);
    }
  }, [fetchNotifications]);

  const deleteNotification = useCallback(async (id: string) => {
    const uid = userIdRef.current;
    if (!uid) return;
    setNotifications(p => p.filter(n => n.id !== id));
    try {
      await fetch(`/api/notifications/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: uid }),
      });
      socketRef.current?.emit("notification_deleted", { userId: uid, id });
    } catch {
      fetchNotifications(uid, true);
    }
  }, [fetchNotifications]);

  const clearAllRead = useCallback(async () => {
    const uid = userIdRef.current;
    if (!uid) return;
    setNotifications(p => p.filter(n => !n.read));
    try {
      await fetch("/api/notifications/clear-all", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: uid }),
      });
    } catch {
      fetchNotifications(uid, true);
    }
  }, [fetchNotifications]);

  const loadMore = useCallback(() => {
    const uid = userIdRef.current;
    if (!loading && hasMore && uid) fetchNotifications(uid, false);
  }, [loading, hasMore, fetchNotifications]);

  const refresh = useCallback(() => {
    const uid = userIdRef.current;
    if (!uid) return;
    skipRef.current = 0;
    fetchNotifications(uid, true);
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount:  notifications.filter(n => !n.read).length,
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
