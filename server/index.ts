import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer as createHttpServer } from "http";
import { Server } from "socket.io";
import { handleDemo }               from "./routes/demo.js";
import communityRouter, { setGetIO as setCommunityIO } from "./routes/community.js";
import petsRouter                   from "./routes/pets.js";
import vetsRouter                   from "./routes/vets.js";
import notificationsRouter          from "./routes/notifications.js";
import { registerChatHandlers }     from "./routes/chat.js";
import { initNotificationService }  from "./models/Notification.js";
import { connectDB }                from "./db.js";
import { seedDatabase }             from "./seed.js";

export let io: Server;

// Safe getter — routes import this function, not io directly.
// Calling getIO() at request time always returns the live io instance.
export function getIO(): Server | undefined {
  return io;
}

export async function createApp() {
  await connectDB();
  await seedDatabase();

  const app = express();

  app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "ngrok-skip-browser-warning"],
  }));

  app.use((_req, res, next) => {
    res.setHeader("ngrok-skip-browser-warning", "true");
    next();
  });

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get("/api/ping",  (_req, res) => res.json({ ok: true }));
  app.get("/api/demo",  handleDemo);
  app.get("/api/posts", (_req, res) => res.json({ posts: [] }));

  app.use("/api/community",     communityRouter);
  app.use("/api/pets",          petsRouter);
  app.use("/api/vets",          vetsRouter);
  app.use("/api/notifications", notificationsRouter);

  return app;
}

export function attachSocketServer(httpServer: ReturnType<typeof createHttpServer>) {
  io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"], credentials: false },
    transports: ["websocket", "polling"],
    pingTimeout: 60000,
    pingInterval: 25000,
    connectTimeout: 45000,
    allowUpgrades: true,
    maxHttpBufferSize: 1e7,
    allowEIO3: true,
  });

  // 1. Init notification service first — _io inside Notification.ts is now set
  initNotificationService(io);

  // 2. Wire getIO() into community router — no more circular import needed
  setCommunityIO(getIO);

  // 3. Main namespace — notification subscriptions + cross-tab sync
  io.on("connection", (socket) => {
    console.log(`🔌 [main] connected: ${socket.id}`);

    socket.on("notification_subscribe", (data: { userId: string }) => {
      const userId = data?.userId;
      if (!userId) return;
      socket.join(`user_${userId}`);
      console.log(`🔔 [notif] socket ${socket.id} → room user_${userId}`);
    });

    socket.on("notification_read", (data: { userId: string; id: string }) => {
      if (!data?.userId) return;
      socket.to(`user_${data.userId}`).emit("notification_read", { id: data.id });
    });

    socket.on("notifications_read_all", (data: { userId: string }) => {
      if (!data?.userId) return;
      socket.to(`user_${data.userId}`).emit("notifications_read_all");
    });

    socket.on("notification_deleted", (data: { userId: string; id: string }) => {
      if (!data?.userId) return;
      socket.to(`user_${data.userId}`).emit("notification_deleted", { id: data.id });
    });

    socket.on("disconnect", (reason) => {
      console.log(`❌ [main] disconnected: ${socket.id} — ${reason}`);
    });
  });

  // 4. /chat namespace for PetChat
  registerChatHandlers(io);

  return io;
}
