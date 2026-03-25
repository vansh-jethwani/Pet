import { useState, useEffect, useCallback, useRef } from "react";
import { useUser } from "@clerk/clerk-react";
import Header from "@/components/Header";
import { cn } from "@/lib/utils";
import {
  Heart, Search, Filter, Plus, X, Check, AlertCircle,
  MapPin, Calendar, Syringe, ChevronDown, Loader2, RefreshCw,
  IndianRupee, Shield, Star, Camera, Phone, Mail, Trash2,
  Edit3, Eye, Send, ChevronLeft, ChevronRight, Sparkles,
  Home, ShoppingBag, ArrowUpDown,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════════════════════ */
interface AdoptionListing {
  id:           string;
  petName:      string;
  species:      string;
  breed:        string;
  age:          number;
  ageUnit:      "months" | "years";
  gender:       "male" | "female";
  color:        string;
  weight:       string;
  photo:        string;
  description:  string;
  traits:       string[];
  vaccinated:   boolean;
  neutered:     boolean;
  microchipped: boolean;
  healthNotes:  string;
  listingType:  "adopt" | "sell";
  price:        number;
  adoptionFee:  number;
  location:     string;
  city:         string;
  state:        string;
  ownerName:    string;
  ownerClerkId: string;
  ownerEmail:   string;
  ownerPhone:   string;
  ownerAvatar:  string;
  shelterOrg:   string;
  status:       "available" | "adopted" | "pending" | "sold";
  featured:     boolean;
  applications: any[];
  createdAt:    string;
}

/* ═══════════════════════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════════════════════ */
const API = "/api/adoption";
const INR = (n: number) => n === 0 ? "Free" : `₹${n.toLocaleString("en-IN")}`;

const CLOUDINARY_CLOUD_NAME    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME    || "";
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "";

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab",
  "Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh",
  "Uttarakhand","West Bengal","Delhi","Jammu & Kashmir","Ladakh","Puducherry",
];

const SPECIES_META: Record<string, { emoji: string; label: string; color: string; bg: string }> = {
  dog:     { emoji: "🐕", label: "Dog",     color: "text-orange-700", bg: "bg-orange-100" },
  cat:     { emoji: "🐱", label: "Cat",     color: "text-amber-700",  bg: "bg-amber-100"  },
  bird:    { emoji: "🐦", label: "Bird",    color: "text-green-700",  bg: "bg-green-100"  },
  rabbit:  { emoji: "🐇", label: "Rabbit",  color: "text-pink-700",   bg: "bg-pink-100"   },
  fish:    { emoji: "🐠", label: "Fish",    color: "text-blue-700",   bg: "bg-blue-100"   },
  reptile: { emoji: "🦎", label: "Reptile", color: "text-teal-700",   bg: "bg-teal-100"   },
  hamster: { emoji: "🐹", label: "Hamster", color: "text-yellow-700", bg: "bg-yellow-100" },
  other:   { emoji: "🐾", label: "Other",   color: "text-gray-700",   bg: "bg-gray-100"   },
};

const TRAITS_OPTIONS = ["Playful","Gentle","Loyal","Smart","Calm","Energetic","Friendly","Independent","Affectionate","Curious","Brave","Adaptable","Good with kids","Good with pets","House trained"];

/* ═══════════════════════════════════════════════════════════════════════════
   STYLES
═══════════════════════════════════════════════════════════════════════════ */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,700;0,9..144,900;1,9..144,400&family=Epilogue:wght@300;400;500;600;700;800&display=swap');

.ad-root    { font-family: 'Epilogue', sans-serif; }
.ad-display { font-family: 'Fraunces', Georgia, serif; }

@keyframes ad-up    { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:none} }
@keyframes ad-pop   { 0%{transform:scale(.88);opacity:0} 60%{transform:scale(1.04)} 100%{transform:scale(1);opacity:1} }
@keyframes ad-shimmer{ 0%{background-position:200% center} 100%{background-position:-200% center} }
@keyframes ad-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
@keyframes ad-pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
@keyframes ad-spin  { to{transform:rotate(360deg)} }
@keyframes ad-slide { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:none} }
@keyframes ad-heart { 0%{transform:scale(1)} 50%{transform:scale(1.4)} 100%{transform:scale(1)} }

.ad-up    { animation: ad-up   .4s cubic-bezier(.34,1.56,.64,1) both; }
.ad-pop   { animation: ad-pop  .35s cubic-bezier(.34,1.56,.64,1) both; }
.ad-float { animation: ad-float 4s ease-in-out infinite; }
.ad-pulse { animation: ad-pulse 2s ease-in-out infinite; }
.ad-spin  { animation: ad-spin .7s linear infinite; }
.ad-slide { animation: ad-slide .35s cubic-bezier(.34,1.56,.64,1) both; }

.ad-shimmer-text {
  background: linear-gradient(90deg,#7c3aed,#db2777,#ea580c,#db2777,#7c3aed);
  background-size:200% auto;
  -webkit-background-clip:text; -webkit-text-fill-color:transparent;
  background-clip:text;
  animation: ad-shimmer 4s linear infinite;
}

.ad-card {
  transition: transform .22s cubic-bezier(.34,1.56,.64,1), box-shadow .2s ease;
}
.ad-card:hover {
  transform: translateY(-4px) scale(1.01);
  box-shadow: 0 20px 50px -12px rgba(124,58,237,.2);
}

.ad-input {
  width:100%; padding:11px 16px; background:#faf9ff; border:2px solid #e8e4f0;
  border-radius:12px; font-family:'Epilogue',sans-serif; font-size:14px; color:#1a1a2e;
  transition:border-color .2s, box-shadow .2s; outline:none;
}
.ad-input:focus { border-color:#7c3aed; box-shadow:0 0 0 4px rgba(124,58,237,.12); background:#fff; }
.ad-input.err { border-color:#ef4444; background:#fef2f2; }
.ad-input::placeholder { color:#a89bc8; }
.ad-select { appearance:none; cursor:pointer; }

.ad-pill {
  display:inline-flex; align-items:center; gap:5px; padding:5px 12px;
  border-radius:100px; border:2px solid #e8e4f0; font-size:12px; font-weight:700;
  cursor:pointer; transition:all .18s; background:#faf9ff; color:#9876d8;
  font-family:'Epilogue',sans-serif;
}
.ad-pill:hover  { border-color:#7c3aed; color:#7c3aed; background:#f5f0ff; }
.ad-pill.active { background:#7c3aed; border-color:#7c3aed; color:#fff; }

.ad-scroll::-webkit-scrollbar { width:3px; }
.ad-scroll::-webkit-scrollbar-thumb { background:#c4b5fd; border-radius:99px; }

.dot-pattern {
  background-image: radial-gradient(circle, #c4b5fd 1px, transparent 1px);
  background-size: 32px 32px;
  opacity: 0.4;
}

.status-available { background:#d1fae5; color:#065f46; border-color:#a7f3d0; }
.status-pending   { background:#fef3c7; color:#92400e; border-color:#fde68a; }
.status-adopted   { background:#dbeafe; color:#1e40af; border-color:#bfdbfe; }
.status-sold      { background:#fce7f3; color:#9d174d; border-color:#fbcfe8; }

.glass-card {
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.6);
}
`;

async function uploadCloudinary(file: File): Promise<string> {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) throw new Error("Cloudinary not configured");
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  const r = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, { method: "POST", body: fd });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error?.message || "Upload failed");
  return d.secure_url;
}

/* ═══════════════════════════════════════════════════════════════════════════
   PET CARD
═══════════════════════════════════════════════════════════════════════════ */
function PetCard({
  listing, favorites, onFavorite, onClick, isOwn, onDelete, onMarkStatus,
}: {
  listing: AdoptionListing;
  favorites: Set<string>;
  onFavorite: (id: string) => void;
  onClick: (l: AdoptionListing) => void;
  isOwn: boolean;
  onDelete?: (id: string) => void;
  onMarkStatus?: (id: string, status: string) => void;
}) {
  const [imgErr, setImgErr] = useState(false);
  const meta = SPECIES_META[listing.species] || SPECIES_META.other;
  const isFav = favorites.has(listing.id);

  return (
    <div className="ad-card bg-white rounded-3xl overflow-hidden border border-purple-100 shadow-sm cursor-pointer group" onClick={() => onClick(listing)}>
      {/* Image */}
      <div className="relative h-52 overflow-hidden bg-gradient-to-br from-purple-100 via-pink-50 to-indigo-100">
        {listing.photo && !imgErr ? (
          <img src={listing.photo} alt={listing.petName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={() => setImgErr(true)} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-7xl ad-float">{meta.emoji}</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {listing.featured && (
            <span className="flex items-center gap-1 bg-amber-400 text-amber-900 text-[10px] font-black px-2.5 py-1 rounded-full shadow">
              <Sparkles className="w-3 h-3" /> Featured
            </span>
          )}
          <span className={cn("flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full shadow", meta.bg, meta.color)}>
            {meta.emoji} {meta.label}
          </span>
        </div>

        {/* Listing type */}
        <div className="absolute top-3 right-12">
          <span className={cn("flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full shadow",
            listing.listingType === "sell" ? "bg-pink-500 text-white" : "bg-purple-500 text-white"
          )}>
            {listing.listingType === "sell" ? <ShoppingBag className="w-2.5 h-2.5" /> : <Home className="w-2.5 h-2.5" />}
            {listing.listingType === "sell" ? "Sale" : "Adopt"}
          </span>
        </div>

        {/* Favorite */}
        <button onClick={e => { e.stopPropagation(); onFavorite(listing.id); }}
          className={cn("absolute top-3 right-3 w-8 h-8 rounded-xl flex items-center justify-center shadow transition-all",
            isFav ? "bg-red-500 text-white" : "bg-white/90 text-gray-400 hover:text-red-400"
          )}>
          <Heart className="w-4 h-4 fill-current" />
        </button>

        {/* Status */}
        {listing.status !== "available" && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className={cn("text-sm font-black px-4 py-2 rounded-full border-2", `status-${listing.status}`)}>
              {listing.status.toUpperCase()}
            </span>
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="ad-display text-xl font-black text-gray-900">{listing.petName}</h3>
            <p className="text-purple-500 font-semibold text-sm">{listing.breed}</p>
          </div>
          <div className="text-right">
            {listing.listingType === "sell" && listing.price > 0 ? (
              <p className="ad-display font-black text-pink-600 text-lg">₹{listing.price.toLocaleString("en-IN")}</p>
            ) : (
              <div>
                <p className="ad-display font-black text-purple-600 text-lg">
                  {listing.adoptionFee > 0 ? `₹${listing.adoptionFee.toLocaleString("en-IN")}` : "Free"}
                </p>
                {listing.adoptionFee > 0 && <p className="text-[10px] text-gray-400 font-semibold">adoption fee</p>}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-3">
          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{listing.age} {listing.ageUnit} · {listing.gender}</span>
          <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-purple-400" />{listing.city}</span>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {listing.vaccinated && <span className="text-[11px] font-bold bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-200">✓ Vaccinated</span>}
          {listing.neutered   && <span className="text-[11px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">✓ Neutered</span>}
          {listing.microchipped && <span className="text-[11px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">✓ Chipped</span>}
        </div>

        {listing.traits.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {listing.traits.slice(0, 3).map(t => (
              <span key={t} className="text-[11px] font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">{t}</span>
            ))}
            {listing.traits.length > 3 && <span className="text-[11px] text-gray-400">+{listing.traits.length - 3}</span>}
          </div>
        )}

        {/* Owner actions */}
        {isOwn && (
          <div className="flex gap-2 mt-3 pt-3 border-t border-purple-50" onClick={e => e.stopPropagation()}>
            <select
              value={listing.status}
              onChange={e => onMarkStatus?.(listing.id, e.target.value)}
              className="flex-1 text-xs font-bold px-2 py-1.5 rounded-lg border border-purple-200 bg-purple-50 text-purple-700 cursor-pointer"
            >
              <option value="available">Available</option>
              <option value="pending">Pending</option>
              <option value="adopted">Adopted</option>
              <option value="sold">Sold</option>
            </select>
            <button onClick={() => onDelete?.(listing.id)}
              className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors border border-red-200">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   DETAIL MODAL
═══════════════════════════════════════════════════════════════════════════ */
function DetailModal({
  listing, onClose, currentUser, onApply,
}: {
  listing: AdoptionListing;
  onClose: () => void;
  currentUser: any;
  onApply: (listingId: string, data: any) => Promise<boolean>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ applicantName: currentUser?.fullName || "", applicantEmail: currentUser?.emailAddresses?.[0]?.emailAddress || "", applicantPhone: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [imgErr, setImgErr] = useState(false);
  const meta = SPECIES_META[listing.species] || SPECIES_META.other;

  const already = currentUser && listing.applications.some(a => a.applicantClerkId === currentUser.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.applicantName.trim() || !form.applicantEmail.trim()) { setError("Name and email are required"); return; }
    setSubmitting(true); setError("");
    const ok = await onApply(listing.id, { ...form, applicantClerkId: currentUser?.id || "" });
    setSubmitting(false);
    if (ok) { setSuccess(true); setShowForm(false); }
    else setError("Failed to submit. Please try again.");
  };

  const price = listing.listingType === "sell" ? listing.price : listing.adoptionFee;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="ad-pop bg-white w-full sm:max-w-2xl sm:rounded-3xl rounded-t-3xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Image header */}
        <div className="relative h-56 flex-shrink-0 overflow-hidden sm:rounded-t-3xl rounded-t-3xl">
          {listing.photo && !imgErr ? (
            <img src={listing.photo} alt={listing.petName} className="w-full h-full object-cover" onError={() => setImgErr(true)} />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-200 via-pink-100 to-indigo-200 flex items-center justify-center text-8xl ad-float">{meta.emoji}</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-5 right-12 text-white">
            <h2 className="ad-display text-3xl font-black">{listing.petName}</h2>
            <p className="text-white/80 font-semibold">{listing.breed} · {listing.age} {listing.ageUnit} · {listing.gender}</p>
          </div>
          <button onClick={onClose} className="absolute top-3 right-3 w-9 h-9 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-xl flex items-center justify-center text-white transition-all">
            <X className="w-4 h-4" />
          </button>
          <div className="absolute top-3 left-3 flex gap-2">
            <span className={cn("text-xs font-black px-3 py-1.5 rounded-full", listing.listingType === "sell" ? "bg-pink-500 text-white" : "bg-purple-500 text-white")}>
              {listing.listingType === "sell" ? "For Sale" : "For Adoption"}
            </span>
            <span className={cn("text-xs font-black px-3 py-1.5 rounded-full border", `status-${listing.status}`)}>
              {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
            </span>
          </div>
        </div>

        {/* Price bar */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-3 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100">
          <div>
            <p className="ad-display font-black text-2xl text-purple-700">
              {listing.listingType === "sell" ? (price > 0 ? `₹${price.toLocaleString("en-IN")}` : "Free") : (price > 0 ? `₹${price.toLocaleString("en-IN")} adoption fee` : "Free Adoption")}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <MapPin className="w-3.5 h-3.5 text-purple-400" />
            {listing.city}, {listing.state}
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto ad-scroll p-6 space-y-5">
          {/* Health badges */}
          <div className="flex flex-wrap gap-2">
            {listing.vaccinated   && <span className="flex items-center gap-1.5 text-sm font-bold bg-green-50 text-green-700 px-3 py-1.5 rounded-full border border-green-200"><Syringe className="w-4 h-4" /> Vaccinated</span>}
            {listing.neutered     && <span className="flex items-center gap-1.5 text-sm font-bold bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full border border-blue-200"><Shield className="w-4 h-4" /> Neutered/Spayed</span>}
            {listing.microchipped && <span className="flex items-center gap-1.5 text-sm font-bold bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full border border-indigo-200"><Shield className="w-4 h-4" /> Microchipped</span>}
          </div>

          {/* Description */}
          <div>
            <h4 className="ad-display font-bold text-gray-900 mb-2">About {listing.petName}</h4>
            <p className="text-gray-600 leading-relaxed text-sm">{listing.description}</p>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Color",    value: listing.color || "—"  },
              { label: "Weight",   value: listing.weight || "—" },
              { label: "Location", value: listing.city          },
              { label: "State",    value: listing.state         },
            ].map(({ label, value }) => (
              <div key={label} className="bg-purple-50 rounded-xl p-3 border border-purple-100">
                <p className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-0.5">{label}</p>
                <p className="font-semibold text-gray-900 text-sm">{value}</p>
              </div>
            ))}
          </div>

          {/* Traits */}
          {listing.traits.length > 0 && (
            <div>
              <h4 className="ad-display font-bold text-gray-900 mb-2">Personality</h4>
              <div className="flex flex-wrap gap-2">
                {listing.traits.map(t => (
                  <span key={t} className="text-sm font-semibold text-purple-600 bg-purple-50 px-3 py-1.5 rounded-full border border-purple-200">{t}</span>
                ))}
              </div>
            </div>
          )}

          {/* Health notes */}
          {listing.healthNotes && (
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">Health Notes</p>
              <p className="text-sm text-gray-700">{listing.healthNotes}</p>
            </div>
          )}

          {/* Contact */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 border border-purple-100">
            <p className="text-xs font-bold text-purple-500 uppercase tracking-wider mb-3">Listed by</p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-purple-100 flex-shrink-0 flex items-center justify-center">
                {listing.ownerAvatar?.startsWith("http") ? (
                  <img src={listing.ownerAvatar} alt={listing.ownerName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl">{listing.ownerAvatar || "🐾"}</span>
                )}
              </div>
              <div>
                <p className="font-bold text-gray-900">{listing.ownerName}</p>
                {listing.shelterOrg && <p className="text-sm text-purple-600 font-semibold">{listing.shelterOrg}</p>}
                {listing.ownerPhone && <p className="text-sm text-gray-500 flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{listing.ownerPhone}</p>}
              </div>
            </div>
          </div>

          {/* Applications count (for owner) */}
          {listing.applications.length > 0 && (
            <div className="bg-blue-50 rounded-xl p-3 border border-blue-100 flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-semibold text-blue-700">{listing.applications.length} application{listing.applications.length !== 1 ? "s" : ""} received</span>
            </div>
          )}

          {/* Apply section */}
          {listing.status === "available" && (
            <div>
              {success ? (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
                  <div className="text-4xl mb-2">🎉</div>
                  <p className="font-black text-green-800 text-lg">Application Submitted!</p>
                  <p className="text-sm text-green-600 mt-1">{listing.ownerName} will contact you soon.</p>
                </div>
              ) : already ? (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center gap-3">
                  <Check className="w-5 h-5 text-blue-500" />
                  <p className="font-semibold text-blue-700 text-sm">You've already applied for {listing.petName}!</p>
                </div>
              ) : showForm ? (
                <form onSubmit={handleSubmit} className="bg-purple-50 rounded-2xl p-5 border border-purple-100 space-y-4">
                  <h4 className="ad-display font-bold text-gray-900">
                    {listing.listingType === "sell" ? "Request to Buy" : "Apply to Adopt"}
                  </h4>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-gray-600 mb-1 block">Your Name *</label>
                      <input type="text" value={form.applicantName} onChange={e => setForm(f => ({ ...f, applicantName: e.target.value }))}
                        placeholder="Full name" className="ad-input" required />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-600 mb-1 block">Email *</label>
                      <input type="email" value={form.applicantEmail} onChange={e => setForm(f => ({ ...f, applicantEmail: e.target.value }))}
                        placeholder="you@example.com" className="ad-input" required />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600 mb-1 block">Phone</label>
                    <input type="tel" value={form.applicantPhone} onChange={e => setForm(f => ({ ...f, applicantPhone: e.target.value }))}
                      placeholder="+91 98765 43210" className="ad-input" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600 mb-1 block">Message (why you want this pet)</label>
                    <textarea rows={3} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                      placeholder="Tell the owner about yourself and your home…" className="ad-input resize-none" />
                  </div>
                  {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{error}</p>}
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setShowForm(false)}
                      className="flex-1 py-2.5 border-2 border-purple-200 rounded-xl text-purple-700 font-bold text-sm hover:bg-purple-50 transition-colors">Cancel</button>
                    <button type="submit" disabled={submitting}
                      className="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold rounded-xl text-sm disabled:opacity-50 flex items-center justify-center gap-2 transition-all hover:opacity-90">
                      {submitting ? <Loader2 className="w-4 h-4 ad-spin" /> : <Send className="w-4 h-4" />}
                      Submit
                    </button>
                  </div>
                </form>
              ) : (
                <button onClick={() => currentUser ? setShowForm(true) : alert("Please sign in to apply")}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-black text-base hover:opacity-90 transition-all shadow-lg shadow-purple-300/50 flex items-center justify-center gap-2">
                  {listing.listingType === "sell" ? <ShoppingBag className="w-5 h-5" /> : <Heart className="w-5 h-5 fill-current" />}
                  {listing.listingType === "sell" ? "Request to Buy" : "Apply to Adopt"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   LIST PET MODAL
═══════════════════════════════════════════════════════════════════════════ */
function ListPetModal({ onClose, onCreated, user }: { onClose: () => void; onCreated: (l: AdoptionListing) => void; user: any }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");

  const [form, setForm] = useState({
    petName: "", species: "dog", breed: "", age: "", ageUnit: "years", gender: "male",
    color: "", weight: "", photo: "", description: "", traits: [] as string[],
    vaccinated: false, neutered: false, microchipped: false, healthNotes: "",
    listingType: "adopt", price: "", adoptionFee: "",
    location: "", city: "", state: "",
    ownerName: user?.fullName || user?.firstName || "",
    ownerEmail: user?.emailAddresses?.[0]?.emailAddress || "",
    ownerPhone: "", shelterOrg: "",
  });

  const set = (k: string, v: any) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: "" })); };
  const toggleTrait = (t: string) => set("traits", form.traits.includes(t) ? form.traits.filter(x => x !== t) : [...form.traits, t]);

  const validate = (s: 1 | 2 | 3) => {
    const e: Record<string, string> = {};
    if (s === 1) {
      if (!form.petName.trim()) e.petName = "Required";
      if (!form.breed.trim())   e.breed   = "Required";
      if (!form.age || isNaN(Number(form.age))) e.age = "Required";
      if (!form.photo) e.photo = "Please upload a photo";
    }
    if (s === 2) {
      if (!form.description.trim()) e.description = "Required";
    }
    if (s === 3) {
      if (!form.location.trim()) e.location = "Required";
      if (!form.city.trim())     e.city     = "Required";
      if (!form.state)           e.state    = "Required";
      if (!form.ownerName.trim())e.ownerName = "Required";
    }
    return e;
  };

  const goNext = () => {
    const e = validate(step);
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    if (step < 3) setStep((step + 1) as any);
    else handleSubmit();
  };

  const handleSubmit = async () => {
    setSubmitting(true); setServerError("");
    try {
      const body = {
        ...form, age: parseFloat(form.age) || 0,
        price:       parseFloat(form.price) || 0,
        adoptionFee: parseFloat(form.adoptionFee) || 0,
        ownerClerkId: user?.id || "",
        ownerAvatar:  user?.imageUrl || "🐾",
      };
      const res = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      onCreated(data);
    } catch (err: any) {
      setServerError(err.message || "Something went wrong");
      setSubmitting(false);
    }
  };

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    try { set("photo", await uploadCloudinary(file)); }
    catch (err: any) { setErrors(p => ({ ...p, photo: err?.message || "Upload failed" })); }
    finally { setUploading(false); e.target.value = ""; }
  };

  const inpCls = (k: string) => cn("ad-input", errors[k] && "err");

  const stepTitles = ["Pet Details", "Description & Health", "Location & Contact"];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="ad-pop bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-purple-600 to-pink-500 px-6 py-5 rounded-t-3xl flex items-center justify-between">
          <div className="text-white">
            <p className="text-xs font-bold uppercase tracking-widest opacity-70">Step {step}/3</p>
            <h2 className="ad-display text-xl font-black">{stepTitles[step - 1]}</h2>
          </div>
          <button onClick={onClose} className="w-9 h-9 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center text-white"><X className="w-4 h-4" /></button>
        </div>

        {/* Progress */}
        <div className="h-1.5 bg-purple-100 flex-shrink-0">
          <div className="h-full bg-gradient-to-r from-purple-600 to-pink-500 transition-all duration-500" style={{ width: `${(step / 3) * 100}%` }} />
        </div>

        <div className="flex-1 overflow-y-auto ad-scroll p-6 space-y-4">
          {/* STEP 1 */}
          {step === 1 && (
            <>
              {/* Listing type */}
              <div>
                <label className="text-sm font-bold text-gray-700 mb-2 block">Listing Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {[{ v: "adopt", label: "For Adoption", icon: <Home className="w-4 h-4" />, desc: "Find a loving home" },
                    { v: "sell",  label: "For Sale",     icon: <ShoppingBag className="w-4 h-4" />, desc: "Sell your pet" }].map(o => (
                    <button key={o.v} type="button" onClick={() => set("listingType", o.v)}
                      className={cn("flex flex-col items-center gap-1.5 p-4 rounded-2xl border-2 transition-all",
                        form.listingType === o.v ? "border-purple-500 bg-purple-50" : "border-gray-200 hover:border-purple-300"
                      )}>
                      <span className={form.listingType === o.v ? "text-purple-600" : "text-gray-400"}>{o.icon}</span>
                      <span className={cn("font-bold text-sm", form.listingType === o.v ? "text-purple-700" : "text-gray-600")}>{o.label}</span>
                      <span className="text-[11px] text-gray-400">{o.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1 block">Pet Name *</label>
                  <input type="text" value={form.petName} onChange={e => set("petName", e.target.value)} placeholder="e.g. Bruno" className={inpCls("petName")} />
                  {errors.petName && <p className="text-xs text-red-500 mt-1">{errors.petName}</p>}
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1 block">Species</label>
                  <div className="relative">
                    <select value={form.species} onChange={e => set("species", e.target.value)} className="ad-input ad-select">
                      {Object.entries(SPECIES_META).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1 block">Breed *</label>
                  <input type="text" value={form.breed} onChange={e => set("breed", e.target.value)} placeholder="e.g. Labrador" className={inpCls("breed")} />
                  {errors.breed && <p className="text-xs text-red-500 mt-1">{errors.breed}</p>}
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1 block">Gender</label>
                  <div className="relative">
                    <select value={form.gender} onChange={e => set("gender", e.target.value)} className="ad-input ad-select">
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1 block">Age *</label>
                  <input type="number" min="0" value={form.age} onChange={e => set("age", e.target.value)} placeholder="e.g. 2" className={inpCls("age")} />
                  {errors.age && <p className="text-xs text-red-500 mt-1">{errors.age}</p>}
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1 block">Age Unit</label>
                  <div className="relative">
                    <select value={form.ageUnit} onChange={e => set("ageUnit", e.target.value)} className="ad-input ad-select">
                      <option value="months">Months</option>
                      <option value="years">Years</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1 block">Color</label>
                  <input type="text" value={form.color} onChange={e => set("color", e.target.value)} placeholder="e.g. Golden" className="ad-input" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1 block">Weight</label>
                  <input type="text" value={form.weight} onChange={e => set("weight", e.target.value)} placeholder="e.g. 12 kg" className="ad-input" />
                </div>
              </div>

              {/* Price */}
              <div className="grid grid-cols-2 gap-3">
                {form.listingType === "sell" ? (
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-gray-600 mb-1 block">Sale Price (₹) — enter 0 for free</label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3.5 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input type="number" min="0" value={form.price} onChange={e => set("price", e.target.value)} placeholder="e.g. 15000" className="ad-input pl-10" />
                    </div>
                  </div>
                ) : (
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-gray-600 mb-1 block">Adoption Fee (₹) — enter 0 for free</label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3.5 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input type="number" min="0" value={form.adoptionFee} onChange={e => set("adoptionFee", e.target.value)} placeholder="e.g. 2000" className="ad-input pl-10" />
                    </div>
                  </div>
                )}
              </div>

              {/* Photo */}
              <div>
                <label className="text-xs font-bold text-gray-600 mb-2 block">Photo *</label>
                <label className={cn("ad-input flex items-center gap-3 cursor-pointer hover:border-purple-400 transition-colors", uploading && "opacity-60 cursor-wait")}>
                  <Camera className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-500 truncate">
                    {uploading ? "Uploading…" : form.photo ? "✓ Photo uploaded" : "Upload a clear photo"}
                  </span>
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} disabled={uploading} />
                </label>
                {form.photo && <img src={form.photo} alt="Preview" className="mt-2 h-24 w-24 rounded-xl object-cover border border-purple-200" />}
                {errors.photo && <p className="text-xs text-red-500 mt-1">{errors.photo}</p>}
              </div>
            </>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">Description *</label>
                <textarea rows={4} value={form.description} onChange={e => set("description", e.target.value)}
                  placeholder={`Tell potential adopters about ${form.petName || "your pet"}'s personality, habits, and needs…`}
                  className={cn(inpCls("description"), "resize-none")} />
                {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 mb-2 block">Personality Traits</label>
                <div className="flex flex-wrap gap-2">
                  {TRAITS_OPTIONS.map(t => (
                    <button key={t} type="button" onClick={() => toggleTrait(t)} className={cn("ad-pill", form.traits.includes(t) && "active")}>{t}</button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { key: "vaccinated",   label: "💉 Vaccinated"   },
                  { key: "neutered",     label: "✂️ Neutered/Spayed" },
                  { key: "microchipped", label: "📡 Microchipped"  },
                ].map(({ key, label }) => (
                  <button key={key} type="button" onClick={() => set(key, !(form as any)[key])}
                    className={cn("flex items-center gap-2 p-3 rounded-xl border-2 text-left text-xs font-bold transition-all",
                      (form as any)[key] ? "border-green-500 bg-green-50 text-green-700" : "border-gray-200 text-gray-500 hover:border-purple-300 bg-gray-50"
                    )}>
                    <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                      (form as any)[key] ? "bg-green-500 border-green-500" : "border-gray-300"
                    )}>
                      {(form as any)[key] && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                    {label}
                  </button>
                ))}
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">Health Notes</label>
                <textarea rows={2} value={form.healthNotes} onChange={e => set("healthNotes", e.target.value)}
                  placeholder="Any medical history, dietary needs, allergies…" className="ad-input resize-none" />
              </div>
            </>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">Full Address / Area *</label>
                <input type="text" value={form.location} onChange={e => set("location", e.target.value)} placeholder="e.g. Koregaon Park, Pune" className={inpCls("location")} />
                {errors.location && <p className="text-xs text-red-500 mt-1">{errors.location}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1 block">City *</label>
                  <input type="text" value={form.city} onChange={e => set("city", e.target.value)} placeholder="e.g. Pune" className={inpCls("city")} />
                  {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1 block">State *</label>
                  <div className="relative">
                    <select value={form.state} onChange={e => set("state", e.target.value)} className={cn(inpCls("state"), "ad-select")}>
                      <option value="">Select state</option>
                      {INDIAN_STATES.map(s => <option key={s}>{s}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                  {errors.state && <p className="text-xs text-red-500 mt-1">{errors.state}</p>}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">Your Name *</label>
                <input type="text" value={form.ownerName} onChange={e => set("ownerName", e.target.value)} placeholder="Full name" className={inpCls("ownerName")} />
                {errors.ownerName && <p className="text-xs text-red-500 mt-1">{errors.ownerName}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1 block">Phone</label>
                  <input type="tel" value={form.ownerPhone} onChange={e => set("ownerPhone", e.target.value)} placeholder="+91 98765 43210" className="ad-input" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1 block">Email</label>
                  <input type="email" value={form.ownerEmail} onChange={e => set("ownerEmail", e.target.value)} placeholder="you@example.com" className="ad-input" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">Shelter / Organization (if applicable)</label>
                <input type="text" value={form.shelterOrg} onChange={e => set("shelterOrg", e.target.value)} placeholder="e.g. SPCA Mumbai" className="ad-input" />
              </div>
              {serverError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />{serverError}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-purple-100 flex gap-3 bg-white">
          <button type="button" onClick={() => step === 1 ? onClose() : setStep((step - 1) as any)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-purple-200 text-purple-700 font-bold text-sm hover:bg-purple-50 transition-all">
            <ChevronLeft className="w-4 h-4" />{step === 1 ? "Cancel" : "Back"}
          </button>
          <button type="button" onClick={goNext} disabled={submitting || uploading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold text-sm hover:opacity-90 transition-all shadow-md shadow-purple-200 disabled:opacity-60">
            {submitting ? <><Loader2 className="w-4 h-4 ad-spin" />Listing…</> : step < 3 ? <>Continue <ChevronRight className="w-4 h-4" /></> : <>🐾 Publish Listing</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════════════ */
export default function Adoption() {
  const { user } = useUser();

  const [listings,    setListings]    = useState<AdoptionListing[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [favorites,   setFavorites]   = useState<Set<string>>(new Set());
  const [selected,    setSelected]    = useState<AdoptionListing | null>(null);
  const [showCreate,  setShowCreate]  = useState(false);
  const [showMyListings, setShowMyListings] = useState(false);

  const [search,      setSearch]      = useState("");
  const [species,     setSpecies]     = useState("all");
  const [listingType, setListingType] = useState("all");
  const [gender,      setGender]      = useState("all");
  const [sortBy,      setSortBy]      = useState("newest");

  /* ── Fetch ── */
  const fetchListings = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams({ sortBy });
      if (species !== "all")     params.set("species",     species);
      if (listingType !== "all") params.set("listingType", listingType);
      if (gender !== "all")      params.set("gender",      gender);
      if (search.trim())         params.set("search",      search.trim());

      const res = await fetch(`${API}?${params}`);
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Server error ${res.status}`);
      }
      setListings(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [species, listingType, gender, sortBy, search]);

  const fetchMyListings = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}?ownerClerkId=${user.id}`);
      if (!res.ok) throw new Error("Failed");
      setListings(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (showMyListings) fetchMyListings();
    else fetchListings();
  }, [showMyListings, fetchListings, fetchMyListings]);

  /* ── Actions ── */
  const toggleFav = (id: string) =>
    setFavorites(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const handleApply = async (listingId: string, data: any): Promise<boolean> => {
    try {
      const res = await fetch(`${API}/${listingId}/apply`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Application failed");
      // Refresh the selected listing so applications count updates
      const updatedRes = await fetch(`${API}/${listingId}`);
      if (updatedRes.ok) {
        const updated = await updatedRes.json();
        setListings(prev => prev.map(l => l.id === listingId ? updated : l));
        setSelected(updated);
      }
      return true;
    } catch (e: any) {
      console.error("[adoption] apply error:", e.message);
      return false;
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this listing? This cannot be undone.")) return;
    // Optimistic remove
    setListings(prev => prev.filter(l => l.id !== id));
    if (selected?.id === id) setSelected(null);
    try {
      const res = await fetch(`${API}/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerClerkId: user?.id }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        alert("Delete failed: " + (d.error || res.statusText));
        // Restore by re-fetching
        showMyListings ? fetchMyListings() : fetchListings();
      }
    } catch (e: any) {
      alert("Delete failed: " + e.message);
      showMyListings ? fetchMyListings() : fetchListings();
    }
  };

  const handleMarkStatus = async (id: string, status: string) => {
    try {
      await fetch(`${API}/${id}/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, ownerClerkId: user?.id }) });
      setListings(prev => prev.map(l => l.id === id ? { ...l, status: status as any } : l));
    } catch {}
  };

  const handleCreated = (listing: AdoptionListing) => {
    setListings(prev => [listing, ...prev]);
    setShowCreate(false);
  };

  /* ── Stats ── */
  const adopt = listings.filter(l => l.listingType === "adopt" && l.status === "available").length;
  const forSale = listings.filter(l => l.listingType === "sell" && l.status === "available").length;

  return (
    <>
      <style>{STYLES}</style>
      <div className="ad-root min-h-screen" style={{ background: "linear-gradient(160deg, #f5f3ff 0%, #fdf4ff 40%, #fff0fb 100%)" }}>
        <Header />

        {/* Modals */}
        {selected  && <DetailModal listing={selected} onClose={() => setSelected(null)} currentUser={user} onApply={handleApply} />}
        {showCreate && user && <ListPetModal onClose={() => setShowCreate(false)} onCreated={handleCreated} user={user} />}

        {/* ── HERO ── */}
        <section className="relative overflow-hidden bg-gradient-to-br from-rose-600 via-orange-500 to-amber-400 py-8 sm:py-10">
          <div className="absolute inset-0 opacity-[.05]" style={{backgroundImage:"radial-gradient(circle,white 1px,transparent 1px)",backgroundSize:"20px 20px"}}/>
          <div className="absolute -top-20 right-0 w-72 h-72 rounded-full bg-yellow-200/20 blur-3xl pointer-events-none"/>
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-rose-800/30 blur-3xl pointer-events-none"/>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              {/* Left */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center flex-shrink-0 shadow-lg text-2xl">🐾</div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-yellow-200">India's Largest</span>
                    <span className="w-1 h-1 rounded-full bg-white/40"/>
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Pet Platform</span>
                  </div>
                  <h1 className="ad-display text-3xl sm:text-4xl font-black text-white leading-none">Adoption &amp; Rehoming</h1>
                  <p className="text-white/65 text-xs mt-1">Adopt, rescue, or find a new home for your pet</p>
                </div>
              </div>
              {/* Right */}
              <div className="flex flex-col gap-2.5 sm:items-end">
                <div className="flex items-center gap-2 text-xs text-white/70 flex-wrap">
                  {[{v:`${adopt}`,l:"For Adoption"},{v:`${forSale}`,l:"For Sale"},{v:"₹ INR",l:"All Prices"}].map(({v,l})=>(
                    <div key={l} className="bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-lg text-center">
                      <p className="font-black text-white text-sm">{v}</p>
                      <p className="text-white/60 text-[10px] uppercase tracking-wide">{l}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button onClick={() => user ? setShowCreate(true) : alert("Please sign in")}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-rose-600 font-black text-sm hover:bg-rose-50 transition-all shadow-md">
                    <Plus className="w-4 h-4" /> List Pet
                  </button>
                  {user && (
                    <button onClick={() => setShowMyListings(!showMyListings)}
                      className={cn("flex items-center gap-1.5 px-4 py-2 rounded-xl font-black text-sm transition-all border-2",
                        showMyListings?"bg-white text-rose-600 border-white":"bg-white/15 text-white border-white/25 hover:bg-white/25 backdrop-blur-sm")}>
                      <Edit3 className="w-4 h-4" /> My Listings
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 24" preserveAspectRatio="none"><path d="M0,24 C480,4 960,4 1440,24 L1440,24 L0,24 Z" fill="rgba(245,243,255,0.4)"/></svg>
        </section>

        {/* ── CONTENT ── */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid lg:grid-cols-[280px,1fr] gap-8 items-start">

            {/* ── SIDEBAR ── */}
            <aside className="lg:sticky lg:top-24 space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                <input type="text" placeholder="Search pets…" value={search} onChange={e => setSearch(e.target.value)}
                  className="ad-input pl-11 pr-4 py-3 shadow-sm" />
                {search && <button onClick={() => setSearch("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>}
              </div>

              <div className="glass-card rounded-3xl border border-purple-100 overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-purple-100">
                  <h3 className="font-black text-gray-900 flex items-center gap-2">
                    <Filter className="w-4 h-4 text-purple-500" /> Filters
                  </h3>
                </div>
                <div className="p-5 space-y-5">
                  {/* Listing type */}
                  <div>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">Type</p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[{ v:"all",label:"All"},{ v:"adopt",label:"Adopt"},{ v:"sell",label:"Buy"}].map(o=>(
                        <button key={o.v} onClick={() => setListingType(o.v)}
                          className={cn("py-2 text-xs font-bold rounded-xl border-2 transition-all",
                            listingType===o.v?"bg-purple-600 border-purple-600 text-white":"border-purple-200 text-gray-500 hover:border-purple-400 bg-white"
                          )}>{o.label}</button>
                      ))}
                    </div>
                  </div>

                  {/* Species */}
                  <div>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">Species</p>
                    <div className="space-y-1">
                      {[{ v:"all", emoji:"🐾", label:"All Pets" }, ...Object.entries(SPECIES_META).map(([v,m])=>({ v, emoji:m.emoji, label:m.label }))].map(o=>(
                        <button key={o.v} onClick={() => setSpecies(o.v)}
                          className={cn("w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all",
                            species===o.v?"bg-purple-600 text-white":"text-gray-600 hover:bg-purple-50 hover:text-purple-700"
                          )}><span>{o.emoji}</span>{o.label}</button>
                      ))}
                    </div>
                  </div>

                  {/* Gender */}
                  <div>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">Gender</p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[{ v:"all",label:"Any"},{ v:"male",label:"Male"},{ v:"female",label:"Female"}].map(o=>(
                        <button key={o.v} onClick={() => setGender(o.v)}
                          className={cn("py-2 text-xs font-bold rounded-xl border-2 transition-all",
                            gender===o.v?"bg-purple-600 border-purple-600 text-white":"border-purple-200 text-gray-500 hover:border-purple-400 bg-white"
                          )}>{o.label}</button>
                      ))}
                    </div>
                  </div>

                  {/* Sort */}
                  <div>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">Sort By</p>
                    <div className="relative">
                      <ArrowUpDown className="absolute left-3.5 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                      <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="ad-input ad-select pl-10">
                        <option value="newest">Newest First</option>
                        <option value="price-asc">Price: Low to High</option>
                        <option value="price-desc">Price: High to Low</option>
                      </select>
                      <ChevronDown className="absolute right-3.5 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  <button onClick={() => { setSpecies("all"); setListingType("all"); setGender("all"); setSearch(""); setSortBy("newest"); }}
                    className="w-full text-xs font-bold text-gray-400 hover:text-purple-600 transition-colors py-1.5">
                    Reset filters
                  </button>
                </div>
              </div>

              {/* Favorites count */}
              {favorites.size > 0 && (
                <div className="glass-card rounded-2xl p-4 border border-pink-200 text-center">
                  <p className="ad-display text-3xl font-black text-pink-600">{favorites.size}</p>
                  <p className="text-sm text-gray-500 font-semibold">pet{favorites.size !== 1 ? "s" : ""} favorited</p>
                </div>
              )}
            </aside>

            {/* ── MAIN ── */}
            <div>
              {/* Top bar */}
              <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <p className="text-sm text-gray-500">
                  {loading
                    ? <span className="flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 ad-spin" /> Loading…</span>
                    : <><span className="font-black text-gray-900 text-base">{listings.length}</span> pets found</>
                  }
                </p>
                <div className="flex gap-2">
                  <button onClick={showMyListings ? fetchMyListings : fetchListings}
                    className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-purple-600 font-semibold transition-colors">
                    <RefreshCw className="w-3.5 h-3.5" /> Refresh
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && !loading && (
                <div className="glass-card border border-red-200 rounded-2xl p-6 flex items-start gap-4 mb-6">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-red-700">{error}</p>
                    <button onClick={fetchListings} className="text-sm font-bold text-red-500 mt-2 flex items-center gap-1 hover:text-red-700">
                      <RefreshCw className="w-3.5 h-3.5" /> Retry
                    </button>
                  </div>
                </div>
              )}

              {/* Loading skeleton */}
              {loading && (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {[1,2,3,4,5,6].map(i => (
                    <div key={i} className="bg-white rounded-3xl overflow-hidden border border-purple-100 shadow-sm animate-pulse">
                      <div className="h-52 bg-purple-100" />
                      <div className="p-5 space-y-3">
                        <div className="h-5 bg-purple-100 rounded-full w-3/4" />
                        <div className="h-3 bg-purple-50 rounded-full w-1/2" />
                        <div className="h-3 bg-purple-50 rounded-full w-2/3" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Empty */}
              {!loading && !error && listings.length === 0 && (
                <div className="glass-card rounded-3xl p-16 text-center border border-purple-100 shadow-sm">
                  <div className="text-7xl mb-5 ad-float">🐾</div>
                  <h3 className="ad-display text-2xl font-black text-gray-900 mb-2">
                    {showMyListings ? "You haven't listed any pets yet" : "No pets found"}
                  </h3>
                  <p className="text-gray-500 mb-6 text-sm">
                    {showMyListings ? "List your first pet for adoption or sale!" : "Try adjusting your filters or be the first to post!"}
                  </p>
                  <button onClick={() => user ? setShowCreate(true) : alert("Please sign in")}
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-black hover:opacity-90 transition-all shadow-lg shadow-purple-200">
                    <Plus className="w-5 h-5" /> List a Pet
                  </button>
                </div>
              )}

              {/* Grid */}
              {!loading && !error && listings.length > 0 && (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {listings.map((listing, i) => (
                    <div key={listing.id} className="ad-up" style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}>
                      <PetCard
                        listing={listing}
                        favorites={favorites}
                        onFavorite={toggleFav}
                        onClick={setSelected}
                        isOwn={!!user && listing.ownerClerkId === user.id}
                        onDelete={handleDelete}
                        onMarkStatus={handleMarkStatus}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
