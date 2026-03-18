import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import { Plus, Edit, Trash2, Upload, ArrowLeft, Check, X } from "lucide-react";

interface Pet {
  id: number;
  name: string;
  type: "dog" | "cat" | "fish" | "bird";
  breed: string;
  age: number;
  gender: "male" | "female";
  location: string;
  photo?: string;
  bio: string;
  vaccinated: boolean;
}

export default function PetProfile() {
  const [pets, setPets] = useState<Pet[]>([
    {
      id: 1,
      name: "Max",
      type: "dog",
      breed: "Golden Retriever",
      age: 3,
      gender: "male",
      location: "San Francisco, CA",
      bio: "Friendly and energetic",
      vaccinated: true,
    },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "dog" as "dog" | "cat" | "fish" | "bird",
    breed: "",
    age: "",
    gender: "male" as "male" | "female",
    location: "",
    bio: "",
    vaccinated: false,
  });

  const handleAddClick = () => {
    setEditingId(null);
    setFormData({
      name: "",
      type: "dog",
      breed: "",
      age: "",
      gender: "male",
      location: "",
      bio: "",
      vaccinated: false,
    });
    setShowForm(true);
  };

  const handleEditClick = (pet: Pet) => {
    setEditingId(pet.id);
    setFormData({
      name: pet.name,
      type: pet.type,
      breed: pet.breed,
      age: pet.age.toString(),
      gender: pet.gender,
      location: pet.location,
      bio: pet.bio,
      vaccinated: pet.vaccinated,
    });
    setShowForm(true);
  };

  const handleDeleteClick = (id: number) => {
    setPets(pets.filter((pet) => pet.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.breed || !formData.age || !formData.location) {
      alert("Please fill in all required fields");
      return;
    }

    if (editingId) {
      // Update existing pet
      setPets(
        pets.map((pet) =>
          pet.id === editingId
            ? {
                ...pet,
                name: formData.name,
                type: formData.type,
                breed: formData.breed,
                age: parseInt(formData.age),
                gender: formData.gender,
                location: formData.location,
                bio: formData.bio,
                vaccinated: formData.vaccinated,
              }
            : pet
        )
      );
    } else {
      // Add new pet
      const newPet: Pet = {
        id: Math.max(...pets.map((p) => p.id), 0) + 1,
        name: formData.name,
        type: formData.type,
        breed: formData.breed,
        age: parseInt(formData.age),
        gender: formData.gender,
        location: formData.location,
        bio: formData.bio,
        vaccinated: formData.vaccinated,
      };
      setPets([...pets, newPet]);
    }

    setShowForm(false);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <Link
            to="/"
            className="inline-flex items-center gap-2 mb-4 opacity-90 hover:opacity-100 transition-opacity"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold">My Pets</h1>
          <p className="text-orange-100 mt-2">Manage your pet profiles and connect with other pet lovers</p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          {/* Add Pet Button */}
          {!showForm && (
            <button
              onClick={handleAddClick}
              className="mb-8 inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              Add New Pet
            </button>
          )}

          {/* Add/Edit Pet Form */}
          {showForm && (
            <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {editingId ? "Edit Pet" : "Add New Pet"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  {/* Pet Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pet Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Enter pet name"
                    />
                  </div>

                  {/* Pet Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pet Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          type: e.target.value as "dog" | "cat" | "fish" | "bird",
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="dog">Dog</option>
                      <option value="cat">Cat</option>
                      <option value="fish">Fish</option>
                      <option value="bird">Bird</option>
                    </select>
                  </div>

                  {/* Breed */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Breed <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.breed}
                      onChange={(e) =>
                        setFormData({ ...formData, breed: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="e.g., Golden Retriever"
                    />
                  </div>

                  {/* Age */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Age (years) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.age}
                      onChange={(e) =>
                        setFormData({ ...formData, age: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="e.g., 3"
                      min="0"
                      max="50"
                    />
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gender <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          gender: e.target.value as "male" | "female",
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) =>
                        setFormData({ ...formData, location: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="City, State"
                    />
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio / Description
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) =>
                      setFormData({ ...formData, bio: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                    rows={4}
                    placeholder="Tell us about your pet..."
                  />
                </div>

                {/* Vaccinated Checkbox */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="vaccinated"
                    checked={formData.vaccinated}
                    onChange={(e) =>
                      setFormData({ ...formData, vaccinated: e.target.checked })
                    }
                    className="w-5 h-5 text-orange-500 rounded focus:ring-2 focus:ring-orange-500"
                  />
                  <label htmlFor="vaccinated" className="text-sm font-medium text-gray-700">
                    Fully Vaccinated
                  </label>
                </div>

                {/* Form Actions */}
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Check className="w-5 h-5" />
                    {editingId ? "Update Pet" : "Add Pet"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <X className="w-5 h-5" />
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Pets Grid */}
          {pets.length > 0 && !showForm && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Pets</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {pets.map((pet) => (
                  <div
                    key={pet.id}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow"
                  >
                    {/* Pet Photo Placeholder */}
                    <div className="bg-gradient-to-br from-orange-400 to-orange-600 h-48 flex items-center justify-center">
                      <span className="text-5xl">
                        {pet.type === "dog"
                          ? "🐕"
                          : pet.type === "cat"
                          ? "🐱"
                          : pet.type === "fish"
                          ? "🐠"
                          : "🐦"}
                      </span>
                    </div>

                    {/* Pet Details */}
                    <div className="p-6">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        {pet.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        {pet.breed} • {pet.age} years old
                      </p>

                      <div className="space-y-2 mb-4 text-sm">
                        <p className="text-gray-700">
                          <span className="font-medium">Gender:</span>{" "}
                          {pet.gender.charAt(0).toUpperCase() + pet.gender.slice(1)}
                        </p>
                        <p className="text-gray-700">
                          <span className="font-medium">Location:</span> {pet.location}
                        </p>
                        {pet.bio && (
                          <p className="text-gray-700">
                            <span className="font-medium">Bio:</span> {pet.bio}
                          </p>
                        )}
                        <div className="flex items-center gap-2">
                          {pet.vaccinated && (
                            <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                              <Check className="w-4 h-4" />
                              Vaccinated
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditClick(pet)}
                          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteClick(pet.id)}
                          className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {pets.length === 0 && !showForm && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🐾</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No pets yet</h3>
              <p className="text-gray-600 mb-6">
                Add your first pet to get started with PetMatch
              </p>
              <button
                onClick={handleAddClick}
                className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add Your First Pet
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
