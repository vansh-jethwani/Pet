import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import {
  Heart,
  X,
  Bookmark,
  MapPin,
  Calendar,
  Syringe,
  Users,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Plus,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Pet {
  id: number;
  name: string;
  breed: string;
  age: number;
  gender: "Male" | "Female";
  location: string;
  owner: string;
  ownerImage: string;
  vaccinated: boolean;
  images: string;
  description: string;
}

const samplePets: Pet[] = [
  {
    id: 1,
    name: "Luna",
    breed: "Golden Retriever",
    age: 3,
    gender: "Female",
    location: "San Francisco, CA",
    owner: "Sarah Johnson",
    ownerImage: "👩",
    vaccinated: true,
    images: "🐕",
    description: "Friendly and energetic golden retriever looking for a match.",
  },
  {
    id: 2,
    name: "Max",
    breed: "German Shepherd",
    age: 4,
    gender: "Male",
    location: "Los Angeles, CA",
    owner: "John Smith",
    ownerImage: "👨",
    vaccinated: true,
    images: "🐕",
    description: "Intelligent and loyal German Shepherd, excellent pedigree.",
  },
  {
    id: 3,
    name: "Bella",
    breed: "Labrador Retriever",
    age: 2,
    gender: "Female",
    location: "San Diego, CA",
    owner: "Emily Davis",
    ownerImage: "👩",
    vaccinated: true,
    images: "🐕",
    description: "Sweet and playful lab puppy with great temperament.",
  },
  {
    id: 4,
    name: "Charlie",
    breed: "French Bulldog",
    age: 3,
    gender: "Male",
    location: "New York, NY",
    owner: "Michael Brown",
    ownerImage: "👨",
    vaccinated: true,
    images: "🐕",
    description: "Cute French bulldog with championship bloodline.",
  },
  {
    id: 5,
    name: "Daisy",
    breed: "Dachshund",
    age: 2,
    gender: "Female",
    location: "Boston, MA",
    owner: "Lisa Wilson",
    ownerImage: "👩",
    vaccinated: true,
    images: "🐕",
    description: "Spunky and adorable dachshund looking for a friend.",
  },
];

const dogBreeds = [
  "Golden Retriever",
  "German Shepherd",
  "Labrador Retriever",
  "French Bulldog",
  "Dachshund",
  "Bulldog",
  "Poodle",
  "Beagle",
];

export default function Breeding() {
  const [petIndex, setPetIndex] = useState(0);
  const [liked, setLiked] = useState<number[]>([]);
  const [saved, setSaved] = useState<number[]>([]);
  const [showMatches, setShowMatches] = useState(false);
  const [showAddPet, setShowAddPet] = useState(false);
  const [myPet, setMyPet] = useState<Pet | null>(null);

  const [filter, setFilter] = useState({
    breed: "",
    gender: "both" as "Male" | "Female" | "both",
    ageMin: 1,
    ageMax: 10,
    location: "",
  });

  const [formData, setFormData] = useState({
    name: "",
    breed: "",
    age: "",
    gender: "Male" as "Male" | "Female",
    location: "",
  });

  const currentPet = samplePets[petIndex];

  const handleAddPetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.breed || !formData.age || !formData.location) {
      alert("Please fill in all fields");
      return;
    }

    const newPet: Pet = {
      id: 9999,
      name: formData.name,
      breed: formData.breed,
      age: parseInt(formData.age),
      gender: formData.gender,
      location: formData.location,
      owner: "You",
      ownerImage: "👤",
      vaccinated: true,
      images: "🐕",
      description: "Your pet looking for a match!",
    };

    setMyPet(newPet);
    setShowAddPet(false);
    setFormData({ name: "", breed: "", age: "", gender: "Male", location: "" });
  };

  const filteredPets = samplePets.filter((pet) => {
    if (filter.breed && pet.breed !== filter.breed) return false;
    if (filter.gender !== "both" && pet.gender !== filter.gender) return false;
    if (pet.age < filter.ageMin || pet.age > filter.ageMax) return false;
    if (filter.location && !pet.location.toLowerCase().includes(filter.location.toLowerCase())) return false;
    return true;
  });

  const handleLike = () => {
    setLiked([...liked, currentPet.id]);
    handleNext();
  };

  const handleReject = () => {
    handleNext();
  };

  const handleSave = () => {
    if (!saved.includes(currentPet.id)) {
      setSaved([...saved, currentPet.id]);
    }
  };

  const handleNext = () => {
    if (petIndex < filteredPets.length - 1) {
      setPetIndex(petIndex + 1);
    } else {
      setPetIndex(0);
    }
  };

  const handlePrevious = () => {
    if (petIndex > 0) {
      setPetIndex(petIndex - 1);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-dogs/10 via-white to-orange-50 py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Breeding Match
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl">
            Find the perfect breeding match for your dog. Add your pet details, use filters to find matches, and start conversations with owners.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Add Pet Card */}
            {!myPet && (
              <div className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl p-6 text-white shadow-lg">
                <h3 className="text-lg font-bold mb-2">Add Your Pet</h3>
                <p className="text-sm opacity-90 mb-4">
                  Start by adding your pet details to find the perfect match.
                </p>
                <button
                  onClick={() => setShowAddPet(!showAddPet)}
                  className="w-full bg-white text-dogs font-semibold py-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Pet
                </button>
              </div>
            )}

            {/* My Pet Card */}
            {myPet && (
              <div className="bg-white rounded-2xl p-6 border border-green-200 shadow-lg">
                <div className="flex items-center gap-2 mb-4">
                  <Check className="w-5 h-5 text-green-500" />
                  <h3 className="text-lg font-bold text-gray-900">Your Pet</h3>
                </div>
                <div className="text-4xl text-center mb-3">{myPet.images}</div>
                <p className="font-bold text-gray-900 mb-2">{myPet.name}</p>
                <p className="text-sm text-gray-600">{myPet.breed} • {myPet.age} years</p>
                <p className="text-sm text-gray-600">{myPet.location}</p>
                <button
                  onClick={() => {
                    setMyPet(null);
                    setShowAddPet(false);
                  }}
                  className="w-full mt-4 text-sm bg-red-50 text-red-600 py-2 rounded-lg hover:bg-red-100 transition-colors"
                >
                  Change Pet
                </button>
              </div>
            )}

            {/* Add Pet Form */}
            {showAddPet && !myPet && (
              <div className="bg-white rounded-2xl p-6 border border-orange-200 shadow-lg">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Pet Details</h3>
                <form onSubmit={handleAddPetSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dogs focus:border-transparent"
                      placeholder="Your pet's name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Breed
                    </label>
                    <select
                      value={formData.breed}
                      onChange={(e) =>
                        setFormData({ ...formData, breed: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dogs focus:border-transparent"
                    >
                      <option value="">Select breed</option>
                      {dogBreeds.map((breed) => (
                        <option key={breed} value={breed}>
                          {breed}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Age
                    </label>
                    <input
                      type="number"
                      value={formData.age}
                      onChange={(e) =>
                        setFormData({ ...formData, age: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dogs focus:border-transparent"
                      placeholder="Years"
                      min="0"
                      max="20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gender
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          gender: e.target.value as "Male" | "Female",
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dogs focus:border-transparent"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) =>
                        setFormData({ ...formData, location: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dogs focus:border-transparent"
                      placeholder="City, State"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-dogs text-white font-semibold py-2 rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    Add Pet
                  </button>
                </form>
              </div>
            )}

            {/* Filters Sidebar */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm sticky top-24">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Filters</h3>

              <div className="space-y-6">
                {/* Breed Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Breed
                  </label>
                  <select
                    value={filter.breed}
                    onChange={(e) =>
                      setFilter({ ...filter, breed: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dogs focus:border-transparent"
                  >
                    <option value="">All Breeds</option>
                    {dogBreeds.map((breed) => (
                      <option key={breed} value={breed}>
                        {breed}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Gender Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Gender
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: "Male", label: "Male" },
                      { value: "Female", label: "Female" },
                      { value: "both", label: "Any" },
                    ].map((option) => (
                      <label
                        key={option.value}
                        className="flex items-center gap-3 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="gender"
                          value={option.value}
                          checked={filter.gender === option.value}
                          onChange={(e) =>
                            setFilter({
                              ...filter,
                              gender: e.target.value as "Male" | "Female" | "both",
                            })
                          }
                          className="w-4 h-4 text-dogs"
                        />
                        <span className="text-gray-700">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Age Range Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Age Range: {filter.ageMin} - {filter.ageMax} years
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
                      <p className="text-xs text-gray-600 mt-1">Minimum age</p>
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
                      <p className="text-xs text-gray-600 mt-1">Maximum age</p>
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dogs focus:border-transparent"
                    placeholder="Search by location"
                  />
                </div>

                {/* Stats */}
                <div className="pt-6 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-dogs">
                        {liked.length}
                      </div>
                      <p className="text-sm text-gray-600">Likes</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-dogs">
                        {saved.length}
                      </div>
                      <p className="text-sm text-gray-600">Saved</p>
                    </div>
                  </div>
                </div>

                {/* Matches Button */}
                <button
                  onClick={() => setShowMatches(!showMatches)}
                  className="w-full px-4 py-2 rounded-xl bg-dogs text-white font-semibold hover:bg-orange-600 transition-colors"
                >
                  {showMatches ? "Back to Swipe" : "View Matches"}
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {!showMatches ? (
            // Swipe Interface
            <div className="flex flex-col items-center justify-center">
                {filteredPets.length === 0 ? (
                  <div className="bg-orange-50 rounded-2xl p-12 text-center border-2 border-dashed border-dogs/30">
                    <p className="text-lg text-gray-600">
                      No matches found. Try adjusting your filters.
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
                        <div className="absolute inset-0 rounded-2xl bg-white shadow-2xl overflow-hidden border-2 border-dogs/20">
                          {/* Pet Image Area */}
                          <div className="w-full h-64 sm:h-80 bg-gradient-to-br from-dogs/20 to-orange-100 flex items-center justify-center text-9xl">
                            {currentPet.images}
                          </div>

                          {/* Pet Info */}
                          <div className="p-6">
                            <div className="mb-4">
                              <h2 className="text-3xl font-bold text-gray-900">
                                {currentPet.name}
                              </h2>
                              <p className="text-lg text-dogs font-semibold">
                                {currentPet.breed}
                              </p>
                            </div>

                            <div className="space-y-3 mb-6 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-dogs" />
                                {currentPet.age} years old • {currentPet.gender}
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-dogs" />
                                {currentPet.location}
                              </div>
                              <div className="flex items-center gap-2">
                                <Syringe className="w-4 h-4 text-dogs" />
                                {currentPet.vaccinated
                                  ? "Fully Vaccinated"
                                  : "Not Vaccinated"}
                              </div>
                            </div>

                            {/* Owner Info */}
                            <div className="bg-orange-50 rounded-xl p-4 mb-4">
                              <div className="flex items-center gap-3">
                                <span className="text-3xl">
                                  {currentPet.ownerImage}
                                </span>
                                <div>
                                  <p className="font-semibold text-gray-900">
                                    {currentPet.owner}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    Verified Owner
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
                        onClick={handleReject}
                        className="p-4 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors shadow-lg hover:shadow-xl"
                      >
                        <X className="w-6 h-6" />
                      </button>

                      <button
                        onClick={handleSave}
                        className={cn(
                          "p-4 rounded-full transition-colors shadow-lg hover:shadow-xl",
                          saved.includes(currentPet.id)
                            ? "bg-yellow-400 text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        )}
                      >
                        <Bookmark className="w-6 h-6 fill-current" />
                      </button>

                      <button
                        onClick={handleLike}
                        className="p-4 rounded-full bg-dogs text-white hover:bg-orange-600 transition-colors shadow-lg hover:shadow-xl scale-110"
                      >
                        <Heart className="w-6 h-6 fill-current" />
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
                        ❤️ Like • 🚫 Reject • 💾 Save • When you both like each
                        other, it's a match!
                      </p>
                    </div>
                  </>
                )}
              </div>
            ) : (
              // Matches View
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-8">
                  Your Matches ({liked.length})
                </h2>

                {liked.length === 0 ? (
                  <div className="bg-orange-50 rounded-2xl p-12 text-center border-2 border-dashed border-dogs/30">
                    <p className="text-lg text-gray-600 mb-4">
                      No matches yet. Start liking profiles!
                    </p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    {filteredPets
                      .filter((pet) => liked.includes(pet.id))
                      .map((pet) => (
                        <div
                          key={pet.id}
                          className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100 hover:shadow-xl transition-shadow"
                        >
                          <div className="w-full h-48 bg-gradient-to-br from-dogs/20 to-orange-100 flex items-center justify-center text-8xl">
                            {pet.images}
                          </div>
                          <div className="p-6">
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">
                              {pet.name}
                            </h3>
                            <p className="text-dogs font-semibold mb-4">
                              {pet.breed}
                            </p>

                            <div className="space-y-2 text-sm text-gray-600 mb-6">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                {pet.location}
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                {pet.age} years • {pet.gender}
                              </div>
                              <div>
                                Owner:{" "}
                                <span className="font-semibold">
                                  {pet.owner}
                                </span>
                              </div>
                            </div>

                            <button className="w-full px-4 py-2 rounded-xl bg-dogs text-white font-semibold hover:bg-orange-600 transition-colors flex items-center justify-center gap-2">
                              <MessageSquare className="w-4 h-4" />
                              Start Chat
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
