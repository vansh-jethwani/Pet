import { Post } from "./models/Post.js";
import { Pet } from "./models/Pet.js";

const DEFAULT_PETS = [
  {
    name: "Luna",
    species: "dog",
    breed: "Golden Retriever",
    age: 3,
    gender: "Female",
    location: "San Francisco, CA",
    city: "San Francisco",
    owner: "Sarah J.",
    ownerAvatar: "👩🏻",
    ownerVerified: true,
    vaccinated: true,
    pedigree: true,
    photo: "https://images.unsplash.com/photo-1543466835-00a7b08bc31b?w=400&h=400&fit=crop&q=80",
    fallbackEmoji: "🐕",
    description: "Champion bloodline Golden with a gentle soul.",
    traits: ["Playful", "Gentle", "Loyal", "Smart"],
    weight: "28 kg",
    color: "Golden",
    score: 96,
    healthCerts: ["OFA Hips", "OFA Elbows", "CERF Eyes"],
    joinedDate: "Feb 2024",
  },
  // base only one sample, others can be added similarly
];

export async function seedDatabase() {
  const postCount = await Post.countDocuments();
  if (postCount === 0) {
    console.log("🌱 Seeding database with sample posts...");
    await Post.insertMany([
      {
        author: "Priya Sharma",
        avatar: "🐾",
        category: "tips",
        title: "How I trained my Golden Retriever to stop jumping on guests",
        content:
          "After 6 months of consistent training, my Golden Buddy finally stopped jumping on guests!...",
        tags: ["dogs", "training", "behaviour"],
        likes: 42,
        views: 318,
        replies: [
          { author: "Rohan Mehta", avatar: "🐕", content: "This worked for my Labrador too!", likes: 8 },
          { author: "Sunita Patel", avatar: "🐶", content: "How long did it take before it became automatic?", likes: 3 },
        ],
      },
      // ... other posts omitted for brevity
    ] as any);
    console.log("✅ Sample posts inserted");
  }

  const petCount = await Pet.countDocuments();
  if (petCount === 0) {
    console.log("🌱 Seeding database with sample pets...");
    await Pet.insertMany(DEFAULT_PETS as any);
    console.log("✅ Sample pets inserted");
  }
}

