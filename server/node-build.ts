import path from "path";
import express from "express";
import { createServer as createHttpServer } from "http";
import { createApp, attachSocketServer } from "./index";

async function start() {
  const app = await createApp();
  const port = process.env.PORT || 3000;

  // In production, serve the built SPA files
  const __dirname = import.meta.dirname;
  const distPath = path.join(__dirname, "../spa");

  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    if (req.path.startsWith("/api/") || req.path.startsWith("/health")) {
      return res.status(404).json({ error: "API endpoint not found" });
    }
    res.sendFile(path.join(distPath, "index.html"));
  });

  const httpServer = createHttpServer(app);
  attachSocketServer(httpServer);

  // Listen on the HTTP server (which has Socket.io attached)
  httpServer.listen(port, () => {
    console.log(`🚀 PetMatch server running on port ${port}`);
    console.log(`📱 Frontend: http://localhost:${port}`);
    console.log(`🔧 API: http://localhost:${port}/api`);
    console.log(`🔌 Socket.io: enabled`);
  });
}

start().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});

process.on("SIGTERM", () => {
  console.log("🛑 Received SIGTERM, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🛑 Received SIGINT, shutting down gracefully");
  process.exit(0);
});
