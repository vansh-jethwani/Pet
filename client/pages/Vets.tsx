import { useState } from "react";
import Header from "@/components/Header";
import {
  Stethoscope,
  Video,
  Phone,
  MapPin,
  Star,
  Check,
  Award,
  Calendar,
  Search,
  Filter,
  Clock,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Veterinarian {
  id: number;
  name: string;
  title: string;
  location: string;
  rating: number;
  reviews: number;
  image: string;
  specialties: string[];
  experience: number;
  consultationTypes: ("video" | "phone" | "inperson")[];
  videoPrice: number;
  phonePrice: number;
  inpersonPrice: number;
  verified: boolean;
  responseTime: string;
  bio: string;
}

const veterinarians: Veterinarian[] = [
  {
    id: 1,
    name: "Dr. Sarah Mitchell",
    title: "DVM, Veterinary Medicine",
    location: "San Francisco, CA",
    rating: 4.9,
    reviews: 156,
    image: "👩‍⚕️",
    specialties: ["Dogs", "Cats", "General Medicine"],
    experience: 12,
    consultationTypes: ["video", "phone", "inperson"],
    videoPrice: 45,
    phonePrice: 35,
    inpersonPrice: 75,
    verified: true,
    responseTime: "2 hours",
    bio: "Dr. Mitchell specializes in preventive care and behavioral issues with over 12 years of experience.",
  },
  {
    id: 2,
    name: "Dr. James Chen",
    title: "DVM, MS - Surgery Specialist",
    location: "Los Angeles, CA",
    rating: 4.8,
    reviews: 124,
    image: "👨‍⚕️",
    specialties: ["Surgical Cases", "Emergency Care", "Dogs"],
    experience: 15,
    consultationTypes: ["phone", "inperson"],
    videoPrice: 0,
    phonePrice: 50,
    inpersonPrice: 100,
    verified: true,
    responseTime: "1 hour",
    bio: "Renowned surgical specialist with expertise in complex procedures and emergency veterinary care.",
  },
  {
    id: 3,
    name: "Dr. Emily Rodriguez",
    title: "DVM, Feline Medicine Specialist",
    location: "New York, NY",
    rating: 4.9,
    reviews: 203,
    image: "👩‍⚕️",
    specialties: ["Cats", "Exotic Pets", "Nutrition"],
    experience: 10,
    consultationTypes: ["video", "phone"],
    videoPrice: 40,
    phonePrice: 30,
    inpersonPrice: 0,
    verified: true,
    responseTime: "30 minutes",
    bio: "Passionate about feline health with specialized knowledge in exotic pets and nutritional counseling.",
  },
  {
    id: 4,
    name: "Dr. Michael Park",
    title: "DVM - Behavioral Specialist",
    location: "Boston, MA",
    rating: 4.7,
    reviews: 98,
    image: "👨‍⚕️",
    specialties: ["Behavioral Issues", "Dogs", "Training Advice"],
    experience: 8,
    consultationTypes: ["video", "phone", "inperson"],
    videoPrice: 50,
    phonePrice: 40,
    inpersonPrice: 80,
    verified: false,
    responseTime: "3 hours",
    bio: "Expert in pet behavior and training with a unique approach to addressing behavioral problems.",
  },
  {
    id: 5,
    name: "Dr. Lisa Thompson",
    title: "DVM, PhD - Research & Wellness",
    location: "San Diego, CA",
    rating: 4.8,
    reviews: 167,
    image: "👩‍⚕️",
    specialties: ["Preventive Care", "Nutrition", "Wellness"],
    experience: 14,
    consultationTypes: ["video", "phone"],
    videoPrice: 55,
    phonePrice: 45,
    inpersonPrice: 0,
    verified: true,
    responseTime: "1 hour",
    bio: "Dedicated to preventive medicine and optimal pet wellness through evidence-based practices.",
  },
];

export default function Vets() {
  const [favorites, setFavorites] = useState<number[]>([]);
  const [selectedVet, setSelectedVet] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"rating" | "experience" | "price">(
    "rating"
  );

  const [filter, setFilter] = useState({
    consultationType: "all" as "all" | "video" | "phone" | "inperson",
    maxPrice: 100,
    verified: false,
    specialty: "",
  });

  const filteredVets = veterinarians
    .filter((vet) => {
      const matchesSearch =
        !searchTerm ||
        vet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vet.specialties.some((s) =>
          s.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesType =
        filter.consultationType === "all" ||
        vet.consultationTypes.includes(filter.consultationType);

      const matchesPrice =
        (filter.consultationType === "all" ||
          (filter.consultationType === "video" &&
            vet.videoPrice > 0 &&
            vet.videoPrice <= filter.maxPrice) ||
          (filter.consultationType === "phone" &&
            vet.phonePrice > 0 &&
            vet.phonePrice <= filter.maxPrice) ||
          (filter.consultationType === "inperson" &&
            vet.inpersonPrice > 0 &&
            vet.inpersonPrice <= filter.maxPrice)) ||
        filter.maxPrice >= 100;

      const matchesVerified = !filter.verified || vet.verified;

      const matchesSpecialty =
        !filter.specialty ||
        vet.specialties.some((s) =>
          s.toLowerCase().includes(filter.specialty.toLowerCase())
        );

      return (
        matchesSearch &&
        matchesType &&
        matchesPrice &&
        matchesVerified &&
        matchesSpecialty
      );
    })
    .sort((a, b) => {
      if (sortBy === "rating") return b.rating - a.rating;
      if (sortBy === "experience") return b.experience - a.experience;
      const aPrice = Math.min(a.videoPrice, a.phonePrice, a.inpersonPrice);
      const bPrice = Math.min(b.videoPrice, b.phonePrice, b.inpersonPrice);
      return aPrice - bPrice;
    });

  const handleFavorite = (id: number) => {
    if (favorites.includes(id)) {
      setFavorites(favorites.filter((f) => f !== id));
    } else {
      setFavorites([...favorites, id]);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-red-50 via-white to-pink-50 py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Veterinary Consultations
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl">
            Book consultations with licensed veterinarians via video call, phone
            call, or in-person clinic visits.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search & Filter */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex-1 w-full sm:max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search vets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as "rating" | "experience" | "price")
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="rating">Top Rated</option>
              <option value="experience">Most Experienced</option>
              <option value="price">Lowest Price</option>
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
                {/* Consultation Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Consultation Type
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: "all", label: "All Types" },
                      { value: "video", label: "Video Call" },
                      { value: "phone", label: "Phone Call" },
                      { value: "inperson", label: "In-Person" },
                    ].map((option) => (
                      <label
                        key={option.value}
                        className="flex items-center gap-3 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="type"
                          value={option.value}
                          checked={filter.consultationType === option.value}
                          onChange={(e) =>
                            setFilter({
                              ...filter,
                              consultationType: e.target.value as
                                | "all"
                                | "video"
                                | "phone"
                                | "inperson",
                            })
                          }
                          className="w-4 h-4 text-red-500"
                        />
                        <span className="text-gray-700">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Max Price */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Max Price: ${filter.maxPrice}
                  </label>
                  <input
                    type="range"
                    min="20"
                    max="150"
                    value={filter.maxPrice}
                    onChange={(e) =>
                      setFilter({
                        ...filter,
                        maxPrice: parseInt(e.target.value),
                      })
                    }
                    className="w-full"
                  />
                </div>

                {/* Specialty */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Specialty
                  </label>
                  <input
                    type="text"
                    value={filter.specialty}
                    onChange={(e) =>
                      setFilter({ ...filter, specialty: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="e.g., Dogs, Cats..."
                  />
                </div>

                {/* Verified Only */}
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
                      className="w-4 h-4 text-red-500 rounded"
                    />
                    <span className="text-gray-700 font-semibold">
                      Verified Only
                    </span>
                  </label>
                </div>

                {/* Stats */}
                <div className="pt-6 border-t border-gray-200">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-500">
                      {favorites.length}
                    </div>
                    <p className="text-sm text-gray-600">Favorites</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {filteredVets.length === 0 ? (
              <div className="bg-red-50 rounded-2xl p-12 text-center border-2 border-dashed border-red-200">
                <div className="text-5xl mb-4">⚕️</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  No Vets Found
                </h3>
                <p className="text-gray-600">
                  Try adjusting your filters or search terms.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredVets.map((vet) => (
                  <div
                    key={vet.id}
                    className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100 hover:shadow-xl transition-all"
                  >
                    <div className="p-6">
                      <div className="grid md:grid-cols-5 gap-6">
                        {/* Vet Info */}
                        <div className="md:col-span-2">
                          <div className="flex items-start gap-4 mb-4">
                            <div className="text-4xl">{vet.image}</div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <h3 className="text-xl font-bold text-gray-900">
                                    {vet.name}
                                  </h3>
                                  <p className="text-sm text-gray-600">
                                    {vet.title}
                                  </p>
                                </div>
                                <button
                                  onClick={() => handleFavorite(vet.id)}
                                  className={cn(
                                    "p-2 rounded-full transition-colors flex-shrink-0",
                                    favorites.includes(vet.id)
                                      ? "bg-red-100 text-red-500"
                                      : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                                  )}
                                >
                                  <Star className="w-5 h-5 fill-current" />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Badges */}
                          <div className="flex gap-2 flex-wrap mb-4">
                            {vet.verified && (
                              <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                                <Check className="w-3 h-3" />
                                Verified
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
                              <Award className="w-3 h-3" />
                              {vet.experience}+ years
                            </span>
                          </div>

                          {/* Rating */}
                          <div className="flex items-center gap-2 text-sm text-yellow-600 font-semibold mb-4">
                            <Star className="w-4 h-4 fill-yellow-400" />
                            {vet.rating} ({vet.reviews} reviews)
                          </div>

                          {/* Info */}
                          <div className="space-y-2 text-sm text-gray-600 mb-4">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              {vet.location}
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              Response: {vet.responseTime}
                            </div>
                          </div>

                          <p className="text-gray-600 text-sm leading-relaxed">
                            {vet.bio}
                          </p>
                        </div>

                        {/* Specialties & Consultation Types */}
                        <div className="md:col-span-3 space-y-4">
                          {/* Specialties */}
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">
                              Specialties
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {vet.specialties.map((specialty) => (
                                <span
                                  key={specialty}
                                  className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold"
                                >
                                  {specialty}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Consultation Options */}
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3">
                              Consultation Options
                            </h4>
                            <div className="grid sm:grid-cols-3 gap-3">
                              {vet.consultationTypes.includes("video") && (
                                <button className="border-2 border-red-200 rounded-lg p-4 hover:bg-red-50 transition-colors text-left">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Video className="w-4 h-4 text-red-500" />
                                    <span className="font-semibold text-gray-900">
                                      Video Call
                                    </span>
                                  </div>
                                  <div className="text-red-600 font-bold">
                                    ${vet.videoPrice}
                                  </div>
                                </button>
                              )}

                              {vet.consultationTypes.includes("phone") && (
                                <button className="border-2 border-red-200 rounded-lg p-4 hover:bg-red-50 transition-colors text-left">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Phone className="w-4 h-4 text-red-500" />
                                    <span className="font-semibold text-gray-900">
                                      Phone Call
                                    </span>
                                  </div>
                                  <div className="text-red-600 font-bold">
                                    ${vet.phonePrice}
                                  </div>
                                </button>
                              )}

                              {vet.consultationTypes.includes("inperson") && (
                                <button className="border-2 border-red-200 rounded-lg p-4 hover:bg-red-50 transition-colors text-left">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Stethoscope className="w-4 h-4 text-red-500" />
                                    <span className="font-semibold text-gray-900">
                                      In-Person
                                    </span>
                                  </div>
                                  <div className="text-red-600 font-bold">
                                    ${vet.inpersonPrice}
                                  </div>
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Book Button */}
                          <div>
                            <button className="w-full px-6 py-3 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors flex items-center justify-center gap-2">
                              <Calendar className="w-5 h-5" />
                              Book Consultation
                            </button>
                          </div>
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
