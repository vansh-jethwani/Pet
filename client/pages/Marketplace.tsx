import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import {
  ShoppingCart,
  MapPin,
  Tag,
  Star,
  Heart,
  MessageSquare,
  Search,
  Filter,
  Check,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PetListing {
  id: number;
  name: string;
  breed: string;
  price: number;
  location: string;
  seller: string;
  rating: number;
  reviews: number;
  image: string;
  description: string;
  age: string;
  vaccinated: boolean;
  verified: boolean;
  images_count: number;
}

const petListings: PetListing[] = [
  {
    id: 1,
    name: "Max",
    breed: "Golden Retriever Puppy",
    price: 800,
    location: "San Francisco, CA",
    seller: "Sunny Valley Kennels",
    rating: 4.9,
    reviews: 23,
    image: "🐕",
    description: "Beautiful Golden Retriever puppy from champion bloodline.",
    age: "8 weeks",
    vaccinated: true,
    verified: true,
    images_count: 12,
  },
  {
    id: 2,
    name: "Luna",
    breed: "Siamese Kitten",
    price: 400,
    location: "Los Angeles, CA",
    seller: "Elegant Siamese Cats",
    rating: 4.8,
    reviews: 18,
    image: "🐱",
    description: "Pure breed Siamese kitten with stunning blue eyes.",
    age: "10 weeks",
    vaccinated: true,
    verified: true,
    images_count: 8,
  },
  {
    id: 3,
    name: "Charlie",
    breed: "French Bulldog",
    price: 1200,
    location: "New York, NY",
    seller: "Elite French Bulldog Breeders",
    rating: 4.9,
    reviews: 31,
    image: "🐕",
    description: "Healthy French Bulldog with excellent temperament.",
    age: "12 weeks",
    vaccinated: true,
    verified: true,
    images_count: 15,
  },
  {
    id: 4,
    name: "Whiskers",
    breed: "Persian Cat",
    price: 600,
    location: "Boston, MA",
    seller: "Premium Persian Cats",
    rating: 4.7,
    reviews: 12,
    image: "🐱",
    description: "Adorable Persian kitten with luxurious white coat.",
    age: "9 weeks",
    vaccinated: true,
    verified: false,
    images_count: 10,
  },
  {
    id: 5,
    name: "Buddy",
    breed: "Labrador Retriever",
    price: 900,
    location: "San Diego, CA",
    seller: "West Coast Labradors",
    rating: 4.8,
    reviews: 27,
    image: "🐕",
    description: "Friendly Labrador puppy perfect for families.",
    age: "10 weeks",
    vaccinated: true,
    verified: true,
    images_count: 14,
  },
];

export default function Marketplace() {
  const [favorites, setFavorites] = useState<number[]>([]);
  const [cart, setCart] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"price-low" | "price-high" | "rating">(
    "price-low"
  );

  const [filter, setFilter] = useState({
    priceMin: 0,
    priceMax: 2000,
    location: "",
    breed: "",
    verified: false,
  });

  const filteredListings = petListings
    .filter((listing) => {
      const matchesPrice =
        listing.price >= filter.priceMin &&
        listing.price <= filter.priceMax;
      const matchesLocation =
        !filter.location ||
        listing.location
          .toLowerCase()
          .includes(filter.location.toLowerCase());
      const matchesBreed =
        !filter.breed ||
        listing.breed.toLowerCase().includes(filter.breed.toLowerCase());
      const matchesSearch =
        !searchTerm ||
        listing.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.breed.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesVerified = !filter.verified || listing.verified;

      return (
        matchesPrice &&
        matchesLocation &&
        matchesBreed &&
        matchesSearch &&
        matchesVerified
      );
    })
    .sort((a, b) => {
      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;
      return b.rating - a.rating;
    });

  const handleFavorite = (id: number) => {
    if (favorites.includes(id)) {
      setFavorites(favorites.filter((f) => f !== id));
    } else {
      setFavorites([...favorites, id]);
    }
  };

  const handleAddToCart = (id: number) => {
    if (!cart.includes(id)) {
      setCart([...cart, id]);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-cyan-50 py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Pet Marketplace
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl">
            Buy and sell pets from trusted breeders and sellers. Browse listings
            with detailed information and reviews.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search & Sort */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex-1 w-full sm:max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search pets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(
                  e.target.value as "price-low" | "price-high" | "rating"
                )
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
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
                {/* Price Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Price: ${filter.priceMin} - ${filter.priceMax}
                  </label>
                  <div className="space-y-3">
                    <div>
                      <input
                        type="range"
                        min="0"
                        max="2000"
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
                        max="2000"
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

                {/* Breed Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Breed
                  </label>
                  <input
                    type="text"
                    value={filter.breed}
                    onChange={(e) =>
                      setFilter({ ...filter, breed: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Search breed..."
                  />
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      className="w-4 h-4 text-blue-500 rounded"
                    />
                    <span className="text-gray-700 font-semibold">
                      Verified Sellers Only
                    </span>
                  </label>
                </div>

                {/* Stats */}
                <div className="pt-6 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-500">
                        {favorites.length}
                      </div>
                      <p className="text-sm text-gray-600">Favorites</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-500">
                        {cart.length}
                      </div>
                      <p className="text-sm text-gray-600">In Cart</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {filteredListings.length === 0 ? (
              <div className="bg-blue-50 rounded-2xl p-12 text-center border-2 border-dashed border-blue-200">
                <div className="text-5xl mb-4">🐾</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  No Listings Found
                </h3>
                <p className="text-gray-600">
                  Try adjusting your filters to find more pets.
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {filteredListings.map((listing) => (
                  <div
                    key={listing.id}
                    className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100 hover:shadow-xl transition-shadow"
                  >
                    {/* Image Area */}
                    <div className="relative w-full h-48 bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center text-8xl overflow-hidden">
                      {listing.image}
                      <span className="absolute top-3 right-3 bg-blue-500 text-white px-2 py-1 rounded text-xs font-semibold">
                        {listing.images_count} photos
                      </span>
                    </div>

                    <div className="p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900">
                            {listing.name}
                          </h3>
                          <p className="text-blue-500 font-semibold">
                            {listing.breed}
                          </p>
                        </div>
                        <button
                          onClick={() => handleFavorite(listing.id)}
                          className={cn(
                            "p-2 rounded-full transition-colors",
                            favorites.includes(listing.id)
                              ? "bg-red-100 text-red-500"
                              : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                          )}
                        >
                          <Heart className="w-5 h-5 fill-current" />
                        </button>
                      </div>

                      {/* Rating */}
                      <div className="flex items-center gap-2 text-sm text-yellow-600 font-semibold mb-4">
                        <Star className="w-4 h-4 fill-yellow-400" />
                        {listing.rating} ({listing.reviews} reviews)
                      </div>

                      {/* Info */}
                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {listing.location}
                        </div>
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4" />
                          Age: {listing.age}
                        </div>
                        {listing.vaccinated && (
                          <div className="flex items-center gap-2 text-green-600">
                            <Check className="w-4 h-4" />
                            Fully Vaccinated
                          </div>
                        )}
                      </div>

                      <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                        {listing.description}
                      </p>

                      {/* Seller & Verified */}
                      <div className="bg-gray-50 rounded-xl p-3 mb-4 border border-gray-200">
                        <p className="text-sm text-gray-600 mb-1">Seller</p>
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-gray-900">
                            {listing.seller}
                          </p>
                          {listing.verified && (
                            <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-semibold">
                              <Check className="w-3 h-3" />
                              Verified
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Price & Action */}
                      <div className="flex items-center justify-between gap-4">
                        <div className="text-3xl font-bold text-gray-900">
                          ${listing.price}
                        </div>
                        <div className="flex gap-2">
                          <button className="px-3 py-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors border border-blue-200 font-semibold text-sm">
                            <MessageSquare className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleAddToCart(listing.id)}
                            disabled={cart.includes(listing.id)}
                            className={cn(
                              "flex-1 py-2 rounded-lg font-semibold transition-colors",
                              cart.includes(listing.id)
                                ? "bg-green-100 text-green-700 cursor-not-allowed"
                                : "bg-blue-500 text-white hover:bg-blue-600"
                            )}
                          >
                            {cart.includes(listing.id) ? (
                              <span className="flex items-center justify-center gap-2">
                                <Check className="w-4 h-4" />
                                In Cart
                              </span>
                            ) : (
                              <span className="flex items-center justify-center gap-2">
                                <ShoppingCart className="w-4 h-4" />
                                Add to Cart
                              </span>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
