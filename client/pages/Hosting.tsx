import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import {
  Home,
  MapPin,
  Star,
  MessageSquare,
  Users,
  Check,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Heart,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface HostProfile {
  id: number;
  name: string;
  location: string;
  pricePerDay: number;
  rating: number;
  reviews: number;
  image: string;
  description: string;
  pets: string;
  verified: boolean;
  experienced: boolean;
  capacity: number;
  amenities: string[];
}

const hostProfiles: HostProfile[] = [
  {
    id: 1,
    name: "Sarah's Pet Haven",
    location: "San Francisco, CA",
    pricePerDay: 35,
    rating: 4.9,
    reviews: 47,
    image: "👩",
    description: "Spacious home with backyard, perfect for active dogs.",
    pets: "Dogs, Cats",
    verified: true,
    experienced: true,
    capacity: 3,
    amenities: ["Backyard", "Air Conditioning", "Toys", "Daily Updates"],
  },
  {
    id: 2,
    name: "Mike's Cat Lounge",
    location: "Los Angeles, CA",
    pricePerDay: 25,
    rating: 4.8,
    reviews: 32,
    image: "👨",
    description: "Cozy apartment with cat-friendly setup.",
    pets: "Cats",
    verified: true,
    experienced: false,
    capacity: 5,
    amenities: ["Cat Tree", "Window Perches", "Playtime"],
  },
  {
    id: 3,
    name: "Jessica's Pet Retreat",
    location: "San Diego, CA",
    pricePerDay: 40,
    rating: 5.0,
    reviews: 28,
    image: "👩",
    description: "Luxury pet care with premium amenities.",
    pets: "Dogs, Cats, Small Pets",
    verified: true,
    experienced: true,
    capacity: 4,
    amenities: [
      "Pool Access",
      "Training",
      "Grooming",
      "Premium Meals",
      "24/7 Care",
    ],
  },
  {
    id: 4,
    name: "Tom's Dog Paradise",
    location: "New York, NY",
    pricePerDay: 45,
    rating: 4.7,
    reviews: 19,
    image: "👨",
    description: "Professional dog walker with boarding facility.",
    pets: "Dogs",
    verified: true,
    experienced: true,
    capacity: 6,
    amenities: ["Walking", "Training", "Large Runs", "Socialization"],
  },
  {
    id: 5,
    name: "Emma's Cozy Corner",
    location: "Boston, MA",
    pricePerDay: 30,
    rating: 4.6,
    reviews: 15,
    image: "👩",
    description: "Home-based care with lots of love and attention.",
    pets: "Dogs, Cats",
    verified: false,
    experienced: false,
    capacity: 2,
    amenities: ["Home Comfort", "Personal Attention", "Photos Daily"],
  },
];

export default function Hosting() {
  const [hostIndex, setHostIndex] = useState(0);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [bookmarked, setBookmarked] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "swipe">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [showMyListings, setShowMyListings] = useState(false);

  const [filter, setFilter] = useState({
    minRating: 0,
    priceMin: 0,
    priceMax: 100,
    location: "",
    petType: "all" as "all" | "dogs" | "cats",
    verified: false,
  });

  const currentHost = hostProfiles[hostIndex];

  const filteredHosts = hostProfiles.filter((host) => {
    const matchesRating = host.rating >= filter.minRating;
    const matchesPrice =
      host.pricePerDay >= filter.priceMin &&
      host.pricePerDay <= filter.priceMax;
    const matchesLocation =
      !filter.location ||
      host.location.toLowerCase().includes(filter.location.toLowerCase());
    const matchesSearch =
      !searchTerm ||
      host.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      host.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesVerified = !filter.verified || host.verified;
    const matchesPetType =
      filter.petType === "all" || host.pets.includes(filter.petType === "dogs" ? "Dogs" : "Cats");

    return (
      matchesRating &&
      matchesPrice &&
      matchesLocation &&
      matchesSearch &&
      matchesVerified &&
      matchesPetType
    );
  });

  const handleNext = () => {
    if (hostIndex < filteredHosts.length - 1) {
      setHostIndex(hostIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (hostIndex > 0) {
      setHostIndex(hostIndex - 1);
    }
  };

  const handleFavorite = (id: number) => {
    if (favorites.includes(id)) {
      setFavorites(favorites.filter((f) => f !== id));
    } else {
      setFavorites([...favorites, id]);
    }
  };

  const handleBookmark = (id: number) => {
    if (bookmarked.includes(id)) {
      setBookmarked(bookmarked.filter((b) => b !== id));
    } else {
      setBookmarked([...bookmarked, id]);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-yellow-50 via-white to-orange-50 py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Pet Hosting & Guesting
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Find trusted hosts for your pets or become a host and earn money. Connect with pet lovers in your community.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => setShowMyListings(false)}
                className={cn(
                  "px-6 py-3 rounded-lg font-semibold transition-all",
                  !showMyListings
                    ? "bg-yellow-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
              >
                Find a Host
              </button>
              <button
                onClick={() => setShowMyListings(true)}
                className={cn(
                  "px-6 py-3 rounded-lg font-semibold transition-all",
                  showMyListings
                    ? "bg-yellow-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
              >
                Become a Host
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!showMyListings ? (
          <>
            {/* View Mode Toggle & Search */}
            <div className="mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex-1 w-full sm:max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search hosts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "px-4 py-2 rounded-lg font-semibold transition-all",
                    viewMode === "grid"
                      ? "bg-yellow-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  )}
                >
                  Grid View
                </button>
                <button
                  onClick={() => setViewMode("swipe")}
                  className={cn(
                    "px-4 py-2 rounded-lg font-semibold transition-all",
                    viewMode === "swipe"
                      ? "bg-yellow-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  )}
                >
                  Swipe View
                </button>
              </div>
            </div>

            <div className="grid lg:grid-cols-4 gap-8">
              {/* Sidebar Filters */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm sticky top-24">
                  <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Filter className="w-5 h-5" />
                    Filters
                  </h3>

                  <div className="space-y-6">
                    {/* Pet Type Filter */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Pet Type
                      </label>
                      <div className="space-y-2">
                        {[
                          { value: "all", label: "All Pets" },
                          { value: "dogs", label: "Dogs" },
                          { value: "cats", label: "Cats" },
                        ].map((option) => (
                          <label
                            key={option.value}
                            className="flex items-center gap-3 cursor-pointer"
                          >
                            <input
                              type="radio"
                              name="petType"
                              value={option.value}
                              checked={filter.petType === option.value}
                              onChange={(e) =>
                                setFilter({
                                  ...filter,
                                  petType: e.target.value as "all" | "dogs" | "cats",
                                })
                              }
                              className="w-4 h-4 text-yellow-500"
                            />
                            <span className="text-gray-700">{option.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Rating Filter */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Minimum Rating: {filter.minRating.toFixed(1)}⭐
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="5"
                        step="0.5"
                        value={filter.minRating}
                        onChange={(e) =>
                          setFilter({
                            ...filter,
                            minRating: parseFloat(e.target.value),
                          })
                        }
                        className="w-full"
                      />
                    </div>

                    {/* Price Range Filter */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Price: ${filter.priceMin} - ${filter.priceMax}/day
                      </label>
                      <div className="space-y-3">
                        <div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={filter.priceMin}
                            onChange={(e) =>
                              setFilter({
                                ...filter,
                                priceMin: Math.min(
                                  parseInt(e.target.value),
                                  filter.priceMax
                                ),
                              })
                            }
                            className="w-full"
                          />
                          <p className="text-xs text-gray-600 mt-1">Minimum</p>
                        </div>
                        <div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={filter.priceMax}
                            onChange={(e) =>
                              setFilter({
                                ...filter,
                                priceMax: Math.max(
                                  parseInt(e.target.value),
                                  filter.priceMin
                                ),
                              })
                            }
                            className="w-full"
                          />
                          <p className="text-xs text-gray-600 mt-1">Maximum</p>
                        </div>
                      </div>
                    </div>

                    {/* Location Filter */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Location
                      </label>
                      <input
                        type="text"
                        value={filter.location}
                        onChange={(e) =>
                          setFilter({ ...filter, location: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                        placeholder="City, State"
                      />
                    </div>

                    {/* Verified Filter */}
                    <div>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filter.verified}
                          onChange={(e) =>
                            setFilter({
                              ...filter,
                              verified: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-yellow-500 rounded"
                        />
                        <span className="text-gray-700 font-semibold">
                          Verified Hosts Only
                        </span>
                      </label>
                    </div>

                    {/* Stats */}
                    <div className="pt-6 border-t border-gray-200">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-yellow-500">
                            {favorites.length}
                          </div>
                          <p className="text-sm text-gray-600">Favorites</p>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-yellow-500">
                            {bookmarked.length}
                          </div>
                          <p className="text-sm text-gray-600">Bookmarked</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Content */}
              <div className="lg:col-span-3">
                {viewMode === "grid" ? (
                  // Grid View
                  filteredHosts.length === 0 ? (
                    <div className="bg-yellow-50 rounded-2xl p-12 text-center border-2 border-dashed border-yellow-200">
                      <div className="text-5xl mb-4">🏡</div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        No Hosts Found
                      </h3>
                      <p className="text-gray-600">
                        Try adjusting your filters.
                      </p>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-6">
                      {filteredHosts.map((host) => (
                        <div
                          key={host.id}
                          className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100 hover:shadow-xl transition-shadow"
                        >
                          {/* Host Header */}
                          <div className="bg-gradient-to-br from-yellow-100 to-orange-100 p-6 flex items-start justify-between">
                            <div className="flex items-center gap-4">
                              <div className="text-4xl">{host.image}</div>
                              <div>
                                <h3 className="text-xl font-bold text-gray-900">
                                  {host.name}
                                </h3>
                                <div className="flex items-center gap-1 text-sm text-yellow-600 font-semibold">
                                  <Star className="w-4 h-4 fill-yellow-400" />
                                  {host.rating} ({host.reviews})
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => handleBookmark(host.id)}
                              className={cn(
                                "p-2 rounded-full transition-colors",
                                bookmarked.includes(host.id)
                                  ? "bg-red-100 text-red-500"
                                  : "bg-white text-gray-400 hover:bg-gray-100"
                              )}
                            >
                              <Heart className="w-5 h-5 fill-current" />
                            </button>
                          </div>

                          <div className="p-6">
                            {/* Badges */}
                            <div className="flex gap-2 mb-4 flex-wrap">
                              {host.verified && (
                                <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                                  <Check className="w-3 h-3" />
                                  Verified
                                </span>
                              )}
                              {host.experienced && (
                                <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
                                  <Award className="w-3 h-3" />
                                  Experienced
                                </span>
                              )}
                            </div>

                            {/* Info */}
                            <div className="space-y-2 text-sm text-gray-600 mb-4">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                {host.location}
                              </div>
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                Capacity: {host.capacity} pets
                              </div>
                              <div className="text-lg font-bold text-gray-900">
                                ${host.pricePerDay}/day
                              </div>
                            </div>

                            <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                              {host.description}
                            </p>

                            {/* Amenities */}
                            <div className="mb-4">
                              <p className="text-xs font-semibold text-gray-700 mb-2">
                                Amenities:
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {host.amenities.slice(0, 3).map((amenity) => (
                                  <span
                                    key={amenity}
                                    className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
                                  >
                                    {amenity}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <button className="w-full py-2 rounded-lg font-semibold bg-yellow-500 text-white hover:bg-yellow-600 transition-colors">
                              Request Booking
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  // Swipe View
                  <div className="flex flex-col items-center justify-center">
                    {filteredHosts.length === 0 ? (
                      <div className="bg-yellow-50 rounded-2xl p-12 text-center border-2 border-dashed border-yellow-200 w-full">
                        <div className="text-5xl mb-4">🏡</div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                          No Hosts Found
                        </h3>
                        <p className="text-gray-600">Try adjusting your filters.</p>
                      </div>
                    ) : (
                      <>
                        {/* Card Stack */}
                        <div className="w-full max-w-md mb-8">
                          <div className="relative h-96 sm:h-[500px]">
                            {/* Background Cards */}
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 border-2 border-gray-200 transform scale-95 -rotate-2"></div>
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 border-2 border-gray-200 transform scale-90 rotate-2"></div>

                            {/* Main Card */}
                            <div className="absolute inset-0 rounded-2xl bg-white shadow-2xl overflow-hidden border-2 border-yellow-200">
                              {/* Host Image Area */}
                              <div className="w-full h-64 sm:h-80 bg-gradient-to-br from-yellow-100 to-orange-100 flex items-center justify-center text-9xl">
                                {currentHost.image}
                              </div>

                              {/* Host Info */}
                              <div className="p-6">
                                <div className="mb-4">
                                  <h2 className="text-3xl font-bold text-gray-900">
                                    {currentHost.name}
                                  </h2>
                                  <div className="flex items-center gap-2 text-yellow-600 font-semibold mt-1">
                                    <Star className="w-5 h-5 fill-yellow-400" />
                                    {currentHost.rating} ({currentHost.reviews} reviews)
                                  </div>
                                </div>

                                <div className="space-y-2 mb-4 text-sm text-gray-600">
                                  <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4" />
                                    {currentHost.location}
                                  </div>
                                  <div className="text-lg font-bold text-gray-900">
                                    ${currentHost.pricePerDay} per day
                                  </div>
                                </div>

                                <p className="text-gray-600 text-sm leading-relaxed">
                                  {currentHost.description}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Card Counter */}
                          <div className="text-center mt-6 text-sm text-gray-600">
                            {hostIndex + 1} of {filteredHosts.length}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="w-full max-w-md flex gap-4 justify-center mb-8">
                          <button
                            onClick={handlePrevious}
                            disabled={hostIndex === 0}
                            className="p-3 rounded-full border-2 border-gray-300 text-gray-600 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <ChevronLeft className="w-6 h-6" />
                          </button>

                          <button
                            onClick={() => handleFavorite(currentHost.id)}
                            className={cn(
                              "p-4 rounded-full transition-colors shadow-lg hover:shadow-xl",
                              favorites.includes(currentHost.id)
                                ? "bg-red-500 text-white"
                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            )}
                          >
                            <Heart className="w-6 h-6 fill-current" />
                          </button>

                          <button className="p-4 rounded-full bg-yellow-500 text-white hover:bg-yellow-600 transition-colors shadow-lg hover:shadow-xl scale-110">
                            Request Booking
                          </button>

                          <button
                            onClick={handleNext}
                            className="p-3 rounded-full border-2 border-gray-300 text-gray-600 hover:border-gray-400 transition-colors"
                          >
                            <ChevronRight className="w-6 h-6" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          // Become a Host Section
          <div className="max-w-2xl mx-auto">
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-12 border border-yellow-200">
              <div className="text-center mb-12">
                <div className="text-6xl mb-6">🏡</div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Become a Pet Host
                </h2>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Turn your home into a pet haven and earn money while caring for
                  other people's pets. It's easy, rewarding, and fun!
                </p>
              </div>

              <div className="space-y-6 mb-12">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-yellow-200 text-yellow-700 font-bold">
                      1
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      Create Your Profile
                    </h3>
                    <p className="text-gray-600">
                      Tell pet owners about yourself, your home, and your
                      experience with pets.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-yellow-200 text-yellow-700 font-bold">
                      2
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      Set Your Price & Availability
                    </h3>
                    <p className="text-gray-600">
                      Choose your daily rate and when you're available to host
                      pets.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-yellow-200 text-yellow-700 font-bold">
                      3
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      Start Accepting Bookings
                    </h3>
                    <p className="text-gray-600">
                      Pet owners will find and book with you. Earn money for
                      every day you host a pet.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-yellow-200 text-yellow-700 font-bold">
                      4
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      Build Your Reputation
                    </h3>
                    <p className="text-gray-600">
                      Collect reviews and ratings to become a verified, trusted
                      host.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 mb-12 border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-4">Why Host with Us?</h3>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    Earn money on your schedule
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    Meet new pets and pet owners
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    Secure payment system
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    Insurance coverage included
                  </li>
                </ul>
              </div>

              <button className="w-full px-6 py-3 rounded-xl font-semibold text-white bg-yellow-500 hover:bg-yellow-600 transition-colors">
                Create Your Host Profile
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
