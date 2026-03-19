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
        const { createServer } = await import("./server/index.js");
        const app = await createServer();
        // Use unshift to put Express BEFORE Vite's own handlers
      // Mount the app root so routes defined as /api/* in the app work directly.
      viteServer.middlewares.use(app);
      console.log("✅ Express routes registered on root path");
      } catch (err) {
        console.error("❌ Failed to start Express:", err);
      }
    },
  };
}
