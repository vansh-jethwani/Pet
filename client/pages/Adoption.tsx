import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import {
  Heart,
  MapPin,
  Calendar,
  Syringe,
  Users,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Filter,
  Search,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdoptablePet {
  id: number;
  name: string;
  breed: string;
  age: number;
  gender: "Male" | "Female";
  location: string;
  shelter: string;
  vaccinated: boolean;
  images: string;
  description: string;
  adoptionFee: number;
}

const adoptablePets: AdoptablePet[] = [
  {
    id: 1,
    name: "Buddy",
    breed: "Mixed Retriever",
    age: 3,
    gender: "Male",
    location: "San Francisco, CA",
    shelter: "San Francisco Animal Care Society",
    vaccinated: true,
    images: "🐕",
    description: "Sweet and energetic boy who loves to play fetch and cuddle.",
    adoptionFee: 150,
  },
  {
    id: 2,
    name: "Whiskers",
    breed: "Tabby Cat",
    age: 2,
    gender: "Female",
    location: "Los Angeles, CA",
    shelter: "LA Pet Rescue",
    vaccinated: true,
    images: "🐱",
    description: "Friendly and affectionate, perfect lap cat for a cozy home.",
    adoptionFee: 75,
  },
  {
    id: 3,
    name: "Oliver",
    breed: "German Shepherd Mix",
    age: 5,
    gender: "Male",
    location: "San Diego, CA",
    shelter: "San Diego Humane Society",
    vaccinated: true,
    images: "🐕",
    description: "Mature, calm, and perfect for a quiet family home.",
    adoptionFee: 120,
  },
  {
    id: 4,
    name: "Luna",
    breed: "Siamese",
    age: 1,
    gender: "Female",
    location: "New York, NY",
    shelter: "ASPCA",
    vaccinated: true,
    images: "🐱",
    description: "Playful kitten full of energy and curiosity.",
    adoptionFee: 85,
  },
  {
    id: 5,
    name: "Max",
    breed: "Beagle",
    age: 4,
    gender: "Male",
    location: "Boston, MA",
    shelter: "Boston Animal Rescue League",
    vaccinated: true,
    images: "🐕",
    description: "Gentle hound with endless love to give.",
    adoptionFee: 130,
  },
];

export default function Adoption() {
  const [petIndex, setPetIndex] = useState(0);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [applied, setApplied] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "swipe">("grid");
  const [searchTerm, setSearchTerm] = useState("");

  const [filter, setFilter] = useState({
    type: "all" as "all" | "dogs" | "cats",
    ageMin: 0,
    ageMax: 15,
    location: "",
  });

  const currentPet = adoptablePets[petIndex];

  const filteredPets = adoptablePets.filter((pet) => {
    const matchesType =
      filter.type === "all" ||
      (filter.type === "dogs" && (pet.images === "🐕" || pet.breed.includes("Retriever"))) ||
      (filter.type === "cats" && pet.images === "🐱");
    const matchesAge = pet.age >= filter.ageMin && pet.age <= filter.ageMax;
    const matchesLocation =
      !filter.location ||
      pet.location.toLowerCase().includes(filter.location.toLowerCase());
    const matchesSearch =
      !searchTerm ||
      pet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pet.breed.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesAge && matchesLocation && matchesSearch;
  });

  const handleNext = () => {
    if (petIndex < filteredPets.length - 1) {
      setPetIndex(petIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (petIndex > 0) {
      setPetIndex(petIndex - 1);
    }
  };

  const handleFavorite = (id: number) => {
    if (favorites.includes(id)) {
      setFavorites(favorites.filter((f) => f !== id));
    } else {
      setFavorites([...favorites, id]);
    }
  };

  const handleApply = (id: number) => {
    if (!applied.includes(id)) {
      setApplied([...applied, id]);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-50 via-white to-pink-50 py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Pet Adoption
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl">
            Browse adoptable pets from shelters and rescues. Find your perfect companion and give a pet a forever home.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* View Mode Toggle & Search */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex-1 w-full sm:max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name or breed..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "px-4 py-2 rounded-lg font-semibold transition-all",
                viewMode === "grid"
                  ? "bg-purple-500 text-white"
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
                  ? "bg-purple-500 text-white"
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
                {/* Type Filter */}
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
                          name="type"
                          value={option.value}
                          checked={filter.type === option.value}
                          onChange={(e) =>
                            setFilter({
                              ...filter,
                              type: e.target.value as "all" | "dogs" | "cats",
                            })
                          }
                          className="w-4 h-4 text-purple-500"
                        />
                        <span className="text-gray-700">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Age Range Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Age: {filter.ageMin} - {filter.ageMax} years
                  </label>
                  <div className="space-y-3">
                    <div>
                      <input
                        type="range"
                        min="0"
                        max="15"
                        value={filter.ageMin}
                        onChange={(e) =>
                          setFilter({
                            ...filter,
                            ageMin: Math.min(
                              parseInt(e.target.value),
                              filter.ageMax
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
                        max="15"
                        value={filter.ageMax}
                        onChange={(e) =>
                          setFilter({
                            ...filter,
                            ageMax: Math.max(
                              parseInt(e.target.value),
                              filter.ageMin
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Search by city"
                  />
                </div>

                {/* Stats */}
                <div className="pt-6 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-500">
                        {favorites.length}
                      </div>
                      <p className="text-sm text-gray-600">Favorites</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-500">
                        {applied.length}
                      </div>
                      <p className="text-sm text-gray-600">Applied</p>
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
              filteredPets.length === 0 ? (
                <div className="bg-purple-50 rounded-2xl p-12 text-center border-2 border-dashed border-purple-200">
                  <div className="text-5xl mb-4">🐾</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    No Pets Found
                  </h3>
                  <p className="text-gray-600">
                    Try adjusting your filters to find more adoptable pets.
                  </p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {filteredPets.map((pet) => (
                    <div
                      key={pet.id}
                      className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100 hover:shadow-xl transition-shadow"
                    >
                      <div className="w-full h-48 bg-gradient-to-br from-purple-200 to-pink-200 flex items-center justify-center text-8xl">
                        {pet.images}
                      </div>
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-2xl font-bold text-gray-900">
                              {pet.name}
                            </h3>
                            <p className="text-purple-500 font-semibold">
                              {pet.breed}
                            </p>
                          </div>
                          <button
                            onClick={() => handleFavorite(pet.id)}
                            className={cn(
                              "p-2 rounded-full transition-colors",
                              favorites.includes(pet.id)
                                ? "bg-red-100 text-red-500"
                                : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                            )}
                          >
                            <Heart
                              className="w-5 h-5 fill-current"
                            />
                          </button>
                        </div>

                        <div className="space-y-2 text-sm text-gray-600 mb-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {pet.age} years • {pet.gender}
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            {pet.location}
                          </div>
                          <div className="flex items-center gap-2">
                            <Syringe className="w-4 h-4" />
                            {pet.vaccinated ? "Vaccinated" : "Not Vaccinated"}
                          </div>
                        </div>

                        <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                          {pet.description}
                        </p>

                        <div className="flex items-center justify-between mb-4">
                          <span className="text-lg font-semibold text-gray-900">
                            ${pet.adoptionFee} adoption fee
                          </span>
                          <span className="text-xs text-gray-500">
                            {pet.shelter}
                          </span>
                        </div>

                        <button
                          onClick={() => handleApply(pet.id)}
                          disabled={applied.includes(pet.id)}
                          className={cn(
                            "w-full py-2 rounded-lg font-semibold transition-colors",
                            applied.includes(pet.id)
                              ? "bg-green-100 text-green-700 cursor-not-allowed flex items-center justify-center gap-2"
                              : "bg-purple-500 text-white hover:bg-purple-600"
                          )}
                        >
                          {applied.includes(pet.id) ? (
                            <>
                              <Check className="w-4 h-4" />
                              Applied
                            </>
                          ) : (
                            "Apply to Adopt"
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              // Swipe View
              <div className="flex flex-col items-center justify-center">
                {filteredPets.length === 0 ? (
                  <div className="bg-purple-50 rounded-2xl p-12 text-center border-2 border-dashed border-purple-200 w-full">
                    <div className="text-5xl mb-4">🐾</div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      No Pets Found
                    </h3>
                    <p className="text-gray-600">
                      Try adjusting your filters.
                    </p>
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
                        <div className="absolute inset-0 rounded-2xl bg-white shadow-2xl overflow-hidden border-2 border-purple-200">
                          {/* Pet Image Area */}
                          <div className="w-full h-64 sm:h-80 bg-gradient-to-br from-purple-200 to-pink-200 flex items-center justify-center text-9xl">
                            {currentPet.images}
                          </div>

                          {/* Pet Info */}
                          <div className="p-6">
                            <div className="mb-4">
                              <h2 className="text-3xl font-bold text-gray-900">
                                {currentPet.name}
                              </h2>
                              <p className="text-lg text-purple-500 font-semibold">
                                {currentPet.breed}
                              </p>
                            </div>

                            <div className="space-y-3 mb-6 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                {currentPet.age} years old • {currentPet.gender}
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                {currentPet.location}
                              </div>
                              <div className="flex items-center gap-2">
                                <Syringe className="w-4 h-4" />
                                {currentPet.vaccinated
                                  ? "Fully Vaccinated"
                                  : "Not Vaccinated"}
                              </div>
                            </div>

                            {/* Shelter Info */}
                            <div className="bg-purple-50 rounded-xl p-4 mb-4">
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-purple-500" />
                                <div>
                                  <p className="font-semibold text-gray-900">
                                    {currentPet.shelter}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    Verified Shelter
                                  </p>
                                </div>
                              </div>
                            </div>

                            <p className="text-gray-600 text-sm leading-relaxed">
                              {currentPet.description}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Card Counter */}
                      <div className="text-center mt-6 text-sm text-gray-600">
                        {petIndex + 1} of {filteredPets.length}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="w-full max-w-md flex gap-4 justify-center mb-8">
                      <button
                        onClick={handlePrevious}
                        disabled={petIndex === 0}
                        className="p-3 rounded-full border-2 border-gray-300 text-gray-600 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>

                      <button
                        onClick={() => handleFavorite(currentPet.id)}
                        className={cn(
                          "p-4 rounded-full transition-colors shadow-lg hover:shadow-xl",
                          favorites.includes(currentPet.id)
                            ? "bg-red-500 text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        )}
                      >
                        <Heart className="w-6 h-6 fill-current" />
                      </button>

                      <button
                        onClick={() => handleApply(currentPet.id)}
                        disabled={applied.includes(currentPet.id)}
                        className="p-4 rounded-full bg-purple-500 text-white hover:bg-purple-600 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed scale-110"
                      >
                        <Check className="w-6 h-6" />
                      </button>

                      <button
                        onClick={handleNext}
                        className="p-3 rounded-full border-2 border-gray-300 text-gray-600 hover:border-gray-400 transition-colors"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                    </div>

                    {/* Instructions */}
                    <div className="text-center text-gray-600 text-sm max-w-md">
                      <p>
                        ❤️ Favorite • ✅ Apply • Navigate to find your perfect
                        match!
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
