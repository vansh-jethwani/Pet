import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 8080,
    // Vite 7.x requires this exact format to allow all hosts
    allowedHosts: true,
    strictPort: true,
    fs: {
      allow: [".", "./client", "./shared"],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
    },
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
        const { createApp, attachSocketServer } = await import(
          "./server/index.js"
        );
        const app = await createApp();

        if (viteServer.httpServer) {
          attachSocketServer(viteServer.httpServer as any);
        }

        viteServer.middlewares.use((req: any, res: any, next: any) => {
          if (req.url?.startsWith("/api")) {
            return app(req, res, next);
          }
          return next();
        });

        console.log("✅ Express + Socket.io registered on port 8080");
        console.log("✅ All hosts allowed — ngrok URLs will work");
      } catch (err) {
        console.error("❌ Failed to start Express + Socket.io:", err);
      }
    },
  };
}
