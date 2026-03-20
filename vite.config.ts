import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    fs: {
      allow: [".", "./client", "./shared"],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
    },
    // Without external backend in dev, socket.io is attached directly to Vite HTTP server.
    // Do not proxy /socket.io back to same origin to avoid recursion.
    proxy: {},
  },
  build: {
    outDir: "dist/spa",
  },
  plugins: [react(), expressPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  optimizeDeps: {
    exclude: ["better-sqlite3"],
  },
});

let serverRegistered = false;

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve",
    async configureServer(viteServer) {
      if (serverRegistered) return;
      serverRegistered = true;

      try {
        const { createApp, attachSocketServer } = await import("./server/index.js");
        const app = await createApp();

        // Attach Socket.io to the Vite dev HTTP server to maintain one-port behavior.
        if (viteServer.httpServer) {
          attachSocketServer(viteServer.httpServer as any);
        }

        // In dev, intercept API requests and let Vite handle SPA routes.
        viteServer.middlewares.use((req: any, res: any, next: any) => {
          if (req.url?.startsWith("/api")) {
            return app(req, res, next);
          }
          return next();
        });

        console.log("✅ Express + Socket.io registered");
      } catch (err) {
        console.error("❌ Failed to start Express + Socket.io:", err);
      }
    },
  };
}
