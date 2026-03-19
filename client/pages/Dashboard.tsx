import { useState } from "react";
import { Link } from "react-router-dom";
import { useUser, useClerk } from "@clerk/clerk-react";
import Header from "@/components/Header";
import {
  User,
  PawPrint,
  Heart,
  ShoppingBag,
  Calendar,
  MapPin,
  Shield,
  Edit,
  Plus,
  Trash2,
  LogOut,
  Star,
  Clock,
  CheckCircle,
  Home,
  Stethoscope,
  Package,
  ChevronRight,
  Camera,
  Mail,
  Phone,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ---------- mock data ----------
const mockPets = [
  { id: 1, name: "Max", type: "dog", breed: "Golden Retriever", age: 3, gender: "male", location: "Delhi, India", bio: "Friendly and energetic", vaccinated: true },
  { id: 2, name: "Luna", type: "cat", breed: "Persian", age: 2, gender: "female", location: "Delhi, India", bio: "Calm and cuddly", vaccinated: true },
];

const mockLikedPets = [
  { id: 1, name: "Buddy", breed: "Labrador", age: 2, location: "Mumbai, India", image: "🐕", matchScore: 92 },
  { id: 2, name: "Milo", breed: "Beagle", age: 4, location: "Pune, India", image: "🐶", matchScore: 87 },
  { id: 3, name: "Cleo", breed: "Siamese", age: 1, location: "Bangalore, India", image: "🐱", matchScore: 78 },
];

const mockActivity = [
  { id: 1, type: "breeding", title: "Liked Max's profile on Breeding Match", time: "2 hours ago", icon: Heart, color: "text-orange-500 bg-orange-50" },
  { id: 2, type: "store", title: "Ordered Premium Dog Food 5kg", time: "1 day ago", icon: ShoppingBag, color: "text-green-500 bg-green-50" },
  { id: 3, type: "vet", title: "Booked vet appointment for Luna", time: "3 days ago", icon: Stethoscope, color: "text-blue-500 bg-blue-50" },
  { id: 4, type: "adoption", title: "Applied for adoption of Bella", time: "1 week ago", icon: PawPrint, color: "text-purple-500 bg-purple-50" },
  { id: 5, type: "hosting", title: "Listed Max for pet hosting", time: "2 weeks ago", icon: Home, color: "text-yellow-500 bg-yellow-50" },
  { id: 6, type: "insurance", title: "Renewed pet insurance plan", time: "1 month ago", icon: Shield, color: "text-indigo-500 bg-indigo-50" },
];

const mockOrders = [
  { id: "#ORD-1023", item: "Premium Dog Food 5kg", status: "Delivered", date: "Mar 15, 2026", price: "₹1,299", image: "🐾" },
  { id: "#ORD-1019", item: "Cat Scratching Post", status: "Delivered", date: "Mar 8, 2026", price: "₹899", image: "🐱" },
  { id: "#ORD-1011", item: "Dog Leash & Collar Set", status: "Delivered", date: "Feb 20, 2026", price: "₹599", image: "🦮" },
];

const mockVetBookings = [
  { id: 1, pet: "Luna", vet: "Dr. Priya Sharma", date: "Mar 22, 2026", time: "10:30 AM", type: "General Checkup", status: "Upcoming" },
  { id: 2, pet: "Max", vet: "Dr. Rahul Mehta", date: "Feb 10, 2026", time: "2:00 PM", type: "Vaccination", status: "Completed" },
];

// ---------- tab config ----------
const tabs = [
  { id: "overview", label: "Overview", icon: User },
  { id: "pets", label: "My Pets", icon: PawPrint },
  { id: "liked", label: "Liked Pets", icon: Heart },
  { id: "orders", label: "Orders", icon: ShoppingBag },
  { id: "vets", label: "Vet Bookings", icon: Stethoscope },
  { id: "activity", label: "Activity", icon: Clock },
];

// ---------- stat card ----------
function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", color)}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

// ---------- pet emoji ----------
function petEmoji(type: string) {
  return type === "dog" ? "🐕" : type === "cat" ? "🐱" : type === "fish" ? "🐠" : "🐦";
}

// ---------- main component ----------
export default function Dashboard() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [activeTab, setActiveTab] = useState("overview");
  const [pets, setPets] = useState(mockPets);

  const firstName = user?.firstName ?? "Pet Lover";
  const lastName = user?.lastName ?? "";
  const email = user?.emailAddresses?.[0]?.emailAddress ?? "";
  const avatar = user?.imageUrl;
  const joinDate = user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" }) : "Recently";
  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">

        {/* ===== PROFILE HERO ===== */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-8">
          {/* Cover */}
          <div className="h-28 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 relative">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
          </div>

          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-12 mb-4">
              {/* Avatar */}
              <div className="relative">
                {avatar ? (
                  <img src={avatar} alt={firstName} className="w-24 h-24 rounded-2xl border-4 border-white shadow-lg object-cover" />
                ) : (
                  <div className="w-24 h-24 rounded-2xl border-4 border-white shadow-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                    <span className="text-3xl font-bold text-white">{initials}</span>
                  </div>
                )}
                <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-white border border-gray-200 rounded-lg flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors">
                  <Camera className="w-3.5 h-3.5 text-gray-600" />
                </button>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Link to="/pet-profile" className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  <Edit className="w-4 h-4" /> Edit Profile
                </Link>
                <button onClick={() => signOut()} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </div>

            {/* Info */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">{firstName} {lastName}</h1>
                <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" />{email}</span>
                  <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />Joined {joinDate}</span>
                  <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />Delhi, India</span>
                </div>
              </div>
              {/* Badges */}
              <div className="flex gap-2">
                <span className="flex items-center gap-1 px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-xs font-semibold border border-orange-100">
                  <Award className="w-3 h-3" /> Verified Owner
                </span>
                <span className="flex items-center gap-1 px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-semibold border border-green-100">
                  <CheckCircle className="w-3 h-3" /> Active
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ===== TABS ===== */}
        <div className="flex gap-1 overflow-x-auto bg-white rounded-2xl border border-gray-100 shadow-sm p-1.5 mb-8 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all",
                activeTab === tab.id
                  ? "bg-orange-500 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-50"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ===== OVERVIEW TAB ===== */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <StatCard icon={PawPrint} label="My Pets" value={pets.length} color="bg-orange-50 text-orange-500" />
              <StatCard icon={Heart} label="Liked Pets" value={mockLikedPets.length} color="bg-red-50 text-red-500" />
              <StatCard icon={ShoppingBag} label="Orders" value={mockOrders.length} color="bg-green-50 text-green-500" />
              <StatCard icon={Stethoscope} label="Vet Visits" value={mockVetBookings.length} color="bg-blue-50 text-blue-500" />
              <StatCard icon={Star} label="Matches" value={12} color="bg-yellow-50 text-yellow-500" />
              <StatCard icon={Shield} label="Insurance" value={1} color="bg-indigo-50 text-indigo-500" />
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* My Pets preview */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold text-gray-900">My Pets</h2>
                  <button onClick={() => setActiveTab("pets")} className="text-sm text-orange-500 font-medium hover:text-orange-600 flex items-center gap-1">
                    View all <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-3">
                  {pets.map((pet) => (
                    <div key={pet.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center text-2xl">
                        {petEmoji(pet.type)}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{pet.name}</p>
                        <p className="text-sm text-gray-500">{pet.breed} · {pet.age}yr · {pet.gender}</p>
                      </div>
                      {pet.vaccinated && (
                        <span className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded-full font-medium border border-green-100">Vaccinated</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity preview */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
                  <button onClick={() => setActiveTab("activity")} className="text-sm text-orange-500 font-medium hover:text-orange-600 flex items-center gap-1">
                    View all <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-3">
                  {mockActivity.slice(0, 4).map((item) => (
                    <div key={item.id} className="flex items-start gap-3">
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5", item.color)}>
                        <item.icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 leading-snug">{item.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{item.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Account Details */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-5">Account Details</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Full Name</p>
                  <p className="text-gray-900 font-medium">{firstName} {lastName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Email</p>
                  <p className="text-gray-900 font-medium">{email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Member Since</p>
                  <p className="text-gray-900 font-medium">{joinDate}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Location</p>
                  <p className="text-gray-900 font-medium">Delhi, India</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Account Status</p>
                  <span className="inline-flex items-center gap-1 text-green-600 font-medium text-sm">
                    <CheckCircle className="w-4 h-4" /> Active & Verified
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Pets Registered</p>
                  <p className="text-gray-900 font-medium">{pets.length} pets</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== MY PETS TAB ===== */}
        {activeTab === "pets" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">My Pets ({pets.length})</h2>
              <Link
                to="/pet-profile"
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" /> Add Pet
              </Link>
            </div>

            {pets.length === 0 ? (
              <div className="bg-white rounded-2xl border-2 border-dashed border-orange-200 p-16 text-center">
                <div className="text-6xl mb-4">🐾</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No pets yet</h3>
                <p className="text-gray-500 mb-6">Add your first pet to get started</p>
                <Link to="/pet-profile" className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors">
                  <Plus className="w-4 h-4" /> Add Your First Pet
                </Link>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {pets.map((pet) => (
                  <div key={pet.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <div className="bg-gradient-to-br from-orange-400 to-orange-600 h-40 flex items-center justify-center">
                      <span className="text-6xl">{petEmoji(pet.type)}</span>
                    </div>
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{pet.name}</h3>
                          <p className="text-sm text-gray-500">{pet.breed}</p>
                        </div>
                        {pet.vaccinated && (
                          <span className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded-full font-medium border border-green-100">✓ Vaccinated</span>
                        )}
                      </div>
                      <div className="space-y-1.5 text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-400" />{pet.age} years old · {pet.gender}</div>
                        <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-400" />{pet.location}</div>
                      </div>
                      {pet.bio && <p className="text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2 mb-4">{pet.bio}</p>}
                      <div className="flex gap-2">
                        <Link to="/pet-profile" className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                          <Edit className="w-3.5 h-3.5" /> Edit
                        </Link>
                        <button onClick={() => setPets(pets.filter(p => p.id !== pet.id))} className="flex items-center justify-center gap-1.5 px-3 py-2 border border-red-200 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== LIKED PETS TAB ===== */}
        {activeTab === "liked" && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Liked Pets ({mockLikedPets.length})</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockLikedPets.map((pet) => (
                <div key={pet.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <div className="bg-gradient-to-br from-red-50 to-orange-50 h-40 flex items-center justify-center relative">
                    <span className="text-6xl">{pet.image}</span>
                    <div className="absolute top-3 right-3 bg-white rounded-full px-2.5 py-1 shadow-sm flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                      <span className="text-xs font-bold text-gray-700">{pet.matchScore}% match</span>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{pet.name}</h3>
                    <p className="text-sm text-orange-500 font-medium mb-3">{pet.breed}</p>
                    <div className="space-y-1.5 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-400" />{pet.age} years old</div>
                      <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-400" />{pet.location}</div>
                    </div>
                    <Link to="/breeding" className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition-colors">
                      <Heart className="w-4 h-4" /> View Profile
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== ORDERS TAB ===== */}
        {activeTab === "orders" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Order History ({mockOrders.length})</h2>
              <Link to="/store" className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl text-sm font-semibold hover:bg-green-600 transition-colors">
                <ShoppingBag className="w-4 h-4" /> Shop Now
              </Link>
            </div>
            <div className="space-y-4">
              {mockOrders.map((order) => (
                <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-5 hover:shadow-md transition-shadow">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                    {order.image}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-gray-900">{order.item}</p>
                        <p className="text-sm text-gray-500 mt-0.5">{order.id} · {order.date}</p>
                      </div>
                      <p className="font-bold text-gray-900 whitespace-nowrap">{order.price}</p>
                    </div>
                    <div className="mt-2">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full",
                        order.status === "Delivered" ? "bg-green-50 text-green-600 border border-green-100" : "bg-yellow-50 text-yellow-600 border border-yellow-100"
                      )}>
                        {order.status === "Delivered" ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {order.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== VET BOOKINGS TAB ===== */}
        {activeTab === "vets" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Vet Bookings ({mockVetBookings.length})</h2>
              <Link to="/vets" className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition-colors">
                <Plus className="w-4 h-4" /> Book Appointment
              </Link>
            </div>
            <div className="space-y-4">
              {mockVetBookings.map((booking) => (
                <div key={booking.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Stethoscope className="w-6 h-6 text-blue-500" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{booking.type}</p>
                        <p className="text-sm text-gray-500 mt-0.5">{booking.vet}</p>
                        <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-600">
                          <span className="flex items-center gap-1.5"><PawPrint className="w-3.5 h-3.5 text-orange-400" />For {booking.pet}</span>
                          <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-gray-400" />{booking.date}</span>
                          <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-gray-400" />{booking.time}</span>
                        </div>
                      </div>
                    </div>
                    <span className={cn(
                      "text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap",
                      booking.status === "Upcoming" ? "bg-blue-50 text-blue-600 border border-blue-100" : "bg-green-50 text-green-600 border border-green-100"
                    )}>
                      {booking.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== ACTIVITY TAB ===== */}
        {activeTab === "activity" && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">All Activity</h2>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {mockActivity.map((item, index) => (
                <div key={item.id} className={cn("flex items-start gap-4 p-5 hover:bg-gray-50 transition-colors", index !== mockActivity.length - 1 && "border-b border-gray-100")}>
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", item.color)}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{item.title}</p>
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {item.time}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5" />
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
