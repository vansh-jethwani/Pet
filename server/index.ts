import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo.js";
import communityRouter from "./routes/community.js";
import { connectDB } from "./db.js";
import { seedDatabase } from "./seed.js";

export async function createServer() {
  await connectDB();
  await seedDatabase();

  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get("/api/ping", (_req, res) => {
    res.json({ message: "ping" });
  });

  app.get("/api/demo", handleDemo);
  
  app.get("/api/posts", (req, res) => {
  res.json({ posts: [] }); // or your MongoDB query
});

  app.use("/api/community", communityRouter);

  return app;
}