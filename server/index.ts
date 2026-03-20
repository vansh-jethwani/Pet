import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer as createHttpServer } from "http";
import { Server } from "socket.io";
import { handleDemo } from "./routes/demo.js";
import communityRouter from "./routes/community.js";
import petsRouter from "./routes/pets.js";
import { connectDB } from "./db.js";
import { seedDatabase } from "./seed.js";

// Export io so community routes can emit events to all connected clients
export let io: Server;

export async function createApp() {
  await connectDB();
  await seedDatabase();

  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // REST routes
  app.get("/api/ping", (_req, res) => {
    res.json({ message: "ping" });
  });

  app.get("/api/demo", handleDemo);

  app.get("/api/posts", (_req, res) => {
    res.json({ posts: [] });
  });

  app.use("/api/community", communityRouter);
  app.use("/api/pets", petsRouter);

  return app;
}

export function attachSocketServer(httpServer: ReturnType<typeof createHttpServer>) {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    socket.on("disconnect", () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });

  return io;
}
