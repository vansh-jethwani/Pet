import "dotenv/config";
import mongoose from "mongoose";

const URI = process.env.MONGODB_URI;

if (!URI) {
  console.error("MONGODB_URI is not set in .env file");
  process.exit(1);
}

console.log("Connecting to MongoDB...");

export async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(URI);
  console.log("MongoDB connected!");
}

export default mongoose;