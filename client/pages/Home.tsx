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
            {/* Hero Content */}
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

              {/* Hero CTA Buttons */}
              <div className="mt-10 grid sm:grid-cols-2 gap-4">
                <Link
                  to="/breeding"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-dogs hover:bg-orange-600 shadow-lg hover:shadow-xl transition-all hover:scale-105"
                >
                  <Heart className="w-5 h-5 fill-white" />
                  Find Breeding Match
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

            {/* Hero Image */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <Link
                  to="/category/dogs"
                  className="rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-dogs to-orange-300 h-48 flex items-center justify-center hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer"
                >
                  <div className="text-6xl">🐕</div>
                </Link>
                <Link
                  to="/category/fish"
                  className="rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-fish to-blue-300 h-40 flex items-center justify-center hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer"
                >
                  <div className="text-6xl">🐠</div>
                </Link>
              </div>
              <div className="space-y-4 pt-8">
                <Link
                  to="/category/cats"
                  className="rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-cats to-yellow-300 h-40 flex items-center justify-center hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer"
                >
                  <div className="text-6xl">🐱</div>
                </Link>
                <Link
                  to="/category/birds"
                  className="rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-birds to-emerald-300 h-48 flex items-center justify-center hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer"
                >
                  <div className="text-6xl">🐦</div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 sm:py-32 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything for Pet Lovers
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From finding your perfect match to caring for your pet, we've got
              you covered.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Breeding Match */}
            <FeatureCard
              icon={<Heart className="w-8 h-8" />}
              title="Breeding Match"
              description="Find compatible pets for breeding with detailed profiles and filters."
              href="/breeding"
              color="from-dogs to-orange-400"
            />

            {/* Adoption */}
            <FeatureCard
              icon={<PawPrint className="w-8 h-8" />}
              title="Adoption"
              description="Browse available pets needing homes and apply for adoption."
              href="/adoption"
              color="from-purple-500 to-pink-500"
            />

            {/* Hosting */}
            <FeatureCard
              icon={<HomeIcon className="w-8 h-8" />}
              title="Host a Pet"
              description="Earn money by hosting other people's pets in your home."
              href="/hosting"
              color="from-yellow-400 to-orange-400"
            />

            {/* Marketplace */}
            <FeatureCard
              icon={<ShoppingCart className="w-8 h-8" />}
              title="Marketplace"
              description="Buy and sell pets from trusted sellers in your area."
              href="/marketplace"
              color="from-blue-500 to-cyan-400"
            />

            {/* Vets */}
            <FeatureCard
              icon={<Stethoscope className="w-8 h-8" />}
              title="Vet Consultation"
              description="Book video, voice, or in-person consultations with veterinarians."
              href="/vets"
              color="from-red-500 to-pink-400"
            />

            {/* Insurance */}
            <FeatureCard
              icon={<Award className="w-8 h-8" />}
              title="Pet Insurance"
              description="Protect your pet with comprehensive insurance plans."
              href="/insurance"
              color="from-indigo-500 to-purple-400"
            />

            {/* Store */}
            <FeatureCard
              icon={<Zap className="w-8 h-8" />}
              title="Pet Food & Store"
              description="Shop quality pet food, toys, and accessories."
              href="/store"
              color="from-green-500 to-emerald-400"
            />

            {/* Community */}
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

      {/* Breeding Match Showcase */}
      <section className="py-20 sm:py-32 bg-gradient-to-br from-orange-50 to-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 text-dogs font-semibold mb-6">
                <Zap className="w-4 h-4" />
                Breeding Match
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Tinder for Pets
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                Swipe through potential breeding matches for your dog or cat.
                Each profile includes detailed information about the pet,
                vaccination status, location, and owner details.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-gray-700">
                  <span className="w-6 h-6 rounded-full bg-dogs flex items-center justify-center text-white text-sm font-bold">
                    ✓
                  </span>
                  Smart matching algorithm
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <span className="w-6 h-6 rounded-full bg-dogs flex items-center justify-center text-white text-sm font-bold">
                    ✓
                  </span>
                  Advanced filtering by breed, age, location
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <span className="w-6 h-6 rounded-full bg-dogs flex items-center justify-center text-white text-sm font-bold">
                    ✓
                  </span>
                  Instant chat when matched
                </li>
              </ul>
              <Link
                to="/breeding"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-dogs hover:bg-orange-600 shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                Start Matching <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-dogs to-orange-300 aspect-square flex items-center justify-center">
                <div className="text-9xl animate-bounce">🐕</div>
              </div>
              <div className="absolute -bottom-8 -right-8 w-48 h-48 bg-orange-100 rounded-2xl -z-10"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Adoption Section */}
      <section className="py-20 sm:py-32 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative lg:order-last">
              <div className="rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-purple-500 to-pink-400 aspect-square flex items-center justify-center">
                <div className="text-9xl">🏠</div>
              </div>
              <div className="absolute -top-8 -left-8 w-48 h-48 bg-purple-100 rounded-2xl -z-10"></div>
            </div>
            <div className="lg:order-first">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 text-purple-700 font-semibold mb-6">
                <PawPrint className="w-4 h-4" />
                Adoption
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Give a Pet a Forever Home
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                Browse adoptable pets from shelters and rescues. View their
                stories, filter by breed, age, and location, and apply for
                adoption with just a few clicks.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-gray-700">
                  <span className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white text-sm font-bold">
                    ✓
                  </span>
                  Verified rescue organizations
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <span className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white text-sm font-bold">
                    ✓
                  </span>
                  Pet stories and backgrounds
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <span className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white text-sm font-bold">
                    ✓
                  </span>
                  Simple adoption process
                </li>
              </ul>
              <Link
                to="/adoption"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-purple-500 hover:bg-purple-600 shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                Browse Pets <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Pet Hosting Section */}
      <section className="py-20 sm:py-32 bg-gradient-to-br from-yellow-50 to-orange-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-100 text-yellow-700 font-semibold mb-6">
              <HomeIcon className="w-4 h-4" />
              Pet Hosting
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Host Pets or Find a Host
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Earn money by hosting other people's pets, or find trusted hosts
              for your furry friends.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-yellow-100 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center mb-4">
                <HomeIcon className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Become a Host
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Open your home to pets and earn extra income. Set your own
                pricing, availability, and pet preferences.
              </p>
              <Link
                to="/hosting"
                className="inline-flex items-center gap-2 text-yellow-600 font-semibold hover:text-yellow-700 group"
              >
                Learn More{" "}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-yellow-100 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Find a Host
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Search for trustworthy pet hosts by location, price, and
                reviews. Leave your pet in good hands.
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

      {/* Vet Consultation Section */}
      <section className="py-20 sm:py-32 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-100 text-red-700 font-semibold mb-6">
              <Stethoscope className="w-4 h-4" />
              Vet Consultation
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Connect with Veterinarians
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Book consultations with licensed veterinarians via video, phone,
              or in-person visits.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: "Video Call", description: "Real-time video consultation from home", icon: "📹" },
              { title: "Phone Call", description: "Quick advice through phone call", icon: "☎️" },
              { title: "Clinic Visit", description: "Visit the vet's physical clinic", icon: "🏥" },
            ].map((consultation) => (
              <div
                key={consultation.title}
                className="bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl p-8 border border-red-100 text-center hover:shadow-lg transition-shadow"
              >
                <div className="text-5xl mb-4">{consultation.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {consultation.title}
                </h3>
                <p className="text-gray-600">{consultation.description}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/vets"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-red-500 hover:bg-red-600 shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              Book a Consultation <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Pet Store Section */}
      <section className="py-20 sm:py-32 bg-gradient-to-br from-emerald-50 to-green-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 font-semibold mb-6">
              <ShoppingCart className="w-4 h-4" />
              Pet Store
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything Your Pet Needs
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Shop quality pet food, toys, grooming products, and accessories.
            </p>
          </div>

          <div className="text-center">
            <Link
              to="/store"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-emerald-500 hover:bg-emerald-600 shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              Shop Now <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
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
                <li>
                  <Link to="/breeding" className="hover:text-white transition">
                    Breeding Match
                  </Link>
                </li>
                <li>
                  <Link to="/adoption" className="hover:text-white transition">
                    Adoption
                  </Link>
                </li>
                <li>
                  <Link to="/hosting" className="hover:text-white transition">
                    Pet Hosting
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Careers
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Terms
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2024 PetMatch. All rights reserved.</p>
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
