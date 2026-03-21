import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer as createHttpServer } from "http";
import { Server } from "socket.io";
import { handleDemo } from "./routes/demo.js";
import communityRouter from "./routes/community.js";
import petsRouter from "./routes/pets.js";
import { registerChatHandlers } from "./routes/chat.js";
import { connectDB } from "./db.js";
import { seedDatabase } from "./seed.js";

export let io: Server;

export async function createApp() {
  await connectDB();
  await seedDatabase();

  const app = express();

  // ── CORS: allow ALL origins ──────────────────────────────────────────────
  // Required for: same-WiFi LAN, ngrok tunnels, and production deployments.
  app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "ngrok-skip-browser-warning", // skip ngrok's interstitial warning page
    ],
  }));

  // Automatically skip ngrok's browser warning for all responses
  app.use((_req, res, next) => {
    res.setHeader("ngrok-skip-browser-warning", "true");
    next();
  });

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get("/api/ping", (_req, res) => { res.json({ message: "ping" }); });
  app.get("/api/demo", handleDemo);
  app.get("/api/posts", (_req, res) => { res.json({ posts: [] }); });
  app.use("/api/community", communityRouter);
  app.use("/api/pets", petsRouter);

  return app;
}

export function attachSocketServer(httpServer: ReturnType<typeof createHttpServer>) {
  io = new Server(httpServer, {
    // ── Allow connections from ANY origin ──────────────────────────────────
    // Works for: localhost, 192.168.x.x (LAN), ngrok https URLs, any domain.
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: false,
    },
    // Both transports: WebSocket is fast, polling is the reliable fallback.
    // Polling fallback is critical for ngrok, corporate firewalls, and VPNs
    // that block WebSocket upgrades.
    transports: ["websocket", "polling"],
    // Longer timeouts for high-latency connections (ngrok adds ~50-200ms overhead)
    pingTimeout: 60000,
    pingInterval: 25000,
    connectTimeout: 45000,
    // Allow upgrade from polling → websocket after initial handshake
    allowUpgrades: true,
    // Larger buffer for WebRTC signaling payloads (SDP offers can be large)
    maxHttpBufferSize: 1e7,
    // Support older engine.io clients
    allowEIO3: true,
  });

  io.on("connection", (socket) => {
    const addr   = socket.handshake.address;
    const origin = socket.handshake.headers.origin ?? "unknown";
    console.log(`🔌 Connected: ${socket.id} | from: ${addr} | origin: ${origin}`);

    socket.on("disconnect", (reason) => {
      console.log(`❌ Disconnected: ${socket.id} | reason: ${reason}`);
    });
  });

  registerChatHandlers(io);

  return io;
}
