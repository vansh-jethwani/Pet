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
import sellersRouter               from "./routes/sellers.js";
import storeRouter                 from "./routes/store.js";
import { registerChatHandlers }    from "./routes/chat.js";
import { initNotificationService } from "./models/Notification.js";
import { connectDB }               from "./db.js";
import { seedDatabase }            from "./seed.js";
import hostingRouter from "./routes/hosting.js";

let _io: Server | undefined;

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
  app.use("/api/sellers",       sellersRouter);
  app.use("/api/store",         storeRouter);

  app.use("/api/hosting", hostingRouter);

  return app;
}

export function attachSocketServer(
  httpServer: ReturnType<typeof createHttpServer>
) {
  const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"], credentials: false },
    transports: ["websocket", "polling"],
    pingTimeout: 60000, pingInterval: 25000, connectTimeout: 45000,
    allowUpgrades: true, maxHttpBufferSize: 1e7, allowEIO3: true,
  });

  _io = io;
  initNotificationService(io);

  io.on("connection", (socket) => {
    console.log(`🔌 [main] connected: ${socket.id}`);

    socket.on("notification_subscribe", (data: { userId: string }) => {
      const userId = data?.userId?.trim();
      if (!userId) return;
      socket.join(`user_${userId}`);
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

  registerChatHandlers(io);
  return io;
}
