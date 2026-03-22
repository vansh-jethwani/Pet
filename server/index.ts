import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer as createHttpServer } from "http";
import { Server } from "socket.io";
import { handleDemo }              from "./routes/demo.js";
import communityRouter             from "./routes/community.js";
import petsRouter                  from "./routes/pets.js";
import vetsRouter                  from "./routes/vets.js";
import notificationsRouter         from "./routes/notifications.js";
import { registerChatHandlers }    from "./routes/chat.js";
import { initNotificationService } from "./models/Notification.js";
import { connectDB }               from "./db.js";
import { seedDatabase }            from "./seed.js";

// Single module-level variable — assigned in attachSocketServer().
// All consumers MUST call getIO() at request time. Do NOT destructure/cache
// at import time: ES module re-exports of `let` are not guaranteed to be
// live bindings in all bundlers (esbuild/Vite included).
let _io: Server | undefined;

/** Always returns the live Socket.io instance. Safe to call at any time. */
export function getIO(): Server | undefined {
  return _io;
}

export async function createApp() {
  await connectDB();
  await seedDatabase();

  const app = express();

  app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "ngrok-skip-browser-warning",
    ],
  }));

  app.use((_req, res, next) => {
    res.setHeader("ngrok-skip-browser-warning", "true");
    next();
  });

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check / demo
  app.get("/api/ping",  (_req, res) => res.json({ ok: true }));
  app.get("/api/demo",  handleDemo);
  app.get("/api/posts", (_req, res) => res.json({ posts: [] }));

  // Feature routes
  app.use("/api/community",     communityRouter);
  app.use("/api/pets",          petsRouter);
  app.use("/api/vets",          vetsRouter);
  app.use("/api/notifications", notificationsRouter);

  return app;
}

export function attachSocketServer(
  httpServer: ReturnType<typeof createHttpServer>
) {
  const io = new Server(httpServer, {
    cors: {
      origin:      "*",
      methods:     ["GET", "POST"],
      credentials: false,
    },
    transports:        ["websocket", "polling"],
    pingTimeout:       60000,
    pingInterval:      25000,
    connectTimeout:    45000,
    allowUpgrades:     true,
    maxHttpBufferSize: 1e7,
    allowEIO3:         true,
  });

  // BUG FIX: assign to module-level variable BEFORE any init calls so all
  // imported helpers that call getIO() / getNotificationIO() see the real instance.
  _io = io;

  // BUG FIX: initNotificationService must be called AFTER _io is assigned,
  // so createNotification() can emit immediately (not just log a warning).
  initNotificationService(io);

  // Main namespace — notification subscriptions + cross-tab sync
  io.on("connection", (socket) => {
    console.log(`🔌 [main] connected: ${socket.id}`);

    // Client subscribes to its personal notification room
    socket.on(
      "notification_subscribe",
      (data: { userId: string }) => {
        const userId = data?.userId?.trim();
        if (!userId) return;
        socket.join(`user_${userId}`);
        console.log(
          `🔔 [notif] socket ${socket.id} → room user_${userId}`
        );
      }
    );

    // Cross-tab sync events — broadcast to other tabs of same user
    socket.on(
      "notification_read",
      (data: { userId: string; id: string }) => {
        if (!data?.userId) return;
        socket
          .to(`user_${data.userId}`)
          .emit("notification_read", { id: data.id });
      }
    );

    socket.on(
      "notifications_read_all",
      (data: { userId: string }) => {
        if (!data?.userId) return;
        socket
          .to(`user_${data.userId}`)
          .emit("notifications_read_all");
      }
    );

    socket.on(
      "notification_deleted",
      (data: { userId: string; id: string }) => {
        if (!data?.userId) return;
        socket
          .to(`user_${data.userId}`)
          .emit("notification_deleted", { id: data.id });
      }
    );

    socket.on("disconnect", (reason) => {
      console.log(`❌ [main] disconnected: ${socket.id} — ${reason}`);
    });
  });

  // /chat namespace for PetChat & OwnerInbox
  registerChatHandlers(io);

  return io;
}
