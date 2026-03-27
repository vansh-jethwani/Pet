import React from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import {
  Heart,
  Home as HomeIcon,
  Stethoscope,
  ShoppingCart,
  Users,
  Award,
  ArrowRight,
  Zap,
  PawPrint,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-white to-yellow-50 py-20 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 leading-tight">
                Find the perfect{" "}
                <span className="text-transparent bg-gradient-to-r from-dogs to-orange-400 bg-clip-text">
                  companion
                </span>
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-gray-600 leading-relaxed">
                Find the perfect companion, breeder, or caretaker for your pet.
              </p>

              <div className="mt-10 grid sm:grid-cols-2 gap-4">
                <Link
                  to="/breeding"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-dogs hover:bg-orange-600 shadow-lg hover:shadow-xl transition-all hover:scale-105"
                >
                  <Heart className="w-5 h-5 fill-white" />
                  Find Pet Companion
                </Link>
                <Link
                  to="/adoption"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-dogs bg-orange-100 hover:bg-orange-200 transition-all hover:scale-105"
                >
                  <PawPrint className="w-5 h-5" />
                  Adopt
                </Link>
              </div>

              <div className="mt-4 grid sm:grid-cols-2 gap-4">
                <Link
                  to="/hosting"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all hover:scale-105"
                >
                  <HomeIcon className="w-5 h-5" />
                  Host a Pet
                </Link>
                <Link
                  to="/vets"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all hover:scale-105"
                >
                  <Stethoscope className="w-5 h-5" />
                  Vet Consultation
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <Link
                  to=""
                  className="rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-dogs to-orange-300 h-48 flex items-center justify-center hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer"
                >
                  <img src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=80&fit=crop" alt="Dog" className="w-full h-full object-cover" />
                </Link>
                <Link
                  to=""
                  className="rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-fish to-blue-300 h-40 flex items-center justify-center hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer"
                >
                  <img src="https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=400&q=80&fit=crop" alt="Fish" className="w-full h-full object-cover" />
                </Link>
              </div>
              <div className="space-y-4 pt-8">
                <Link
                  to=""
                  className="rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-cats to-yellow-300 h-40 flex items-center justify-center hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer"
                >
                  <img src="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&q=80&fit=crop" alt="Cat" className="w-full h-full object-cover" />
                </Link>
                <Link
                  to=""
                  className="rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-birds to-emerald-300 h-48 flex items-center justify-center hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer"
                >
                  <img src="https://images.unsplash.com/photo-1444464666168-49d633b86797?w=400&q=80&fit=crop" alt="Bird" className="w-full h-full object-cover" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything for Pet Lovers
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From finding your perfect match to caring for your pet, we've got you covered.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={<Heart className="w-8 h-8" />}
              title="Pet Companion"
              description="Find compatible pets for breeding with detailed profiles and filters."
              href="/breeding"
              color="from-dogs to-orange-400"
            />
            <FeatureCard
              icon={<PawPrint className="w-8 h-8" />}
              title="Adoption"
              description="Browse available pets needing homes and apply for adoption."
              href="/adoption"
              color="from-purple-500 to-pink-500"
            />
            <FeatureCard
              icon={<HomeIcon className="w-8 h-8" />}
              title="Host a Pet"
              description="Earn money by hosting other people's pets in your home."
              href="/hosting"
              color="from-yellow-400 to-orange-400"
            />
            <FeatureCard
              icon={<MessageSquare className="w-8 h-8" />}
              title="Messages"
              description="Send and receive messages with pet owners and hosts instantly."
              href="/chat"
              color="from-blue-500 to-cyan-400"
            />
            <FeatureCard
              icon={<Stethoscope className="w-8 h-8" />}
              title="Vet Consultation"
              description="Book video, voice, or in-person consultations with veterinarians."
              href="/vets"
              color="from-red-500 to-pink-400"
            />
            <FeatureCard
              icon={<Award className="w-8 h-8" />}
              title="Pet Insurance"
              description="Protect your pet with comprehensive insurance plans."
              href="/insurance"
              color="from-indigo-500 to-purple-400"
            />
            <FeatureCard
              icon={<Zap className="w-8 h-8" />}
              title="Pet Food & Store"
              description="Shop quality pet food, toys, and accessories."
              href="/store"
              color="from-green-500 to-emerald-400"
            />
            <FeatureCard
              icon={<Users className="w-8 h-8" />}
              title="Community"
              description="Connect with other pet lovers and share experiences."
              href="/community"
              color="from-orange-400 to-red-400"
            />
          </div>
        </div>
      </section>

      {/* ── Pet Companion Showcase ─────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 bg-orange-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Visual card */}
            <div className="relative flex justify-center">
              <div className="w-72 h-72 sm:w-96 sm:h-96 rounded-3xl shadow-2xl overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&q=80&fit=crop"
                  alt="Golden Retriever dog"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* decorative blob */}
              <div className="absolute -bottom-6 -right-6 w-40 h-40 rounded-3xl bg-orange-200 -z-10" />
            </div>

            {/* Content */}
            <div>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 text-dogs text-sm font-semibold mb-5">
                <Zap className="w-4 h-4" /> Pet Companion
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Tinder for Pets
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-6">
                Swipe through potential Pet Companiones for your dog or cat. Each profile includes
                detailed information about the pet, vaccination status, location, and owner details.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "Smart matching algorithm",
                  "Advanced filtering by breed, age, location",
                  "Instant chat when matched",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-gray-700">
                    <span className="w-6 h-6 rounded-full bg-dogs flex items-center justify-center text-white text-xs font-bold flex-shrink-0">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                to="/breeding"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-dogs hover:bg-orange-600 shadow-md hover:shadow-lg transition-all hover:scale-105"
              >
                Start Matching <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Adoption ───────────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Content first on mobile, second on desktop */}
            <div className="lg:order-first">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100 text-purple-700 text-sm font-semibold mb-5">
                <PawPrint className="w-4 h-4" /> Adoption
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Give a Pet a Forever Home
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-6">
                Browse adoptable pets from shelters and rescues. View their stories, filter by breed,
                age, and location, and apply for adoption with just a few clicks.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "Verified rescue organizations",
                  "Pet stories and backgrounds",
                  "Simple adoption process",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-gray-700">
                    <span className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                to="/adoption"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-purple-500 hover:bg-purple-600 shadow-md hover:shadow-lg transition-all hover:scale-105"
              >
                Browse Pets <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            {/* Visual */}
            <div className="relative flex justify-center lg:order-last">
              <div className="w-72 h-72 sm:w-96 sm:h-96 rounded-3xl shadow-2xl overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?w=600&q=80&fit=crop"
                  alt="Person adopting a cat"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -top-6 -left-6 w-40 h-40 rounded-3xl bg-purple-100 -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Pet Hosting ────────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 bg-yellow-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-100 text-yellow-700 text-sm font-semibold mb-5">
              <HomeIcon className="w-4 h-4" /> Pet Hosting
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
              Host Pets or Find a Host
            </h2>
            <p className="text-gray-600 text-lg max-w-xl mx-auto">
              Earn money by hosting other people's pets, or find trusted hosts for your furry friends.
            </p>
          </div>

          {/* Two cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-8 shadow-md border border-yellow-100 hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 rounded-2xl bg-yellow-100 flex items-center justify-center mb-5">
                <HomeIcon className="w-7 h-7 text-yellow-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Become a Host</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Open your home to pets and earn extra income. Set your own pricing,
                availability, and pet preferences.
              </p>
              <Link
                to="/hosting"
                className="inline-flex items-center gap-2 text-yellow-600 font-semibold hover:text-yellow-700 group"
              >
                Learn More{" "}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-md border border-yellow-100 hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 rounded-2xl bg-yellow-100 flex items-center justify-center mb-5">
                <Users className="w-7 h-7 text-yellow-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Find a Host</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Search for trustworthy pet hosts by location, price, and reviews.
                Leave your pet in good hands.
              </p>
              <Link
                to="/hosting"
                className="inline-flex items-center gap-2 text-yellow-600 font-semibold hover:text-yellow-700 group"
              >
                Browse Hosts{" "}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Photo Strip ────────────────────────────────────────────────────── */}
      <section className="py-10 bg-white overflow-hidden">
        <div className="flex gap-4 w-max animate-[scroll_30s_linear_infinite]">
          {[
            { src: "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=400&h=300&q=80&fit=crop", alt: "Smiling dog" },
            { src: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=300&q=80&fit=crop", alt: "Cat portrait" },
            { src: "https://images.unsplash.com/photo-1583512603806-077998240c7a?w=400&h=300&q=80&fit=crop", alt: "Dog with owner" },
            { src: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&h=300&q=80&fit=crop", alt: "Two dogs running" },
            { src: "https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=400&h=300&q=80&fit=crop", alt: "Kitten" },
            { src: "https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=400&h=300&q=80&fit=crop", alt: "Dog and cat together" },
            { src: "https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=400&h=300&q=80&fit=crop", alt: "Rabbit pet" },
            { src: "https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=400&h=300&q=80&fit=crop", alt: "Dog portrait" },
            /* duplicate for seamless loop */
            { src: "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=400&h=300&q=80&fit=crop", alt: "Smiling dog" },
            { src: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=300&q=80&fit=crop", alt: "Cat portrait" },
            { src: "https://images.unsplash.com/photo-1583512603806-077998240c7a?w=400&h=300&q=80&fit=crop", alt: "Dog with owner" },
            { src: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&h=300&q=80&fit=crop", alt: "Two dogs running" },
          ].map((img, i) => (
            <div key={i} className="w-72 h-48 rounded-2xl overflow-hidden flex-shrink-0 shadow-md">
              <img src={img.src} alt={img.alt} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
        <style>{`
          @keyframes scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
      </section>

      {/* ── Vet Consultation ───────────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-100 text-red-600 text-sm font-semibold mb-5">
              <Stethoscope className="w-4 h-4" /> Vet Consultation
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
              Connect with Veterinarians
            </h2>
            <p className="text-gray-600 text-lg max-w-xl mx-auto">
              Book consultations with licensed veterinarians via video, phone, or in-person visits.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                title: "Video Call",
                description: "Real-time video consultation from the comfort of home",
                img: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&q=80&fit=crop",
                alt: "Vet video call consultation",
              },
              {
                title: "Phone Call",
                description: "Get quick advice with a simple phone call",
                img: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&q=80&fit=crop",
                alt: "Veterinarian on phone",
              },
              {
                title: "Clinic Visit",
                description: "Visit the vet's physical clinic in person",
                img: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&q=80&fit=crop",
                alt: "Vet clinic visit with dog",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-red-100 overflow-hidden hover:shadow-lg transition-shadow bg-white"
              >
                <div className="h-44 overflow-hidden">
                  <img
                    src={item.img}
                    alt={item.alt}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-5 text-center">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-gray-500 text-sm">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/vets"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-red-500 hover:bg-red-600 shadow-md hover:shadow-lg transition-all hover:scale-105"
            >
              Book a Consultation <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Pet Store ──────────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 bg-emerald-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Content */}
            <div>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold mb-5">
                <ShoppingCart className="w-4 h-4" /> Pet Store
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Everything Your Pet Needs
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-6">
                Shop quality pet food, toys, grooming products, and accessories — all in one place,
                delivered right to your door.
              </p>
              <div className="grid grid-cols-2 gap-4 mb-8">
                {["🦴 Premium Food", "🧸 Toys & Games", "✂️ Grooming", "🎒 Accessories"].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-gray-700 bg-white rounded-xl px-4 py-3 shadow-sm border border-emerald-100 text-sm font-medium">
                    {item}
                  </div>
                ))}
              </div>
              <Link
                to="/store"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-emerald-500 hover:bg-emerald-600 shadow-md hover:shadow-lg transition-all hover:scale-105"
              >
                Shop Now <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            {/* Visual */}
            <div className="relative flex justify-center">
              <div className="w-72 h-72 sm:w-96 sm:h-96 rounded-3xl shadow-2xl overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=600&q=80&fit=crop"
                  alt="Pet food and accessories store"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 w-40 h-40 rounded-3xl bg-emerald-200 -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="bg-gray-900 text-gray-400 py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-white font-bold mb-4">PetMatch</h3>
              <p className="text-sm">
                Find the perfect companion, breeder, or caretaker for your pet.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/breeding" className="hover:text-white transition">Pet Companion</Link></li>
                <li><Link to="/adoption" className="hover:text-white transition">Adoption</Link></li>
                <li><Link to="/hosting" className="hover:text-white transition">Pet Hosting</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">About Us</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2026 PetMatch. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  href,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  color: string;
}) {
  return (
    <Link
      to={href}
      className="group bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg hover:border-gray-200 transition-all"
    >
      <div
        className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform",
          `bg-gradient-to-br ${color}`
        )}
      >
        {icon}
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-dogs transition-colors">
        {title}
      </h3>
      <p className="text-gray-600 text-sm mb-4">{description}</p>
      <div className="flex items-center gap-2 text-dogs font-semibold text-sm group-hover:gap-3 transition-all">
        Learn More
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  );
}
