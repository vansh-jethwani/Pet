import { Post } from "./models/Post.js";

export async function seedDatabase() {
  const count = await Post.countDocuments();
  if (count > 0) return; // already has data, skip seeding

  console.log("🌱 Seeding database with sample posts...");

  await Post.insertMany([
    {
      author: "Priya Sharma",
      avatar: "🐾",
      category: "tips",
      title: "How I trained my Golden Retriever to stop jumping on guests",
      content:
        "After 6 months of consistent training, my Golden Buddy finally stopped jumping on guests! The key was teaching an incompatible behaviour — sit — and rewarding it heavily every time a guest arrived. I also asked guests to completely ignore him until all four paws were on the floor. Patience and consistency made all the difference.",
      tags: ["dogs", "training", "behaviour"],
      likes: 42,
      views: 318,
      replies: [
        {
          author: "Rohan Mehta",
          avatar: "🐕",
          content:
            "This worked for my Labrador too! The 'four paws on floor' rule is golden (pun intended).",
          likes: 8,
        },
        {
          author: "Sunita Patel",
          avatar: "🐶",
          content:
            "How long did it take before it became automatic? My Beagle still needs reminders after 3 months.",
          likes: 3,
        },
      ],
    },
    {
      author: "Arjun Kapoor",
      avatar: "🐱",
      category: "stories",
      title: "We adopted a senior cat and it changed our lives",
      content:
        "Everyone told us to adopt a kitten, but we fell in love with 9-year-old Mochi at the shelter. Six months in and I can honestly say she's the most affectionate, calm, and wonderful companion. Senior pets are so underrated — they usually come trained, calmer, and with so much love to give.",
      tags: ["cats", "adoption", "senior-pets"],
      likes: 97,
      views: 741,
      replies: [
        {
          author: "Kavya Nair",
          avatar: "😻",
          content:
            "This made me tear up. We adopted a 7-year-old cat last year and she's our whole world now.",
          likes: 19,
        },
      ],
    },
    {
      author: "Meera Joshi",
      avatar: "🦜",
      category: "questions",
      title: "Best diet for a 2-year-old African Grey parrot?",
      content:
        "My African Grey Rio is turning 2 next month and I want to make sure I'm feeding him the best diet possible. Currently he's on a mix of pellets and fresh fruits. Are there specific vegetables or foods I should prioritise? Any foods to absolutely avoid? Vet advice welcome too!",
      tags: ["birds", "diet", "african-grey", "nutrition"],
      likes: 23,
      views: 189,
      replies: [],
    },
    {
      author: "Delhi Pet Lovers Club",
      avatar: "🎪",
      category: "events",
      title: "PetFest Delhi 2025 — Join us at Lodhi Garden this Sunday!",
      content:
        "We're hosting the biggest pet meetup in Delhi this Sunday at Lodhi Garden from 9am–1pm. Bring your furry, feathered, or scaly friends! There will be a vet health camp, adoption corner, pet photography, training demos, and a best-dressed pet contest. Entry is free. All vaccinated pets welcome.",
      tags: ["delhi", "event", "meetup", "petfest"],
      likes: 134,
      views: 1203,
      replies: [
        {
          author: "Nikhil Gupta",
          avatar: "🐩",
          content: "Already marked my calendar! Coming with my two Poodles 🎉",
          likes: 11,
        },
        {
          author: "Anjali Singh",
          avatar: "🐾",
          content: "Is there parking nearby? Coming from Gurgaon.",
          likes: 2,
        },
        {
          author: "Delhi Pet Lovers Club",
          avatar: "🎪",
          content:
            "Yes! Plenty of street parking on Lodhi Road and a paid lot on Max Mueller Marg.",
          likes: 5,
        },
      ],
    },
    {
      author: "Vikram Bose",
      avatar: "🐠",
      category: "tips",
      title: "Cycling my new aquarium — a beginner's complete guide",
      content:
        "Setting up my first tank was overwhelming until I understood the nitrogen cycle. Here's what helped me: test your water daily, don't add fish until ammonia and nitrite both read zero, do partial water changes if levels spike, and be patient — it takes 4–6 weeks. I used bottled bacteria to speed things up and it worked great.",
      tags: ["fish", "aquarium", "beginners", "cycling"],
      likes: 56,
      views: 423,
      replies: [],
    },
  ]);

  console.log("✅ Sample posts inserted");
}
