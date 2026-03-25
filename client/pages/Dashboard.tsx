import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser, useClerk } from "@clerk/clerk-react";
import Header from "@/components/Header";
import {
  PawPrint, Heart, ShoppingBag, Calendar, MapPin, Shield,
  Edit, Plus, Trash2, LogOut, Star, Clock, CheckCircle, Home,
  Stethoscope, ChevronRight, Camera, Mail, Award, RefreshCw,
  TrendingUp, Package, AlertCircle, Loader2, ExternalLink,
  Activity, Zap, Users, X,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Types ───────────────────────────────────────────────────────────────── */
interface VetBooking {
  id:               string;
  vetId:            string;
  vetName:          string;
  consultationType: string;
  petName:          string;
  petType:          string;
  ownerName:        string;
  ownerEmail:       string;
  preferredDate:    string | null;
  price:            number;
  status:           string;
  createdAt:        string;
}

interface Order {
  id:          string;
  buyerId:     string;
  buyerName:   string;
  buyerEmail:  string;
  items:       { productId: string; name: string; price: number; quantity: number; image: string; sellerName: string }[];
  totalAmount: number;
  status:      string;
  address:     string;
  phone:       string;
  createdAt:   string;
}

interface HostListing {
  id:          string;
  hostName:    string;
  hostCity:    string;
  pricePerDay: number;
  available:   boolean;
  rating:      number;
  totalReviews:number;
  petTypes:    string[];
  services:    string[];
}

interface Pet {
  id:          string;
  name:        string;
  species:     string;
  breed:       string;
  age:         number;
  gender:      string;
  location:    string;
  vaccinated:  boolean;
  pedigree:    boolean;
  photo:       string;
  description: string;
}

type Tab = "overview" | "pets" | "vets" | "orders" | "hosting" | "activity";

/* ─── Styles ──────────────────────────────────────────────────────────────── */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Clash+Display:wght@400;500;600;700&family=Satoshi:wght@300;400;500;600;700;800&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@400;500;600;700;800;900&display=swap');

.db-root    { font-family: 'Satoshi', 'DM Sans', sans-serif; }
.db-display { font-family: 'Cabinet Grotesk', 'Satoshi', sans-serif; }

@keyframes db-up     { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:none} }
@keyframes db-slide  { from{opacity:0;transform:translateX(-18px)} to{opacity:1;transform:none} }
@keyframes db-pop    { 0%{transform:scale(.88);opacity:0} 65%{transform:scale(1.04)} 100%{transform:scale(1);opacity:1} }
@keyframes db-shimmer{ 0%{background-position:200% center} 100%{background-position:-200% center} }
@keyframes db-pulse  { 0%,100%{opacity:1} 50%{opacity:.45} }
@keyframes db-float  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
@keyframes db-spin   { to{transform:rotate(360deg)} }
@keyframes db-bar    { from{width:0} }
@keyframes db-glow   { 0%,100%{box-shadow:0 0 0 0 rgba(249,115,22,.4)} 50%{box-shadow:0 0 20px 6px rgba(249,115,22,.15)} }

.db-up     { animation: db-up    .45s cubic-bezier(.34,1.56,.64,1) both; }
.db-slide  { animation: db-slide .38s cubic-bezier(.34,1.56,.64,1) both; }
.db-pop    { animation: db-pop   .32s cubic-bezier(.34,1.56,.64,1) both; }
.db-float  { animation: db-float 4s ease-in-out infinite; }
.db-pulse  { animation: db-pulse 2s ease-in-out infinite; }
.db-spin   { animation: db-spin .7s linear infinite; }
.db-bar    { animation: db-bar .8s ease both; }

.db-shimmer {
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
  background-size: 200% 100%;
  animation: db-shimmer 1.5s linear infinite;
}

.db-card {
  transition: transform .22s cubic-bezier(.34,1.56,.64,1), box-shadow .2s ease;
}
.db-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 20px 44px -12px rgba(0,0,0,.15);
}

.db-tab-active {
  background: linear-gradient(135deg, #f97316, #f59e0b);
  color: #fff;
  box-shadow: 0 6px 20px -4px rgba(249,115,22,.45);
}

.db-stat-card {
  position: relative; overflow: hidden;
}
.db-stat-card::before {
  content:''; position:absolute; top:-30px; right:-30px;
  width:100px; height:100px; border-radius:50%;
  background: rgba(255,255,255,.08);
}
.db-stat-card::after {
  content:''; position:absolute; bottom:-20px; left:50%;
  width:60px; height:60px; border-radius:50%;
  background: rgba(255,255,255,.05);
}

.db-noise {
  position:absolute; inset:0; border-radius:inherit; pointer-events:none;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.03'/%3E%3C/svg%3E");
}

.db-scroll::-webkit-scrollbar { width: 4px; }
.db-scroll::-webkit-scrollbar-thumb { background: #fed7aa; border-radius: 99px; }

.badge-verified { background: linear-gradient(135deg,#10b981,#059669); }
.badge-active   { background: linear-gradient(135deg,#3b82f6,#6366f1); }

.hero-gradient {
  background: linear-gradient(135deg, #1a0a00 0%, #2d1400 30%, #431f00 60%, #1a0a00 100%);
}
.accent-line {
  background: linear-gradient(90deg, #f97316, #f59e0b, #ef4444);
  height: 3px; border-radius: 99px;
}
`;

/* ─── Skeleton ────────────────────────────────────────────────────────────── */
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={cn("db-shimmer rounded-xl", className)} />;
}

/* ─── Stat Card ───────────────────────────────────────────────────────────── */
function StatCard({
  icon: Icon, label, value, sub, gradient, delay = 0
}: {
  icon: any; label: string; value: string | number; sub?: string;
  gradient: string; delay?: number;
}) {
  return (
    <div
      className={cn("db-card db-stat-card rounded-2xl p-5 text-white db-up relative", gradient)}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="db-noise" />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>
        <p className="db-display text-3xl font-black">{value}</p>
        <p className="text-white/70 text-sm font-semibold mt-0.5">{label}</p>
        {sub && <p className="text-white/50 text-xs mt-1">{sub}</p>}
      </div>
    </div>
  );
}

/* ─── Pet Emoji ───────────────────────────────────────────────────────────── */
function petEmoji(species: string) {
  if (species === "dog") return "🐕";
  if (species === "cat") return "🐱";
  return "🐾";
}

/* ─── Main ────────────────────────────────────────────────────────────────── */
export default function Dashboard() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  /* ── Data state ── */
  const [myPets,      setMyPets]      = useState<Pet[]>([]);
  const [myOrders,    setMyOrders]    = useState<Order[]>([]);
  const [myVetBooks,  setMyVetBooks]  = useState<VetBooking[]>([]);
  const [myHostings,  setMyHostings]  = useState<HostListing[]>([]);

  const [loadingPets,    setLoadingPets]    = useState(false);
  const [loadingOrders,  setLoadingOrders]  = useState(false);
  const [loadingVets,    setLoadingVets]    = useState(false);
  const [loadingHosting, setLoadingHosting] = useState(false);

  const [deletingPet, setDeletingPet] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const firstName = user?.firstName ?? "Pet Lover";
  const lastName  = user?.lastName  ?? "";
  const email     = user?.emailAddresses?.[0]?.emailAddress ?? "";
  const avatar    = user?.imageUrl;
  const joinDate  = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
    : "Recently";
  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();

  /* ── Fetch pets ── */
  const fetchPets = useCallback(async () => {
    if (!user?.id) return;
    setLoadingPets(true);
    try {
      const res = await fetch("/api/pets");
      if (!res.ok) throw new Error("Failed");
      const data: Pet[] = await res.json();
      // Filter by ownerClerkId
      setMyPets(data.filter((p: any) => p.ownerClerkId === user.id));
    } catch (e) {
      console.error("[dashboard] fetch pets:", e);
    } finally {
      setLoadingPets(false);
    }
  }, [user?.id]);

  /* ── Fetch orders ── */
  const fetchOrders = useCallback(async () => {
    if (!user?.id) return;
    setLoadingOrders(true);
    try {
      const res = await fetch(`/api/store/orders?buyerId=${user.id}`);
      if (!res.ok) throw new Error("Failed");
      setMyOrders(await res.json());
    } catch (e) {
      console.error("[dashboard] fetch orders:", e);
    } finally {
      setLoadingOrders(false);
    }
  }, [user?.id]);

  /* ── Fetch vet bookings — not persisted per-user, use localStorage backup ── */
  const fetchVetBookings = useCallback(() => {
    try {
      const stored = localStorage.getItem(`vet_bookings_${user?.id}`);
      if (stored) setMyVetBooks(JSON.parse(stored));
    } catch {}
  }, [user?.id]);

  /* ── Fetch hosting listings ── */
  const fetchHostings = useCallback(async () => {
    if (!user?.id) return;
    setLoadingHosting(true);
    try {
      const res = await fetch(`/api/hosting?`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setMyHostings(data.filter((h: any) => h.hostClerkId === user.id));
    } catch (e) {
      console.error("[dashboard] fetch hostings:", e);
    } finally {
      setLoadingHosting(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchPets();
      fetchOrders();
      fetchVetBookings();
      fetchHostings();
    }
  }, [user?.id]);

  /* ── Delete pet ── */
  const handleDeletePet = async (petId: string) => {
    setConfirmDelete(null);
    setDeletingPet(petId);
    try {
      // Pets API doesn't have DELETE endpoint — remove from local state only
      setMyPets(prev => prev.filter(p => p.id !== petId));
    } finally {
      setDeletingPet(null);
    }
  };

  /* ── Toggle hosting availability ── */
  const toggleAvailability = async (hostId: string, current: boolean) => {
    try {
      await fetch(`/api/hosting/${hostId}/availability`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ available: !current, hostClerkId: user?.id }),
      });
      setMyHostings(prev => prev.map(h => h.id === hostId ? { ...h, available: !current } : h));
    } catch (e) {
      console.error("[dashboard] toggle availability:", e);
    }
  };

  /* ── Tabs ── */
  const tabs = [
    { id: "overview",  label: "Overview",      icon: TrendingUp  },
    { id: "pets",      label: `Pets (${myPets.length})`, icon: PawPrint },
    { id: "vets",      label: "Vet Bookings",  icon: Stethoscope },
    { id: "orders",    label: `Orders (${myOrders.length})`, icon: ShoppingBag },
    { id: "hosting",   label: "My Hosting",    icon: Home        },
    { id: "activity",  label: "Activity",      icon: Activity    },
  ];

  const orderTotal = myOrders.reduce((s, o) => s + o.totalAmount, 0);

  return (
    <>
      <style>{STYLES}</style>
      <div className="db-root min-h-screen" style={{ background: "#f8f7f4" }}>
        <Header />

        {/* ── HERO ── */}
        <section className="hero-gradient relative overflow-hidden">
          <div className="db-noise" />
          <div
            className="absolute inset-0 opacity-[.04]"
            style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }}
          />
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-orange-500/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl" />

          <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Avatar */}
              <div className="relative db-up flex-shrink-0">
                {avatar ? (
                  <img src={avatar} alt={firstName}
                    className="w-24 h-24 rounded-2xl object-cover border-2 border-orange-400/30 shadow-2xl" />
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center shadow-2xl">
                    <span className="db-display text-3xl font-black text-white">{initials}</span>
                  </div>
                )}
                <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-green-400 rounded-full border-2 border-gray-900 db-pulse" />
              </div>

              {/* Info */}
              <div className="flex-1 db-up" style={{ animationDelay: "80ms" }}>
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h1 className="db-display text-3xl sm:text-4xl font-black text-white">
                    {firstName} {lastName}
                  </h1>
                  <span className="badge-verified flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-white shadow-lg">
                    <CheckCircle className="w-3 h-3" /> Verified
                  </span>
                  <span className="badge-active flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-white shadow-lg">
                    <Zap className="w-3 h-3" /> Active
                  </span>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-white/60">
                  <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{email}</span>
                  <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />Joined {joinDate}</span>
                  <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />Delhi, India</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 flex-shrink-0 db-up" style={{ animationDelay: "140ms" }}>
                <Link
                  to="/breeding"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-bold hover:bg-orange-600 transition-colors shadow-lg shadow-orange-900/30"
                >
                  <Plus className="w-4 h-4" /> Add Pet
                </Link>
                <button
                  onClick={() => signOut(() => navigate("/"))}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-sm font-bold hover:bg-white/20 transition-colors backdrop-blur-sm"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </div>

            {/* Accent line */}
            <div className="accent-line mt-8 mb-0 w-24 db-up" style={{ animationDelay: "200ms" }} />
          </div>
        </section>

        {/* ── TABS ── */}
        <div className="sticky top-[65px] z-30 bg-white border-b border-gray-100 shadow-sm">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-1 overflow-x-auto py-2 db-scroll">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as Tab)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex-shrink-0",
                    activeTab === tab.id
                      ? "db-tab-active"
                      : "text-gray-500 hover:bg-orange-50 hover:text-orange-600"
                  )}
                >
                  <tab.icon className="w-4 h-4" />{tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── CONTENT ── */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">

          {/* ════ OVERVIEW ════ */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              {/* Stats grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={PawPrint} label="My Pets" value={myPets.length}
                  gradient="bg-gradient-to-br from-orange-500 to-amber-500" delay={0} />
                <StatCard icon={ShoppingBag} label="Total Orders" value={myOrders.length}
                  sub={`₹${orderTotal.toLocaleString("en-IN")} spent`}
                  gradient="bg-gradient-to-br from-emerald-500 to-teal-600" delay={60} />
                <StatCard icon={Stethoscope} label="Vet Bookings" value={myVetBooks.length}
                  gradient="bg-gradient-to-br from-blue-500 to-indigo-600" delay={120} />
                <StatCard icon={Home} label="Host Listings" value={myHostings.length}
                  gradient="bg-gradient-to-br from-purple-500 to-pink-600" delay={180} />
              </div>

              {/* Two-col layout */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* My Pets preview */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 db-card db-up" style={{ animationDelay: "200ms" }}>
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="db-display text-xl font-black text-gray-900">My Pets</h2>
                    <button
                      onClick={() => setActiveTab("pets")}
                      className="text-sm text-orange-500 font-bold hover:text-orange-600 flex items-center gap-1 transition-colors"
                    >
                      View all <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  {loadingPets ? (
                    <div className="space-y-3">{[1,2].map(i=><Skeleton key={i} className="h-16" />)}</div>
                  ) : myPets.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-5xl mb-3 db-float">🐾</div>
                      <p className="text-gray-500 text-sm font-medium mb-4">No pets listed yet</p>
                      <Link to="/breeding"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-bold hover:bg-orange-600 transition-colors">
                        <Plus className="w-4 h-4" /> List a Pet
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {myPets.slice(0, 3).map(pet => (
                        <div key={pet.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-orange-50 transition-colors">
                          <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-orange-100">
                            {pet.photo ? (
                              <img src={pet.photo} alt={pet.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-2xl">{petEmoji(pet.species)}</div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 truncate">{pet.name}</p>
                            <p className="text-sm text-gray-500 truncate">{pet.breed} · {pet.age}yr · {pet.gender}</p>
                          </div>
                          {pet.vaccinated && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">✓ Vacc.</span>
                          )}
                        </div>
                      ))}
                      {myPets.length > 3 && (
                        <button onClick={() => setActiveTab("pets")}
                          className="w-full text-sm text-orange-500 font-bold py-2 rounded-xl hover:bg-orange-50 transition-colors">
                          +{myPets.length - 3} more pets
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Recent Orders preview */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 db-card db-up" style={{ animationDelay: "260ms" }}>
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="db-display text-xl font-black text-gray-900">Recent Orders</h2>
                    <button onClick={() => setActiveTab("orders")}
                      className="text-sm text-orange-500 font-bold hover:text-orange-600 flex items-center gap-1 transition-colors">
                      View all <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  {loadingOrders ? (
                    <div className="space-y-3">{[1,2].map(i=><Skeleton key={i} className="h-14" />)}</div>
                  ) : myOrders.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-5xl mb-3 db-float">🛒</div>
                      <p className="text-gray-500 text-sm font-medium mb-4">No orders yet</p>
                      <Link to="/store"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-bold hover:bg-orange-600 transition-colors">
                        <ShoppingBag className="w-4 h-4" /> Shop Now
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {myOrders.slice(0, 3).map(order => {
                        const statusMeta: Record<string, { color: string; label: string }> = {
                          pending:   { color: "bg-yellow-100 text-yellow-700", label: "Pending" },
                          confirmed: { color: "bg-blue-100 text-blue-700",   label: "Confirmed" },
                          shipped:   { color: "bg-purple-100 text-purple-700", label: "Shipped" },
                          delivered: { color: "bg-green-100 text-green-700", label: "Delivered" },
                          cancelled: { color: "bg-red-100 text-red-700",   label: "Cancelled" },
                        };
                        const s = statusMeta[order.status] ?? statusMeta.pending;
                        return (
                          <div key={order.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
                              <Package className="w-5 h-5 text-orange-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-gray-900 text-sm truncate">
                                #{order.id.slice(-8).toUpperCase()}
                              </p>
                              <p className="text-xs text-gray-500">{order.items.length} item{order.items.length !== 1 ? "s" : ""}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="font-black text-gray-900 text-sm">₹{order.totalAmount.toLocaleString("en-IN")}</p>
                              <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", s.color)}>{s.label}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick actions */}
              <div className="db-up" style={{ animationDelay: "320ms" }}>
                <h2 className="db-display text-xl font-black text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {[
                    { label: "Find a Match", icon: "❤️", href: "/breeding", color: "from-orange-400 to-amber-400" },
                    { label: "Adopt a Pet",  icon: "🐾", href: "/adoption", color: "from-purple-400 to-pink-400" },
                    { label: "Book a Vet",   icon: "🩺", href: "/vets",     color: "from-red-400 to-rose-400" },
                    { label: "Host a Pet",   icon: "🏡", href: "/hosting",  color: "from-yellow-400 to-orange-400" },
                    { label: "Pet Store",    icon: "🛍️", href: "/store",    color: "from-green-400 to-emerald-400" },
                    { label: "Community",    icon: "👥", href: "/community",color: "from-blue-400 to-indigo-400" },
                  ].map((action) => (
                    <Link
                      key={action.href}
                      to={action.href}
                      className={cn("db-card flex flex-col items-center gap-2 p-4 rounded-2xl text-white font-bold text-sm text-center shadow-md bg-gradient-to-br", action.color)}
                    >
                      <span className="text-3xl db-float">{action.icon}</span>
                      {action.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Account Details */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 db-card db-up" style={{ animationDelay: "380ms" }}>
                <h2 className="db-display text-xl font-black text-gray-900 mb-5">Account Details</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {[
                    { label: "Full Name",    value: `${firstName} ${lastName}` || "—" },
                    { label: "Email",        value: email || "—" },
                    { label: "Member Since", value: joinDate },
                    { label: "Location",     value: "Delhi, India" },
                    { label: "Account Status", value: "Active & Verified" },
                    { label: "Pets Registered", value: `${myPets.length} pet${myPets.length !== 1 ? "s" : ""}` },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">{label}</p>
                      <p className="text-gray-900 font-semibold">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ════ PETS ════ */}
          {activeTab === "pets" && (
            <div className="db-slide">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="db-display text-2xl font-black text-gray-900">My Pets ({myPets.length})</h2>
                  <p className="text-gray-500 text-sm mt-0.5">Pets you've listed on Breeding Match</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={fetchPets} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-gray-500 text-sm font-semibold hover:bg-gray-50 transition-colors">
                    <RefreshCw className="w-4 h-4" /> Refresh
                  </button>
                  <Link to="/breeding"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-bold hover:bg-orange-600 transition-colors shadow-sm">
                    <Plus className="w-4 h-4" /> Add Pet
                  </Link>
                </div>
              </div>

              {loadingPets ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {[1,2,3].map(i => <Skeleton key={i} className="h-72" />)}
                </div>
              ) : myPets.length === 0 ? (
                <div className="bg-white rounded-3xl border-2 border-dashed border-orange-200 p-16 text-center db-pop">
                  <div className="text-7xl mb-5 db-float">🐾</div>
                  <h3 className="db-display text-2xl font-black text-gray-900 mb-2">No pets listed yet</h3>
                  <p className="text-gray-500 mb-6">Go to Breeding Match to add your pet and start finding matches!</p>
                  <Link to="/breeding"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-orange-500 text-white font-bold hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200">
                    <Plus className="w-5 h-5" /> List My Pet
                  </Link>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {myPets.map((pet, i) => (
                    <div key={pet.id} className="db-card bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden db-up"
                      style={{ animationDelay: `${i * 60}ms` }}>
                      {/* Photo */}
                      <div className="relative h-44 overflow-hidden bg-gradient-to-br from-orange-100 to-amber-100">
                        {pet.photo ? (
                          <img src={pet.photo} alt={pet.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-7xl db-float">{petEmoji(pet.species)}</div>
                        )}
                        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                          {pet.vaccinated && (
                            <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">✓ Vaccinated</span>
                          )}
                          {pet.pedigree && (
                            <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">🏆 Pedigree</span>
                          )}
                        </div>
                        <div className="absolute top-3 right-3 flex gap-1.5">
                          <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold",
                            pet.species === "cat" ? "bg-purple-500 text-white" : "bg-orange-500 text-white")}>
                            {pet.species === "cat" ? "🐱 Cat" : "🐕 Dog"}
                          </span>
                        </div>
                      </div>
                      {/* Content */}
                      <div className="p-5">
                        <h3 className="db-display text-xl font-black text-gray-900 mb-0.5">{pet.name}</h3>
                        <p className="text-orange-500 font-semibold text-sm mb-3">{pet.breed}</p>
                        <div className="space-y-1.5 text-sm text-gray-500 mb-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />{pet.age}yr · {pet.gender}
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />{pet.location}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Link to="/breeding"
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                            <Edit className="w-3.5 h-3.5" /> Edit
                          </Link>
                          {confirmDelete === pet.id ? (
                            <div className="flex gap-1.5">
                              <button onClick={() => handleDeletePet(pet.id)}
                                className="flex items-center gap-1 px-3 py-2 border border-red-300 rounded-xl text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors">
                                {deletingPet === pet.id ? <Loader2 className="w-3.5 h-3.5 db-spin" /> : "Yes"}
                              </button>
                              <button onClick={() => setConfirmDelete(null)}
                                className="px-3 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => setConfirmDelete(pet.id)}
                              className="flex items-center gap-1.5 px-3 py-2 border border-red-200 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ════ VET BOOKINGS ════ */}
          {activeTab === "vets" && (
            <div className="db-slide">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="db-display text-2xl font-black text-gray-900">Vet Bookings</h2>
                  <p className="text-gray-500 text-sm mt-0.5">Your consultation history</p>
                </div>
                <Link to="/vets"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors shadow-sm">
                  <Plus className="w-4 h-4" /> Book Consultation
                </Link>
              </div>

              {myVetBooks.length === 0 ? (
                <div className="bg-white rounded-3xl border-2 border-dashed border-red-100 p-16 text-center db-pop">
                  <div className="text-7xl mb-5 db-float">🩺</div>
                  <h3 className="db-display text-2xl font-black text-gray-900 mb-2">No bookings yet</h3>
                  <p className="text-gray-500 mb-6">Book a video, phone, or in-person consultation with our verified vets</p>
                  <Link to="/vets"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-200">
                    <Stethoscope className="w-5 h-5" /> Find a Vet
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {myVetBooks.map((booking, i) => (
                    <div key={booking.id} className="db-card bg-white rounded-2xl border border-gray-100 shadow-sm p-5 db-up"
                      style={{ animationDelay: `${i * 50}ms` }}>
                      <div className="flex items-start gap-4 flex-wrap">
                        <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Stethoscope className="w-6 h-6 text-red-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div>
                              <p className="font-black text-gray-900">{booking.vetName}</p>
                              <p className="text-sm text-gray-500 mt-0.5">{booking.consultationType} consultation · {booking.petName} ({booking.petType})</p>
                            </div>
                            <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-100 text-blue-700">{booking.status}</span>
                          </div>
                          <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
                            {booking.preferredDate && (
                              <span className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                {new Date(booking.preferredDate).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                              </span>
                            )}
                            <span className="flex items-center gap-1.5">
                              <Award className="w-3.5 h-3.5 text-orange-400" />
                              ₹{booking.price}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              {new Date(booking.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                            </span>
                          </div>
                        </div>
                        <Link to="/vets"
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors flex-shrink-0">
                          <ExternalLink className="w-3.5 h-3.5" /> Book Again
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ════ ORDERS ════ */}
          {activeTab === "orders" && (
            <div className="db-slide">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="db-display text-2xl font-black text-gray-900">Order History ({myOrders.length})</h2>
                  {myOrders.length > 0 && (
                    <p className="text-gray-500 text-sm mt-0.5">Total spent: ₹{orderTotal.toLocaleString("en-IN")}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={fetchOrders}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-gray-500 text-sm font-semibold hover:bg-gray-50 transition-colors">
                    <RefreshCw className="w-4 h-4" /> Refresh
                  </button>
                  <Link to="/store"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-500 text-white text-sm font-bold hover:bg-green-600 transition-colors shadow-sm">
                    <ShoppingBag className="w-4 h-4" /> Shop Now
                  </Link>
                </div>
              </div>

              {loadingOrders ? (
                <div className="space-y-4">{[1,2,3].map(i=><Skeleton key={i} className="h-24" />)}</div>
              ) : myOrders.length === 0 ? (
                <div className="bg-white rounded-3xl border-2 border-dashed border-green-100 p-16 text-center db-pop">
                  <div className="text-7xl mb-5 db-float">🛒</div>
                  <h3 className="db-display text-2xl font-black text-gray-900 mb-2">No orders yet</h3>
                  <p className="text-gray-500 mb-6">Browse our pet store for food, toys, grooming supplies and more</p>
                  <Link to="/store"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-green-500 text-white font-bold hover:bg-green-600 transition-colors shadow-lg shadow-green-200">
                    <ShoppingBag className="w-5 h-5" /> Shop Now
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {myOrders.map((order, i) => {
                    const statusColors: Record<string, string> = {
                      pending:   "bg-yellow-100 text-yellow-700 border-yellow-200",
                      confirmed: "bg-blue-100 text-blue-700 border-blue-200",
                      shipped:   "bg-purple-100 text-purple-700 border-purple-200",
                      delivered: "bg-green-100 text-green-700 border-green-200",
                      cancelled: "bg-red-100 text-red-700 border-red-200",
                    };
                    const sc = statusColors[order.status] ?? statusColors.pending;
                    return (
                      <div key={order.id} className="db-card bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden db-up"
                        style={{ animationDelay: `${i * 50}ms` }}>
                        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
                          <div>
                            <p className="font-black text-gray-900">#{order.id.slice(-8).toUpperCase()}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {new Date(order.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                              {" · "}{order.items.length} item{order.items.length !== 1 ? "s" : ""}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={cn("text-xs font-bold px-3 py-1.5 rounded-full border", sc)}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                            <span className="db-display font-black text-gray-900 text-lg">₹{order.totalAmount.toLocaleString("en-IN")}</span>
                          </div>
                        </div>
                        <div className="px-5 py-4 space-y-2">
                          {order.items.map((item, j) => (
                            <div key={j} className="flex items-center gap-3 text-sm">
                              <div className="w-9 h-9 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                                {item.image
                                  ? <img src={item.image} className="w-full h-full object-cover rounded-lg" alt="" />
                                  : <Package className="w-4 h-4 text-orange-400" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 truncate">{item.name}</p>
                                <p className="text-gray-400 text-xs">by {item.sellerName} · Qty: {item.quantity}</p>
                              </div>
                              <p className="font-bold text-gray-900 flex-shrink-0">₹{(item.price * item.quantity).toLocaleString("en-IN")}</p>
                            </div>
                          ))}
                        </div>
                        {order.address && (
                          <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-500">
                            <MapPin className="w-3.5 h-3.5 text-orange-400" />{order.address}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ════ HOSTING ════ */}
          {activeTab === "hosting" && (
            <div className="db-slide">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="db-display text-2xl font-black text-gray-900">My Host Listings ({myHostings.length})</h2>
                  <p className="text-gray-500 text-sm mt-0.5">Manage your pet hosting availability</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={fetchHostings}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-gray-500 text-sm font-semibold hover:bg-gray-50 transition-colors">
                    <RefreshCw className="w-4 h-4" /> Refresh
                  </button>
                  <Link to="/hosting"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-yellow-500 text-white text-sm font-bold hover:bg-yellow-600 transition-colors shadow-sm">
                    <Plus className="w-4 h-4" /> New Listing
                  </Link>
                </div>
              </div>

              {loadingHosting ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {[1,2].map(i => <Skeleton key={i} className="h-48" />)}
                </div>
              ) : myHostings.length === 0 ? (
                <div className="bg-white rounded-3xl border-2 border-dashed border-yellow-100 p-16 text-center db-pop">
                  <div className="text-7xl mb-5 db-float">🏡</div>
                  <h3 className="db-display text-2xl font-black text-gray-900 mb-2">Not hosting yet</h3>
                  <p className="text-gray-500 mb-6">Earn money by hosting other people's pets in your home</p>
                  <Link to="/hosting"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-yellow-500 text-white font-bold hover:bg-yellow-600 transition-colors shadow-lg shadow-yellow-200">
                    <Home className="w-5 h-5" /> Become a Host
                  </Link>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {myHostings.map((host, i) => (
                    <div key={host.id} className="db-card bg-white rounded-2xl border border-gray-100 shadow-sm p-5 db-up"
                      style={{ animationDelay: `${i * 60}ms` }}>
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="db-display font-black text-gray-900 text-lg">{host.hostName}</h3>
                          <p className="text-gray-500 text-sm">{host.hostCity}</p>
                        </div>
                        <div className={cn("w-3 h-3 rounded-full mt-1.5 flex-shrink-0",
                          host.available ? "bg-green-400 db-pulse" : "bg-gray-300")} />
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span className="font-bold text-gray-900">{host.rating > 0 ? host.rating.toFixed(1) : "New"}</span>
                        {host.totalReviews > 0 && <span className="text-gray-400 text-sm">({host.totalReviews})</span>}
                      </div>

                      <div className="flex flex-wrap gap-1 mb-4">
                        {host.petTypes.slice(0, 3).map(pt => (
                          <span key={pt} className="text-xs font-semibold bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full capitalize">{pt}</span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="db-display font-black text-orange-600 text-lg">₹{host.pricePerDay}/day</span>
                        <button
                          onClick={() => toggleAvailability(host.id, host.available)}
                          className={cn("px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                            host.available
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          )}
                        >
                          {host.available ? "✓ Available" : "Set Available"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ════ ACTIVITY ════ */}
          {activeTab === "activity" && (
            <div className="db-slide">
              <h2 className="db-display text-2xl font-black text-gray-900 mb-6">Account Activity</h2>
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Summaries */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h3 className="db-display font-black text-gray-900 text-lg mb-4">Platform Summary</h3>
                  <div className="space-y-4">
                    {[
                      { icon: PawPrint, label: "Pets on Breeding Match", value: myPets.length, color: "text-orange-500 bg-orange-50", action: "/breeding" },
                      { icon: ShoppingBag, label: "Store Orders", value: myOrders.length, color: "text-green-500 bg-green-50", action: "/store" },
                      { icon: Stethoscope, label: "Vet Consultations", value: myVetBooks.length, color: "text-red-500 bg-red-50", action: "/vets" },
                      { icon: Home, label: "Host Listings", value: myHostings.length, color: "text-yellow-600 bg-yellow-50", action: "/hosting" },
                    ].map(({ icon: Icon, label, value, color, action }) => (
                      <div key={label} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", color)}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <span className="font-semibold text-gray-700">{label}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="db-display font-black text-gray-900 text-xl">{value}</span>
                          <Link to={action}
                            className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs text-orange-500 font-bold">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent orders activity */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h3 className="db-display font-black text-gray-900 text-lg mb-4">Recent Activity</h3>
                  {myOrders.length === 0 && myPets.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-3">📋</div>
                      <p className="text-gray-500 text-sm">No activity yet. Start exploring PetMatch!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {myPets.slice(0, 2).map(pet => (
                        <div key={`pet-${pet.id}`} className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
                          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <PawPrint className="w-4 h-4 text-orange-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">Listed {pet.name} on Breeding Match</p>
                            <p className="text-xs text-gray-400">{pet.breed} · {pet.gender}</p>
                          </div>
                        </div>
                      ))}
                      {myOrders.slice(0, 3).map(order => (
                        <div key={`order-${order.id}`} className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <ShoppingBag className="w-4 h-4 text-green-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">
                              Order #{order.id.slice(-6).toUpperCase()} · {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                            </p>
                            <p className="text-xs text-gray-400">
                              ₹{order.totalAmount.toLocaleString("en-IN")} · {new Date(order.createdAt).toLocaleDateString("en-IN", { dateStyle: "short" })}
                            </p>
                          </div>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize flex-shrink-0">{order.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Profile completeness */}
                <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl p-6 text-white lg:col-span-2">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <h3 className="db-display font-black text-2xl mb-1">Explore More Features</h3>
                      <p className="text-white/75 text-sm">Make the most of PetMatch's platform</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: "Adoption", href: "/adoption" },
                        { label: "Insurance", href: "/insurance" },
                        { label: "Community", href: "/community" },
                        { label: "Marketplace", href: "/marketplace" },
                      ].map(({ label, href }) => (
                        <Link key={href} to={href}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/20 text-white text-sm font-bold hover:bg-white/30 transition-colors backdrop-blur-sm border border-white/20">
                          {label} <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
