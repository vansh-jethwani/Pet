import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/clerk-react";
import Header from "@/components/Header";
import {
  Stethoscope, Video, Phone, MapPin, Star, Check, Award, Calendar,
  Search, Filter, Clock, ChevronRight, Heart, Shield, Zap, X,
  Loader2, AlertCircle, RefreshCw, User, Mail, FileText, PawPrint,
  StickyNote, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface Veterinarian {
  id: string;
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
  available: boolean;
  clinic?: string;
}

interface Booking {
  id: string;
  vetId: string;
  vetName: string;
  consultationType: "video" | "phone" | "inperson";
  petName: string;
  petType: string;
  ownerName: string;
  ownerEmail: string;
  preferredDate: string;
  notes: string;
  price: number;
  status: string;
  createdAt: string;
}

type ConsultType = "all" | "video" | "phone" | "inperson";
type SortBy = "rating" | "experience" | "price";

interface FilterState {
  consultationType: ConsultType;
  maxPrice: number;
  verified: boolean;
  specialty: string;
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const consultTypeConfig = {
  video:    { Icon: Video,       label: "Video",  color: "from-red-500 to-rose-400",     light: "bg-red-50 text-red-600 border-red-100"        },
  phone:    { Icon: Phone,       label: "Phone",  color: "from-orange-500 to-amber-400", light: "bg-orange-50 text-orange-600 border-orange-100" },
  inperson: { Icon: Stethoscope, label: "Clinic", color: "from-rose-500 to-pink-400",    light: "bg-rose-50 text-rose-600 border-rose-100"      },
} as const;

function priceOf(vet: Veterinarian, type: "video" | "phone" | "inperson"): number {
  return type === "video" ? vet.videoPrice : type === "phone" ? vet.phonePrice : vet.inpersonPrice;
}

const API = "/api/vets";

/* ═══════════════════════════════════════════════════════════════════════════
   BOOKING MODAL
═══════════════════════════════════════════════════════════════════════════ */
function BookingModal({
  vet,
  onClose,
  onConfirmed,
}: {
  vet: Veterinarian;
  onClose: () => void;
  onConfirmed: (b: Booking) => void;
}) {
  const { user } = useUser();
  const [consultationType, setConsultationType] = useState<"video" | "phone" | "inperson">(
    vet.consultationTypes[0]
  );
  const [form, setForm] = useState({
    petName: "",
    petType: "dog",
    ownerName:  user?.fullName ?? user?.firstName ?? "",
    ownerEmail: user?.emailAddresses?.[0]?.emailAddress ?? "",
    preferredDate: "",
    notes: "",
  });
  const [errors,      setErrors]      = useState<Record<string, string>>({});
  const [loading,     setLoading]     = useState(false);
  const [serverError, setServerError] = useState("");

  const price = priceOf(vet, consultationType);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.petName.trim())   e.petName    = "Pet name is required";
    if (!form.ownerName.trim()) e.ownerName  = "Your name is required";
    if (!form.ownerEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.ownerEmail))
      e.ownerEmail = "Valid email is required";
    if (!form.preferredDate) e.preferredDate = "Please pick a date & time";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setServerError("");
    try {
      const res = await fetch(`${API}/${vet.id}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, consultationType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Booking failed");
      onConfirmed(data as Booking);
    } catch (err: any) {
      setServerError(err.message || "Failed to book. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inpCls = (hasError: boolean) =>
    cn(
      "w-full px-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all",
      hasError ? "border-red-400 bg-red-50" : "border-gray-200 bg-white"
    );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-red-600 to-rose-500 px-6 py-5 rounded-t-3xl flex items-center justify-between">
          <div className="text-white">
            <p className="text-xs font-bold uppercase tracking-widest opacity-70 mb-0.5">Book Consultation</p>
            <h2 className="text-xl font-black">{vet.name}</h2>
            <p className="text-white/70 text-sm">{vet.title}</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Consultation type */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Consultation Type</p>
            <div className="grid grid-cols-3 gap-2">
              {vet.consultationTypes.map((type) => {
                const { Icon, label } = consultTypeConfig[type];
                const p = priceOf(vet, type);
                const isActive = consultationType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setConsultationType(type)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center",
                      isActive ? "border-red-500 bg-red-50" : "border-gray-100 hover:border-red-200"
                    )}
                  >
                    <Icon className={cn("w-5 h-5", isActive ? "text-red-500" : "text-gray-400")} />
                    <span className={cn("text-xs font-bold", isActive ? "text-red-600" : "text-gray-500")}>{label}</span>
                    <span className={cn("text-sm font-black", isActive ? "text-red-500" : "text-gray-700")}>${p}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pet info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Pet Name</label>
              <div className="relative">
                <PawPrint className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={form.petName}
                  onChange={(e) => setForm({ ...form, petName: e.target.value })}
                  placeholder="e.g. Buddy"
                  className={cn(inpCls(!!errors.petName), "pl-9")}
                />
              </div>
              {errors.petName && <p className="text-xs text-red-500 mt-1">{errors.petName}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Pet Type</label>
              <div className="relative">
                <select
                  value={form.petType}
                  onChange={(e) => setForm({ ...form, petType: e.target.value })}
                  className={inpCls(false)}
                >
                  {["Dog", "Cat", "Bird", "Fish", "Rabbit", "Reptile", "Other"].map((t) => (
                    <option key={t} value={t.toLowerCase()}>{t}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Owner info */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Your Name</label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={form.ownerName}
                onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                placeholder="Your full name"
                className={cn(inpCls(!!errors.ownerName), "pl-9")}
              />
            </div>
            {errors.ownerName && <p className="text-xs text-red-500 mt-1">{errors.ownerName}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={form.ownerEmail}
                onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })}
                placeholder="you@example.com"
                className={cn(inpCls(!!errors.ownerEmail), "pl-9")}
              />
            </div>
            {errors.ownerEmail && <p className="text-xs text-red-500 mt-1">{errors.ownerEmail}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Preferred Date & Time</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="datetime-local"
                value={form.preferredDate}
                min={new Date().toISOString().slice(0, 16)}
                onChange={(e) => setForm({ ...form, preferredDate: e.target.value })}
                className={cn(inpCls(!!errors.preferredDate), "pl-9")}
              />
            </div>
            {errors.preferredDate && <p className="text-xs text-red-500 mt-1">{errors.preferredDate}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notes (optional)</label>
            <div className="relative">
              <StickyNote className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <textarea
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Describe your pet's symptoms or concerns..."
                className={cn(inpCls(false), "pl-9 resize-none")}
              />
            </div>
          </div>

          {serverError && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {serverError}
            </div>
          )}

          {/* Price summary */}
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-500">{consultTypeConfig[consultationType].label} consultation</span>
              <span className="font-bold text-gray-900">${price}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Response time: {vet.responseTime}</span>
              <span>{vet.verified ? "✓ Verified vet" : "Unverified"}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl font-bold text-white bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 transition-all shadow-md shadow-red-200 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Confirming…</>
              : <><Calendar className="w-4 h-4" /> Confirm Booking — ${price}</>
            }
          </button>
        </form>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   BOOKING SUCCESS MODAL
═══════════════════════════════════════════════════════════════════════════ */
function BookingSuccessModal({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg shadow-green-200">
          <Check className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Booking Confirmed!</h2>
        <p className="text-gray-500 text-sm mb-5 leading-relaxed">
          Your consultation with <span className="font-bold text-gray-800">{booking.vetName}</span> has been booked.
        </p>
        <div className="bg-gray-50 rounded-2xl p-4 text-left space-y-2 mb-6 border border-gray-100">
          {[
            ["Booking ID",  booking.id],
            ["Type",        booking.consultationType],
            ["Pet",         `${booking.petName} (${booking.petType})`],
            ["Price",       `$${booking.price}`],
            ...(booking.preferredDate
              ? [["Date", new Date(booking.preferredDate).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })]]
              : []),
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-gray-400">{label}</span>
              <span className="font-semibold text-gray-800 capitalize">{value}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mb-5">
          A confirmation will be sent to <span className="font-semibold">{booking.ownerEmail}</span>
        </p>
        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 transition-all"
        >
          Done
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════════════ */
export default function Vets() {
  const [vets,    setVets]    = useState<Veterinarian[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  // BUG FIX: favorites now uses Set<string> to match MongoDB string IDs
  const [favorites,        setFavorites]        = useState<Set<string>>(new Set());
  // BUG FIX: selectedVet is string | null (not number)
  const [selectedVet,      setSelectedVet]      = useState<string | null>(null);
  const [bookingVet,       setBookingVet]       = useState<Veterinarian | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy,     setSortBy]     = useState<SortBy>("rating");
  const [filter,     setFilter]     = useState<FilterState>({
    consultationType: "all",
    maxPrice: 150,
    verified: false,
    specialty: "",
  });

  /* ── Fetch from MongoDB via API ── */
  const fetchVets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchTerm)                        params.set("search",           searchTerm);
      if (filter.specialty)                  params.set("specialty",        filter.specialty);
      if (filter.consultationType !== "all") params.set("consultationType", filter.consultationType);
      if (filter.maxPrice < 150)             params.set("maxPrice",         String(filter.maxPrice));
      if (filter.verified)                   params.set("verified",         "true");
      params.set("sortBy", sortBy);

      const res = await fetch(`${API}?${params.toString()}`);
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data: Veterinarian[] = await res.json();
      setVets(data);
    } catch (err: any) {
      setError(err.message || "Failed to load vets");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filter, sortBy]);

  useEffect(() => { fetchVets(); }, [fetchVets]);

  /* ── BUG FIX: correct client-side price filter for "all" type ── */
  const filteredVets = vets.filter((vet) => {
    if (filter.maxPrice < 150 && filter.consultationType === "all") {
      const prices = vet.consultationTypes.map((t) => priceOf(vet, t)).filter((p) => p > 0);
      // only filter out if ALL offered types are over budget
      if (prices.length > 0 && Math.min(...prices) > filter.maxPrice) return false;
    }
    return true;
  });

  const handleFavorite = (id: string) =>
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const handleBookingConfirmed = (booking: Booking) => {
    setBookingVet(null);
    setConfirmedBooking(booking);
  };

  const stats = [
    { icon: Stethoscope, label: "Licensed Vets",   value: `${vets.length || "500"}+`, color: "text-red-300" },
    { icon: Star,        label: "Avg Rating",       value: "4.8★",                    color: "text-amber-300" },
    { icon: Clock,       label: "Avg Response",     value: "<2 hrs",                  color: "text-orange-300" },
    { icon: Shield,      label: "Verified Vets",    value: `${vets.filter((v) => v.verified).length || 0}`,  color: "text-rose-300" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Modals */}
      {bookingVet && (
        <BookingModal vet={bookingVet} onClose={() => setBookingVet(null)} onConfirmed={handleBookingConfirmed} />
      )}
      {confirmedBooking && (
        <BookingSuccessModal booking={confirmedBooking} onClose={() => setConfirmedBooking(null)} />
      )}

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-red-600 via-rose-500 to-orange-500">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-red-800/20 blur-3xl" />

        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
            <div className="text-white max-w-xl">
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm font-semibold mb-5">
                <Zap className="w-3.5 h-3.5" />
                Connect in minutes
              </div>
              <h1 className="text-4xl sm:text-5xl font-black leading-tight mb-4">
                Expert Vet Care,<br />
                <span className="text-white/80">Wherever You Are</span>
              </h1>
              <p className="text-white/70 text-base sm:text-lg leading-relaxed mb-8 max-w-sm">
                Book video, phone, or in-person consultations with licensed veterinarians.
              </p>
              <div className="relative max-w-sm">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or specialty…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50 shadow-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:gap-4">
              {stats.map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-2xl px-5 py-4 text-white text-center min-w-[120px]">
                  <Icon className={cn("w-5 h-5 mx-auto mb-1.5", color)} />
                  <p className="text-2xl font-black">{value}</p>
                  <p className="text-[11px] text-white/60 font-semibold uppercase tracking-wider mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 32" preserveAspectRatio="none">
          <path d="M0,32 C480,0 960,0 1440,32 L1440,32 L0,32 Z" fill="rgb(249,250,251)" />
        </svg>
      </section>

      {/* ── Content ── */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid lg:grid-cols-[280px,1fr] gap-8 items-start">

          {/* ── Sidebar ── */}
          <aside className="lg:sticky lg:top-28 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <Filter className="w-4 h-4 text-red-500" />
                <span className="font-bold text-gray-900">Filters</span>
              </div>

              <div className="p-5 space-y-6">
                {/* Type filter */}
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Consultation Type</p>
                  <div className="space-y-2">
                    {(["all", "video", "phone", "inperson"] as const).map((t) => {
                      const label = t === "all" ? "All Types" : t === "inperson" ? "In-Person" : t.charAt(0).toUpperCase() + t.slice(1) + " Call";
                      const isActive = filter.consultationType === t;
                      return (
                        <button
                          key={t}
                          onClick={() => setFilter({ ...filter, consultationType: t })}
                          className="flex items-center gap-3 w-full group"
                        >
                          <div className={cn(
                            "w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
                            isActive ? "bg-red-500 border-red-500" : "border-gray-300 group-hover:border-red-300"
                          )}>
                            {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <span className="text-sm text-gray-700 font-medium">{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Price — BUG FIX: label shows "Any" at max */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Max Price</p>
                    <span className="text-sm font-bold text-red-500">
                      {filter.maxPrice >= 150 ? "Any" : `$${filter.maxPrice}`}
                    </span>
                  </div>
                  <input
                    type="range" min="20" max="150" step="5"
                    value={filter.maxPrice}
                    onChange={(e) => setFilter({ ...filter, maxPrice: parseInt(e.target.value) })}
                    className="w-full accent-red-500"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>$20</span>
                    <span>Any</span>
                  </div>
                </div>

                {/* Specialty */}
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Specialty</p>
                  <input
                    type="text"
                    value={filter.specialty}
                    onChange={(e) => setFilter({ ...filter, specialty: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
                    placeholder="e.g. Dogs, Cats…"
                  />
                </div>

                {/* Verified toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 font-medium">Verified only</span>
                  <button
                    type="button"
                    onClick={() => setFilter({ ...filter, verified: !filter.verified })}
                    style={{ height: 22, width: 40 }}
                    className={cn(
                      "rounded-full relative border-2 transition-colors flex-shrink-0",
                      filter.verified ? "bg-red-500 border-red-500" : "bg-gray-200 border-gray-200"
                    )}
                  >
                    <div className={cn(
                      "absolute top-[3px] w-4 h-4 bg-white rounded-full shadow-sm transition-transform",
                      filter.verified ? "translate-x-[19px]" : "translate-x-[2px]"
                    )} />
                  </button>
                </div>

                {/* Sort */}
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Sort By</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(["rating", "experience", "price"] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => setSortBy(s)}
                        className={cn(
                          "py-2 text-xs font-bold rounded-xl border-2 transition-all",
                          sortBy === s ? "bg-red-500 border-red-500 text-white" : "border-gray-200 text-gray-500 hover:border-red-200 hover:text-red-500"
                        )}
                      >
                        {s === "rating" ? "Top" : s === "experience" ? "Exp." : "Price"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reset */}
                <button
                  onClick={() => { setFilter({ consultationType: "all", maxPrice: 150, verified: false, specialty: "" }); setSearchTerm(""); }}
                  className="w-full text-xs font-bold text-gray-400 hover:text-red-500 transition-colors py-1"
                >
                  Reset all filters
                </button>

                {favorites.size > 0 && (
                  <div className="bg-red-50 rounded-xl p-3 text-center border border-red-100">
                    <p className="text-2xl font-black text-red-500">{favorites.size}</p>
                    <p className="text-xs text-red-400 font-semibold">saved vet{favorites.size !== 1 ? "s" : ""}</p>
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* ── Main ── */}
          <div>
            {/* Top bar */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-gray-500">
                {loading
                  ? <span className="flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading…</span>
                  : <><span className="font-bold text-gray-900">{filteredVets.length}</span> vet{filteredVets.length !== 1 ? "s" : ""} found</>
                }
              </p>
              <div className="hidden sm:flex gap-2">
                {(["rating", "experience", "price"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSortBy(s)}
                    className={cn(
                      "px-3 py-1.5 text-xs font-bold rounded-lg border transition-all",
                      sortBy === s ? "bg-red-500 border-red-500 text-white" : "border-gray-200 text-gray-500 hover:border-red-200"
                    )}
                  >
                    {s === "rating" ? "Top Rated" : s === "experience" ? "Most Exp." : "Lowest Price"}
                  </button>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && !loading && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-4 mb-6">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-red-700 mb-1">Could not load vets</p>
                  <p className="text-sm text-red-500 mb-3">{error}</p>
                  <button onClick={fetchVets} className="flex items-center gap-1.5 text-sm font-bold text-red-600 hover:text-red-700">
                    <RefreshCw className="w-3.5 h-3.5" /> Retry
                  </button>
                </div>
              </div>
            )}

            {/* Loading skeleton */}
            {loading && (
              <div className="space-y-5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 animate-pulse">
                    <div className="flex gap-5">
                      <div className="w-20 h-20 rounded-2xl bg-gray-100 flex-shrink-0" />
                      <div className="flex-1 space-y-3">
                        <div className="h-5 bg-gray-100 rounded-lg w-48" />
                        <div className="h-4 bg-gray-100 rounded-lg w-32" />
                        <div className="flex gap-2">
                          <div className="h-6 bg-gray-100 rounded-full w-16" />
                          <div className="h-6 bg-gray-100 rounded-full w-20" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty */}
            {!loading && !error && filteredVets.length === 0 && (
              <div className="bg-white rounded-3xl p-16 text-center border border-gray-100 shadow-sm">
                <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Stethoscope className="w-8 h-8 text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No vets found</h3>
                <p className="text-gray-400 text-sm mb-6">Try adjusting your filters or search term.</p>
                <button
                  onClick={() => { setFilter({ consultationType: "all", maxPrice: 150, verified: false, specialty: "" }); setSearchTerm(""); }}
                  className="px-5 py-2.5 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-colors"
                >
                  Reset Filters
                </button>
              </div>
            )}

            {/* Vet cards */}
            {!loading && !error && filteredVets.length > 0 && (
              <div className="space-y-5">
                {filteredVets.map((vet) => (
                  <VetCard
                    key={vet.id}
                    vet={vet}
                    isFavorite={favorites.has(vet.id)}
                    isExpanded={selectedVet === vet.id}
                    onFavorite={() => handleFavorite(vet.id)}
                    onExpand={() => setSelectedVet(selectedVet === vet.id ? null : vet.id)}
                    onBook={() => setBookingVet(vet)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   VET CARD
═══════════════════════════════════════════════════════════════════════════ */
function VetCard({
  vet, isFavorite, isExpanded, onFavorite, onExpand, onBook,
}: {
  vet: Veterinarian;
  isFavorite: boolean;
  isExpanded: boolean;
  onFavorite: () => void;
  onExpand: () => void;
  onBook: () => void;
}) {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
      <div className="p-6">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-100 to-rose-50 flex items-center justify-center text-4xl shadow-sm">
              {vet.image}
            </div>
            <div className={cn(
              "absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center",
              vet.available ? "bg-green-400" : "bg-gray-300"
            )}>
              <div className={cn("w-2 h-2 rounded-full", vet.available ? "bg-green-600" : "bg-gray-500")} />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xl font-black text-gray-900 leading-none">{vet.name}</h3>
                  {vet.verified && (
                    <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-100 px-2 py-0.5 rounded-full text-xs font-bold">
                      <Check className="w-3 h-3" />
                      Verified
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-400 mt-0.5 font-medium">{vet.title}</p>
              </div>
              <button
                onClick={onFavorite}
                className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center border transition-all flex-shrink-0",
                  isFavorite ? "bg-red-50 border-red-200 text-red-500" : "bg-gray-50 border-gray-200 text-gray-300 hover:border-red-200 hover:text-red-400"
                )}
              >
                <Heart className={cn("w-4 h-4", isFavorite && "fill-current")} />
              </button>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 text-sm text-gray-400">
              <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-red-400" />{vet.location}</span>
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-orange-400" />{vet.responseTime}</span>
              <span className="flex items-center gap-1.5"><Award className="w-3.5 h-3.5 text-amber-400" />{vet.experience}+ years</span>
              {vet.reviews > 0 && (
                <span className="flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                  <span className="font-bold text-gray-700">{vet.rating}</span>
                  <span className="text-gray-400">({vet.reviews})</span>
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5 mt-3">
              {vet.specialties.map((s) => (
                <span key={s} className="bg-red-50 border border-red-100 text-red-600 px-2.5 py-0.5 rounded-full text-xs font-semibold">{s}</span>
              ))}
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-500 leading-relaxed mt-4">{vet.bio}</p>

        <div className="flex flex-wrap gap-2 mt-4">
          {vet.consultationTypes.map((type) => {
            const { Icon, label, light } = consultTypeConfig[type];
            return (
              <div key={type} className={cn("flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold", light)}>
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
                <span className="font-black">${priceOf(vet, type)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA bar */}
      <div className="px-6 py-4 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className={cn("w-2 h-2 rounded-full", vet.available ? "bg-green-400" : "bg-gray-300")} />
          <span className={cn("text-xs font-bold", vet.available ? "text-green-600" : "text-gray-400")}>
            {vet.available ? "Available now" : "Currently away"}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onExpand}
            className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-bold text-gray-600 border border-gray-200 hover:border-red-200 hover:text-red-500 transition-all"
          >
            {isExpanded ? "Less" : "Details"}
            <ChevronRight className={cn("w-3.5 h-3.5 transition-transform", isExpanded && "rotate-90")} />
          </button>
          <button
            onClick={onBook}
            disabled={!vet.available}
            className={cn(
              "flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white transition-all shadow-sm",
              vet.available
                ? "bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 shadow-red-200"
                : "bg-gray-300 cursor-not-allowed"
            )}
          >
            <Calendar className="w-3.5 h-3.5" />
            {vet.available ? "Book Now" : "Unavailable"}
          </button>
        </div>
      </div>

      {/* Expanded panel */}
      {isExpanded && (
        <div className="px-6 pb-6 pt-2 border-t border-gray-100">
          <div className="grid sm:grid-cols-3 gap-3 mt-4">
            {vet.consultationTypes.map((type) => {
              const { Icon, label, color } = consultTypeConfig[type];
              return (
                <button
                  key={type}
                  onClick={onBook}
                  disabled={!vet.available}
                  className="group relative overflow-hidden rounded-2xl border border-gray-100 p-5 text-left hover:border-transparent hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity", color)} />
                  <div className="relative z-10">
                    <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br mb-3 flex items-center justify-center text-white shadow-sm", color)}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <p className="font-black text-gray-900 group-hover:text-white text-base transition-colors">{label} Call</p>
                    <p className="text-2xl font-black text-red-500 group-hover:text-white mt-0.5 transition-colors">${priceOf(vet, type)}</p>
                    <p className="text-xs text-gray-400 group-hover:text-white/80 mt-1 transition-colors">per session</p>
                  </div>
                </button>
              );
            })}
          </div>

          {vet.clinic && (
            <p className="text-xs text-gray-400 mt-4 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />{vet.clinic}
            </p>
          )}

          <button
            onClick={onBook}
            disabled={!vet.available}
            className={cn(
              "mt-4 w-full py-3.5 rounded-2xl font-bold text-white transition-all shadow-md flex items-center justify-center gap-2",
              vet.available
                ? "bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 hover:from-red-600 hover:to-pink-600 shadow-red-200"
                : "bg-gray-300 cursor-not-allowed"
            )}
          >
            <Calendar className="w-4 h-4" />
            {vet.available
              ? `Book a Consultation with ${vet.name.split(" ").slice(0, 2).join(" ")}`
              : "Currently Unavailable"}
          </button>
        </div>
      )}
    </div>
  );
}
