import { useState, useEffect, useCallback, useRef } from "react";
import { useUser } from "@clerk/clerk-react";
import Header from "@/components/Header";
import { cn } from "@/lib/utils";
import {
  MapPin, Star, Check, Heart, Search, Filter, X, Plus,
  Home, Shield, Camera, Phone, Clock, ChevronDown, Loader2,
  AlertCircle, RefreshCw, IndianRupee, Leaf, Wifi, Send,
  PawPrint, Users, Award, ChevronRight, MessageSquare, Eye,
  ThumbsUp, Sparkles, Calendar, Dog, Cat,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════════════════════ */
interface Review {
  id: string;
  reviewerName: string;
  reviewerAvatar: string;
  reviewerClerkId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface HostListing {
  id: string;
  hostName: string;
  hostAvatar: string;
  hostClerkId: string;
  hostBio: string;
  hostPhone: string;
  hostEmail: string;
  hostPhoto: string;
  city: string;
  state: string;
  area: string;
  pincode: string;
  petTypes: string[];
  maxPets: number;
  petSizeLimit: string;
  acceptedBreeds: string;
  pricePerDay: number;
  pricePerMonth: number;
  services: string[];
  available: boolean;
  availableFrom: string;
  availableTo: string;
  workingHours: string;
  homeType: string;
  hasGarden: boolean;
  hasCctv: boolean;
  petFriendlySpace: string;
  yearsExperience: number;
  languages: string[];
  emergencyContact: string;
  ownPets: string;
  certifications: string[];
  rating: number;
  totalReviews: number;
  reviews: Review[];
  verified: boolean;
  featured: boolean;
  status: string;
  createdAt: string;
}

/* ═══════════════════════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════════════════════ */
const API = "/api/hosting";

const INDIAN_CITIES = [
  "Mumbai","Delhi","Bengaluru","Hyderabad","Chennai","Kolkata","Pune","Ahmedabad",
  "Jaipur","Lucknow","Surat","Kanpur","Nagpur","Indore","Thane","Bhopal",
  "Visakhapatnam","Pimpri-Chinchwad","Patna","Vadodara","Ghaziabad","Ludhiana",
  "Agra","Nashik","Faridabad","Meerut","Rajkot","Kalyan-Dombivli","Vasai-Virar",
  "Aurangabad","Dhanbad","Amritsar","Allahabad","Ranchi","Howrah","Coimbatore",
  "Jabalpur","Gwalior","Vijayawada","Jodhpur","Madurai","Raipur","Kota",
  "Chandigarh","Gurgaon","Noida","Kochi","Bhubaneswar","Mysuru",
];

const INDIAN_STATES = [
  "Maharashtra","Delhi","Karnataka","Telangana","Tamil Nadu","West Bengal",
  "Gujarat","Rajasthan","Uttar Pradesh","Madhya Pradesh","Andhra Pradesh",
  "Bihar","Punjab","Haryana","Kerala","Odisha","Jharkhand","Assam",
  "Chhattisgarh","Uttarakhand","Goa","Himachal Pradesh","Chandigarh",
];

const PET_TYPE_META: Record<string, { emoji: string; label: string; color: string }> = {
  dog:    { emoji: "🐕", label: "Dog",    color: "bg-orange-100 text-orange-700" },
  cat:    { emoji: "🐱", label: "Cat",    color: "bg-amber-100 text-amber-700" },
  bird:   { emoji: "🐦", label: "Bird",   color: "bg-green-100 text-green-700" },
  rabbit: { emoji: "🐇", label: "Rabbit", color: "bg-pink-100 text-pink-700" },
  fish:   { emoji: "🐠", label: "Fish",   color: "bg-blue-100 text-blue-700" },
  hamster:{ emoji: "🐹", label: "Hamster",color: "bg-yellow-100 text-yellow-700" },
  reptile:{ emoji: "🦎", label: "Reptile",color: "bg-teal-100 text-teal-700" },
  other:  { emoji: "🐾", label: "Other",  color: "bg-gray-100 text-gray-700" },
};

const SERVICE_META: Record<string, { emoji: string; label: string }> = {
  feeding:     { emoji: "🍽️", label: "Feeding" },
  walking:     { emoji: "🚶", label: "Daily Walk" },
  grooming:    { emoji: "✂️", label: "Grooming" },
  training:    { emoji: "🎾", label: "Training" },
  "vet-visits":{ emoji: "🩺", label: "Vet Visits" },
  "24h-care":  { emoji: "🌙", label: "24hr Care" },
  playtime:    { emoji: "🎮", label: "Playtime" },
  bathing:     { emoji: "🛁", label: "Bathing" },
  medication:  { emoji: "💊", label: "Medication" },
  cuddles:     { emoji: "🤗", label: "Cuddles" },
};

const HOME_TYPE_META: Record<string, { emoji: string; label: string }> = {
  flat:     { emoji: "🏢", label: "Apartment/Flat" },
  bungalow: { emoji: "🏡", label: "Bungalow" },
  villa:    { emoji: "🏰", label: "Villa" },
  farm:     { emoji: "🌾", label: "Farm House" },
  independent: { emoji: "🏠", label: "Independent House" },
};

const INR = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const CLOUDINARY_CLOUD_NAME    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME    || "";
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "";

/* ═══════════════════════════════════════════════════════════════════════════
   STYLES
═══════════════════════════════════════════════════════════════════════════ */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;500;600;700;800&family=Karla:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');

.ht-root    { font-family: 'Karla', sans-serif; }
.ht-display { font-family: 'Baloo 2', cursive; }

@keyframes ht-up    { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }
@keyframes ht-pop   { 0%{transform:scale(.9);opacity:0} 65%{transform:scale(1.04)} 100%{transform:scale(1);opacity:1} }
@keyframes ht-slide { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:none} }
@keyframes ht-paw   { 0%,100%{transform:rotate(-8deg) scale(1)} 50%{transform:rotate(8deg) scale(1.08)} }
@keyframes ht-star  { 0%{transform:scale(0) rotate(-30deg)} 60%{transform:scale(1.2) rotate(5deg)} 100%{transform:scale(1) rotate(0deg)} }
@keyframes ht-badge { 0%{transform:scale(0)} 65%{transform:scale(1.25)} 100%{transform:scale(1)} }
@keyframes ht-shimmer { 0%{background-position:200%center} 100%{background-position:-200%center} }
@keyframes ht-pulse { 0%,100%{opacity:1} 50%{opacity:.55} }
@keyframes ht-spin  { to{transform:rotate(360deg)} }

.ht-up     { animation: ht-up   .4s cubic-bezier(.34,1.56,.64,1) both; }
.ht-pop    { animation: ht-pop  .3s cubic-bezier(.34,1.56,.64,1) both; }
.ht-slide  { animation: ht-slide .35s cubic-bezier(.34,1.56,.64,1) both; }
.ht-star   { animation: ht-star .25s cubic-bezier(.34,1.56,.64,1) both; }
.ht-badge  { animation: ht-badge .22s cubic-bezier(.34,1.56,.64,1) both; }
.ht-paw    { animation: ht-paw 3s ease-in-out infinite; }
.ht-pulse  { animation: ht-pulse 1.8s ease-in-out infinite; }
.ht-spin   { animation: ht-spin .7s linear infinite; }

.ht-shimmer-text {
  background: linear-gradient(90deg,#c2410c,#f97316,#fbbf24,#f97316,#c2410c);
  background-size:200% auto;
  -webkit-background-clip:text; -webkit-text-fill-color:transparent;
  background-clip:text;
  animation: ht-shimmer 3s linear infinite;
}

.ht-card {
  transition: transform .22s cubic-bezier(.34,1.56,.64,1), box-shadow .22s ease;
  cursor:pointer;
}
.ht-card:hover {
  transform: translateY(-5px) scale(1.01);
  box-shadow: 0 20px 50px -12px rgba(0,0,0,.18);
}

.ht-input {
  width:100%; padding:11px 16px; font-family:'Karla',sans-serif; font-size:14px;
  background:#fafaf8; border:2px solid #e8e4dc; border-radius:12px; color:#1a1a1a;
  transition:border-color .2s, box-shadow .2s; outline:none;
}
.ht-input:focus  { border-color:#f97316; box-shadow:0 0 0 4px rgba(249,115,22,.12); background:#fff; }
.ht-input.error  { border-color:#ef4444; background:#fef2f2; }
.ht-input::placeholder { color:#b0a99a; }
.ht-select { appearance:none; cursor:pointer; }

.ht-pill {
  display:inline-flex; align-items:center; gap:5px; padding:5px 12px;
  border-radius:100px; border:2px solid #e8e4dc; font-size:12px; font-weight:700;
  cursor:pointer; transition:all .18s; background:#fafaf8; color:#888;
  font-family:'Karla',sans-serif;
}
.ht-pill:hover  { border-color:#f97316; color:#c2410c; background:#fff7ed; }
.ht-pill.active { background:#f97316; border-color:#f97316; color:#fff; }

.ht-star-btn { transition: transform .15s cubic-bezier(.34,1.56,.64,1); cursor:pointer; }
.ht-star-btn:hover { transform:scale(1.2); }

.ht-scroll::-webkit-scrollbar { width:3px; }
.ht-scroll::-webkit-scrollbar-thumb { background:#fed7aa; border-radius:999px; }

.ht-dot-bg {
  background-image: radial-gradient(circle, #d4d4d4 1px, transparent 1px);
  background-size: 28px 28px;
  opacity: 0.35;
}

.ht-card-shine::before {
  content:''; position:absolute; inset:0; border-radius:inherit;
  background:linear-gradient(135deg,rgba(255,255,255,.2) 0%,transparent 60%);
  opacity:0; transition:opacity .2s; pointer-events:none;
}
.ht-card-shine:hover::before { opacity:1; }
`;

/* ═══════════════════════════════════════════════════════════════════════════
   STAR RATING COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
function StarRating({
  rating,
  interactive = false,
  size = "md",
  onRate,
}: {
  rating: number;
  interactive?: boolean;
  size?: "sm" | "md" | "lg";
  onRate?: (n: number) => void;
}) {
  const [hover, setHover] = useState(0);
  const sizes = { sm: "w-3.5 h-3.5", md: "w-5 h-5", lg: "w-7 h-7" };
  const active = hover || rating;

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          disabled={!interactive}
          onClick={() => onRate?.(i)}
          onMouseEnter={() => interactive && setHover(i)}
          onMouseLeave={() => interactive && setHover(0)}
          className={cn(sizes[size], interactive && "ht-star-btn")}
          style={{ background: "none", border: "none", padding: 0 }}
        >
          <Star
            className={cn(
              sizes[size],
              "transition-all duration-150",
              i <= active
                ? "fill-amber-400 text-amber-400"
                : "fill-gray-200 text-gray-200"
            )}
          />
        </button>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   HOST CARD
═══════════════════════════════════════════════════════════════════════════ */
function HostCard({
  listing,
  isFavorite,
  onFavorite,
  onClick,
}: {
  listing: HostListing;
  isFavorite: boolean;
  onFavorite: () => void;
  onClick: () => void;
}) {
  const [imgErr, setImgErr] = useState(false);

  return (
    <div
      className="ht-card ht-card-shine relative bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm"
      onClick={onClick}
    >
      {/* Photo / Gradient banner */}
      <div className="relative h-44 overflow-hidden">
        {listing.hostPhoto && !imgErr ? (
          <img
            src={listing.hostPhoto}
            alt={listing.hostName}
            className="w-full h-full object-cover"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-orange-400 via-amber-400 to-yellow-300 flex items-center justify-center">
            <span className="text-7xl ht-paw">{listing.hostAvatar || "🏠"}</span>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {listing.featured && (
            <span className="bg-amber-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow">
              <Sparkles className="w-3 h-3" /> Featured
            </span>
          )}
          {listing.verified && (
            <span className="bg-green-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow">
              <Shield className="w-3 h-3" /> Verified
            </span>
          )}
        </div>

        {/* Availability dot */}
        <div className="absolute top-3 right-12">
          <div className={cn(
            "w-3 h-3 rounded-full border-2 border-white shadow",
            listing.available ? "bg-green-400" : "bg-gray-400"
          )} />
        </div>

        {/* Favorite */}
        <button
          onClick={e => { e.stopPropagation(); onFavorite(); }}
          className={cn(
            "absolute top-3 right-3 w-8 h-8 rounded-xl flex items-center justify-center shadow transition-all",
            isFavorite ? "bg-red-500 text-white" : "bg-white/90 text-gray-400 hover:text-red-400"
          )}
        >
          <Heart className="w-4 h-4 fill-current" />
        </button>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="ht-display text-lg font-bold text-gray-900 leading-tight truncate">{listing.hostName}</h3>
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
              {listing.area ? `${listing.area}, ` : ""}{listing.city}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="ht-display text-xl font-bold text-orange-600">{INR(listing.pricePerDay)}</p>
            <p className="text-[10px] text-gray-400 font-semibold">per day</p>
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-3">
          <StarRating rating={listing.rating} size="sm" />
          <span className="text-sm font-bold text-gray-800">{listing.rating > 0 ? listing.rating.toFixed(1) : "New"}</span>
          {listing.totalReviews > 0 && (
            <span className="text-xs text-gray-400">({listing.totalReviews} reviews)</span>
          )}
        </div>

        {/* Pet types */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {listing.petTypes.slice(0, 4).map(pt => {
            const m = PET_TYPE_META[pt] || PET_TYPE_META.other;
            return (
              <span key={pt} className={cn("text-xs font-bold px-2 py-0.5 rounded-full", m.color)}>
                {m.emoji} {m.label}
              </span>
            );
          })}
          {listing.petTypes.length > 4 && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
              +{listing.petTypes.length - 4}
            </span>
          )}
        </div>

        {/* Services preview */}
        <div className="flex flex-wrap gap-1 mb-3">
          {listing.services.slice(0, 3).map(s => {
            const m = SERVICE_META[s];
            return m ? (
              <span key={s} className="text-[11px] font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-lg flex items-center gap-1">
                {m.emoji} {m.label}
              </span>
            ) : null;
          })}
          {listing.services.length > 3 && (
            <span className="text-[11px] font-semibold text-gray-500 bg-gray-50 px-2 py-0.5 rounded-lg">
              +{listing.services.length - 3} more
            </span>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-gray-400 mt-2">
          <span className="flex items-center gap-1">
            <Home className="w-3.5 h-3.5" />
            {HOME_TYPE_META[listing.homeType]?.label || listing.homeType}
          </span>
          <span className="flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            {listing.yearsExperience}+ yrs exp
          </span>
          <span className={cn("flex items-center gap-1 font-semibold", listing.available ? "text-green-600" : "text-gray-400")}>
            <div className={cn("w-2 h-2 rounded-full", listing.available ? "bg-green-500" : "bg-gray-400")} />
            {listing.available ? "Available" : "Busy"}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   DETAIL MODAL
═══════════════════════════════════════════════════════════════════════════ */
function HostDetailModal({
  listing,
  onClose,
  currentUser,
  onReviewAdded,
}: {
  listing: HostListing;
  onClose: () => void;
  currentUser: any;
  onReviewAdded: (updated: HostListing) => void;
}) {
  const [activeTab, setActiveTab]     = useState<"about" | "reviews">("about");
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText,   setReviewText]  = useState("");
  const [submitting,   setSubmitting]  = useState(false);
  const [reviewError,  setReviewError] = useState("");
  const [imgErr,       setImgErr]      = useState(false);

  const alreadyReviewed = currentUser && listing.reviews.some(
    r => r.reviewerClerkId === currentUser.id
  );

  const handleReview = async () => {
    if (!reviewRating) { setReviewError("Please select a star rating"); return; }
    if (!reviewText.trim()) { setReviewError("Please write a review comment"); return; }
    setSubmitting(true);
    setReviewError("");
    try {
      const res = await fetch(`${API}/${listing.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewerName:    currentUser?.fullName || currentUser?.firstName || "Anonymous",
          reviewerAvatar:  currentUser?.imageUrl || "🐾",
          reviewerClerkId: currentUser?.id || "",
          rating:          reviewRating,
          comment:         reviewText.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      onReviewAdded(data);
      setReviewRating(0);
      setReviewText("");
      setActiveTab("reviews");
    } catch (err: any) {
      setReviewError(err.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="ht-pop bg-white w-full sm:max-w-2xl sm:rounded-3xl rounded-t-3xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="relative flex-shrink-0">
          {listing.hostPhoto && !imgErr ? (
            <div className="h-52 relative overflow-hidden sm:rounded-t-3xl rounded-t-3xl">
              <img src={listing.hostPhoto} alt={listing.hostName} className="w-full h-full object-cover" onError={() => setImgErr(true)} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-5 right-12 text-white">
                <h2 className="ht-display text-2xl font-bold">{listing.hostName}</h2>
                <p className="text-white/80 text-sm flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5" />
                  {listing.area ? `${listing.area}, ` : ""}{listing.city}, {listing.state}
                </p>
              </div>
            </div>
          ) : (
            <div className="h-36 bg-gradient-to-r from-orange-500 to-amber-400 relative sm:rounded-t-3xl rounded-t-3xl flex items-center px-6">
              <div>
                <h2 className="ht-display text-2xl font-bold text-white">{listing.hostName}</h2>
                <p className="text-white/80 text-sm flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5" />
                  {listing.area ? `${listing.area}, ` : ""}{listing.city}, {listing.state}
                </p>
              </div>
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-9 h-9 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-xl flex items-center justify-center text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick stats bar */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-orange-50/50">
          <div className="flex items-center gap-1.5">
            <StarRating rating={listing.rating} size="sm" />
            <span className="font-bold text-gray-900 text-sm">{listing.rating > 0 ? listing.rating.toFixed(1) : "New"}</span>
            {listing.totalReviews > 0 && <span className="text-xs text-gray-400">({listing.totalReviews})</span>}
          </div>
          <div className="flex items-center gap-1 text-sm font-bold text-orange-600">
            <IndianRupee className="w-4 h-4" />
            <span>{INR(listing.pricePerDay)}/day</span>
            {listing.pricePerMonth > 0 && (
              <span className="text-gray-400 font-normal text-xs ml-1">· {INR(listing.pricePerMonth)}/mo</span>
            )}
          </div>
          <div className={cn(
            "flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full",
            listing.available ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
          )}>
            <div className={cn("w-2 h-2 rounded-full", listing.available ? "bg-green-500 ht-pulse" : "bg-gray-400")} />
            {listing.available ? "Available Now" : "Not Available"}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex-shrink-0 flex border-b border-gray-100">
          {(["about", "reviews"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 py-3 text-sm font-bold transition-all capitalize",
                activeTab === tab
                  ? "text-orange-600 border-b-2 border-orange-500"
                  : "text-gray-400 hover:text-gray-700"
              )}
            >
              {tab === "reviews" ? `Reviews (${listing.totalReviews})` : "About Host"}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto ht-scroll p-5 space-y-5">
          {activeTab === "about" && (
            <>
              {/* Bio */}
              <div>
                <h4 className="ht-display font-bold text-gray-900 mb-2">About</h4>
                <p className="text-sm text-gray-600 leading-relaxed">{listing.hostBio}</p>
              </div>

              {/* Pet types */}
              <div>
                <h4 className="ht-display font-bold text-gray-900 mb-2">Accepts Pets</h4>
                <div className="flex flex-wrap gap-2">
                  {listing.petTypes.map(pt => {
                    const m = PET_TYPE_META[pt] || PET_TYPE_META.other;
                    return (
                      <span key={pt} className={cn("flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full", m.color)}>
                        {m.emoji} {m.label}
                      </span>
                    );
                  })}
                </div>
                {listing.acceptedBreeds && (
                  <p className="text-xs text-gray-500 mt-2">Breeds: {listing.acceptedBreeds}</p>
                )}
              </div>

              {/* Services */}
              <div>
                <h4 className="ht-display font-bold text-gray-900 mb-2">Services Offered</h4>
                <div className="grid grid-cols-2 gap-2">
                  {listing.services.map(s => {
                    const m = SERVICE_META[s];
                    return m ? (
                      <div key={s} className="flex items-center gap-2 text-sm text-gray-700 bg-orange-50 rounded-xl px-3 py-2.5 border border-orange-100">
                        <span className="text-base">{m.emoji}</span>
                        <span className="font-medium">{m.label}</span>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>

              {/* Home details */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-2xl p-3.5 border border-gray-100">
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Home Type</p>
                  <p className="font-bold text-gray-900 text-sm">
                    {HOME_TYPE_META[listing.homeType]?.emoji} {HOME_TYPE_META[listing.homeType]?.label || listing.homeType}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-3.5 border border-gray-100">
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Max Pets</p>
                  <p className="font-bold text-gray-900 text-sm">🐾 Up to {listing.maxPets} pets</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-3.5 border border-gray-100">
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Experience</p>
                  <p className="font-bold text-gray-900 text-sm">⭐ {listing.yearsExperience}+ years</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-3.5 border border-gray-100">
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Working Hours</p>
                  <p className="font-bold text-gray-900 text-sm">🕐 {listing.workingHours}</p>
                </div>
              </div>

              {/* Amenities */}
              {(listing.hasGarden || listing.hasCctv) && (
                <div>
                  <h4 className="ht-display font-bold text-gray-900 mb-2">Home Amenities</h4>
                  <div className="flex gap-2 flex-wrap">
                    {listing.hasGarden && (
                      <span className="flex items-center gap-1.5 text-sm font-semibold bg-green-100 text-green-700 px-3 py-1.5 rounded-full">
                        <Leaf className="w-4 h-4" /> Garden / Outdoor Area
                      </span>
                    )}
                    {listing.hasCctv && (
                      <span className="flex items-center gap-1.5 text-sm font-semibold bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full">
                        <Camera className="w-4 h-4" /> CCTV / Monitoring
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Languages */}
              {listing.languages.length > 0 && (
                <div>
                  <h4 className="ht-display font-bold text-gray-900 mb-2">Languages</h4>
                  <p className="text-sm text-gray-600">{listing.languages.join(", ")}</p>
                </div>
              )}

              {/* Own pets */}
              {listing.ownPets && (
                <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
                  <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">Host's Own Pets</p>
                  <p className="text-sm text-gray-700">{listing.ownPets}</p>
                </div>
              )}

              {/* Contact */}
              {listing.hostPhone && (
                <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100 flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white flex-shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-orange-600 uppercase tracking-wider">Contact Host</p>
                    <p className="font-bold text-gray-900">{listing.hostPhone}</p>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === "reviews" && (
            <>
              {/* Summary */}
              {listing.totalReviews > 0 && (
                <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100 flex items-center gap-4">
                  <div className="text-center">
                    <p className="ht-display text-4xl font-bold text-orange-600">{listing.rating.toFixed(1)}</p>
                    <StarRating rating={listing.rating} size="sm" />
                    <p className="text-xs text-gray-400 mt-1">{listing.totalReviews} reviews</p>
                  </div>
                  <div className="flex-1 space-y-1">
                    {[5,4,3,2,1].map(star => {
                      const count = listing.reviews.filter(r => r.rating === star).length;
                      const pct = listing.totalReviews > 0 ? (count / listing.totalReviews) * 100 : 0;
                      return (
                        <div key={star} className="flex items-center gap-2 text-xs">
                          <span className="w-2 text-gray-500 font-semibold">{star}</span>
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <div className="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-amber-400 h-full rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="w-5 text-gray-400">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Write review */}
              {currentUser && !alreadyReviewed && (
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                  <h4 className="ht-display font-bold text-gray-900 mb-3">Write a Review</h4>
                  <div className="mb-3">
                    <p className="text-sm text-gray-600 mb-2 font-medium">Your rating</p>
                    <StarRating rating={reviewRating} interactive size="lg" onRate={setReviewRating} />
                  </div>
                  <textarea
                    rows={3}
                    value={reviewText}
                    onChange={e => { setReviewText(e.target.value); setReviewError(""); }}
                    placeholder="Share your experience with this host..."
                    className="ht-input resize-none mb-3"
                  />
                  {reviewError && (
                    <p className="text-xs text-red-500 flex items-center gap-1 mb-2">
                      <AlertCircle className="w-3 h-3" />{reviewError}
                    </p>
                  )}
                  <button
                    onClick={handleReview}
                    disabled={submitting}
                    className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 disabled:opacity-50 transition-colors text-sm"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 ht-spin" /> : <Send className="w-4 h-4" />}
                    Submit Review
                  </button>
                </div>
              )}

              {alreadyReviewed && (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-2 text-sm text-green-700 font-semibold">
                  <Check className="w-4 h-4" /> You've already reviewed this host.
                </div>
              )}

              {!currentUser && (
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-center">
                  <p className="text-sm text-gray-600 font-medium">Sign in to write a review</p>
                </div>
              )}

              {/* Reviews list */}
              {listing.reviews.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">📝</div>
                  <p className="font-bold text-gray-800">No reviews yet</p>
                  <p className="text-sm text-gray-400 mt-1">Be the first to share your experience!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {[...listing.reviews].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(review => (
                    <div key={review.id} className="flex gap-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                      <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-xl flex-shrink-0 overflow-hidden">
                        {review.reviewerAvatar.startsWith("http") ? (
                          <img src={review.reviewerAvatar} alt="" className="w-full h-full object-cover rounded-full" />
                        ) : (
                          <span>{review.reviewerAvatar}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-bold text-gray-900 text-sm">{review.reviewerName}</span>
                          <StarRating rating={review.rating} size="sm" />
                          <span className="text-xs text-gray-400">
                            {new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   BECOME HOST MODAL
═══════════════════════════════════════════════════════════════════════════ */
function BecomeHostModal({
  onClose,
  onCreated,
  user,
}: {
  onClose: () => void;
  onCreated: (listing: HostListing) => void;
  user: any;
}) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [form, setForm] = useState({
    hostName:        user?.fullName || user?.firstName || "",
    hostBio:         "",
    hostPhone:       "",
    hostPhoto:       user?.imageUrl || "",
    city:            "",
    state:           "",
    area:            "",
    pincode:         "",
    petTypes:        [] as string[],
    maxPets:         "2",
    petSizeLimit:    "any",
    acceptedBreeds:  "",
    pricePerDay:     "",
    pricePerMonth:   "",
    services:        [] as string[],
    available:       true,
    availableFrom:   "",
    availableTo:     "",
    workingHours:    "24/7",
    homeType:        "flat",
    hasGarden:       false,
    hasCctv:         false,
    petFriendlySpace: "",
    yearsExperience: "0",
    languages:       ["Hindi", "English"],
    emergencyContact: "",
    ownPets:         "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (key: keyof typeof form, val: any) => {
    setForm(p => ({ ...p, [key]: val }));
    setErrors(p => ({ ...p, [key]: "" }));
  };

  const toggleArr = (key: "petTypes" | "services" | "languages", val: string) => {
    const cur = form[key] as string[];
    set(key, cur.includes(val) ? cur.filter(x => x !== val) : [...cur, val]);
  };

  const validateStep = (s: number) => {
    const e: Record<string, string> = {};
    if (s === 1) {
      if (!form.hostName.trim())  e.hostName = "Required";
      if (!form.hostBio.trim())   e.hostBio  = "Required";
      if (!form.hostPhone.trim()) e.hostPhone = "Required";
    }
    if (s === 2) {
      if (!form.city.trim())  e.city  = "Required";
      if (!form.state.trim()) e.state = "Required";
      if (!form.pricePerDay || isNaN(Number(form.pricePerDay))) e.pricePerDay = "Required";
      if (form.petTypes.length === 0) e.petTypes = "Select at least one";
    }
    if (s === 3) {
      if (form.services.length === 0) e.services = "Select at least one service";
    }
    return e;
  };

  const goNext = () => {
    const e = validateStep(step);
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    if (step < 3) setStep(s => s + 1);
    else handleSubmit();
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      setError("Cloudinary not configured");
      return;
    }
    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      const r = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, { method: "POST", body: fd });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error?.message || "Upload failed");
      set("hostPhoto", d.secure_url);
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setUploadingPhoto(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          hostClerkId:    user?.id || "",
          pricePerDay:    parseFloat(form.pricePerDay),
          pricePerMonth:  parseFloat(form.pricePerMonth) || 0,
          maxPets:        parseInt(form.maxPets) || 2,
          yearsExperience: parseInt(form.yearsExperience) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create listing");
      onCreated(data);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setLoading(false);
    }
  };

  const inpCls = (k: string) => cn("ht-input", errors[k] && "error");

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="ht-pop bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-amber-400 px-6 py-5 rounded-t-3xl sm:rounded-t-3xl flex items-center justify-between z-10">
          <div className="text-white">
            <p className="text-xs font-bold uppercase tracking-widest opacity-70">Step {step} of 3</p>
            <h2 className="ht-display text-xl font-bold">
              {step === 1 ? "Your Profile" : step === 2 ? "Location & Pets" : "Services & Home"}
            </h2>
          </div>
          <button onClick={onClose} className="w-9 h-9 bg-white/20 hover:bg-white/35 rounded-xl flex items-center justify-center text-white transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-gray-200 flex-shrink-0">
          <div className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-500"
            style={{ width: `${(step / 3) * 100}%` }} />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto ht-scroll p-6 space-y-4">
          {/* STEP 1 */}
          {step === 1 && (
            <>
              <div className="flex items-center gap-4 mb-2">
                <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-orange-100 flex-shrink-0">
                  {form.hostPhoto ? (
                    <img src={form.hostPhoto} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">{user?.imageUrl ? "..." : "🏠"}</div>
                  )}
                  {uploadingPhoto && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-white ht-spin" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">Profile Photo</p>
                  <label className="cursor-pointer">
                    <span className="text-xs text-orange-500 font-semibold hover:text-orange-600">Upload Photo</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Full Name <span className="text-orange-500">*</span></label>
                <input type="text" value={form.hostName} onChange={e => set("hostName", e.target.value)}
                  placeholder="e.g. Priya Sharma" className={inpCls("hostName")} />
                {errors.hostName && <p className="text-xs text-red-500 mt-1">{errors.hostName}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">About Yourself <span className="text-orange-500">*</span></label>
                <textarea rows={3} value={form.hostBio} onChange={e => set("hostBio", e.target.value)}
                  placeholder="Tell pet owners about yourself, your experience, and why they can trust you..."
                  className={cn(inpCls("hostBio"), "resize-none")} />
                {errors.hostBio && <p className="text-xs text-red-500 mt-1">{errors.hostBio}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Phone <span className="text-orange-500">*</span></label>
                  <input type="tel" value={form.hostPhone} onChange={e => set("hostPhone", e.target.value)}
                    placeholder="+91 98765 43210" className={inpCls("hostPhone")} />
                  {errors.hostPhone && <p className="text-xs text-red-500 mt-1">{errors.hostPhone}</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Years Experience</label>
                  <input type="number" min="0" max="50" value={form.yearsExperience} onChange={e => set("yearsExperience", e.target.value)}
                    placeholder="0" className="ht-input" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Languages Spoken</label>
                <div className="flex flex-wrap gap-1.5">
                  {["Hindi","English","Marathi","Tamil","Telugu","Kannada","Bengali","Gujarati","Punjabi","Malayalam"].map(lang => (
                    <button key={lang} type="button" onClick={() => toggleArr("languages", lang)}
                      className={cn("ht-pill", form.languages.includes(lang) && "active")}>{lang}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Your Own Pets (optional)</label>
                <input type="text" value={form.ownPets} onChange={e => set("ownPets", e.target.value)}
                  placeholder="e.g. 1 Labrador (Bruno, 4 years), 1 cat (Mia)" className="ht-input" />
              </div>
            </>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">City <span className="text-orange-500">*</span></label>
                  <div className="relative">
                    <select value={form.city} onChange={e => set("city", e.target.value)} className={cn(inpCls("city"), "ht-select")}>
                      <option value="">Select city</option>
                      {INDIAN_CITIES.sort().map(c => <option key={c}>{c}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                  {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">State <span className="text-orange-500">*</span></label>
                  <div className="relative">
                    <select value={form.state} onChange={e => set("state", e.target.value)} className={cn(inpCls("state"), "ht-select")}>
                      <option value="">Select state</option>
                      {INDIAN_STATES.sort().map(s => <option key={s}>{s}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                  {errors.state && <p className="text-xs text-red-500 mt-1">{errors.state}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Area / Locality</label>
                  <input type="text" value={form.area} onChange={e => set("area", e.target.value)}
                    placeholder="e.g. Koregaon Park, Bandra" className="ht-input" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Pincode</label>
                  <input type="text" maxLength={6} value={form.pincode} onChange={e => set("pincode", e.target.value.replace(/\D/g, ""))}
                    placeholder="411001" className="ht-input" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Price / Day (₹) <span className="text-orange-500">*</span></label>
                  <input type="number" min="1" value={form.pricePerDay} onChange={e => set("pricePerDay", e.target.value)}
                    placeholder="e.g. 500" className={inpCls("pricePerDay")} />
                  {errors.pricePerDay && <p className="text-xs text-red-500 mt-1">{errors.pricePerDay}</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Price / Month (₹)</label>
                  <input type="number" min="0" value={form.pricePerMonth} onChange={e => set("pricePerMonth", e.target.value)}
                    placeholder="e.g. 10,000" className="ht-input" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Pet Types Accepted <span className="text-orange-500">*</span></label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(PET_TYPE_META).filter(([k]) => k !== "other").map(([key, meta]) => (
                    <button key={key} type="button" onClick={() => toggleArr("petTypes", key)}
                      className={cn("ht-pill", form.petTypes.includes(key) && "active")}>
                      {meta.emoji} {meta.label}
                    </button>
                  ))}
                </div>
                {errors.petTypes && <p className="text-xs text-red-500 mt-1">{errors.petTypes}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Max Pets at Once</label>
                  <input type="number" min="1" max="20" value={form.maxPets} onChange={e => set("maxPets", e.target.value)}
                    placeholder="2" className="ht-input" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Pet Size Limit</label>
                  <div className="relative">
                    <select value={form.petSizeLimit} onChange={e => set("petSizeLimit", e.target.value)} className="ht-input ht-select">
                      <option value="any">Any Size</option>
                      <option value="small">Small only (&lt;10kg)</option>
                      <option value="medium">Medium (&lt;25kg)</option>
                      <option value="large">Large (&lt;50kg)</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Breeds Accepted (optional)</label>
                <input type="text" value={form.acceptedBreeds} onChange={e => set("acceptedBreeds", e.target.value)}
                  placeholder="e.g. All breeds, or: Labrador, Golden Retriever, Poodle" className="ht-input" />
              </div>
            </>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Services Offered <span className="text-orange-500">*</span></label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(SERVICE_META).map(([key, meta]) => (
                    <button key={key} type="button" onClick={() => toggleArr("services", key)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all text-left",
                        form.services.includes(key)
                          ? "border-orange-500 bg-orange-50 text-orange-700"
                          : "border-gray-200 text-gray-600 hover:border-orange-300 bg-white"
                      )}>
                      <span className="text-base">{meta.emoji}</span>
                      <span>{meta.label}</span>
                      {form.services.includes(key) && <Check className="w-3.5 h-3.5 ml-auto text-orange-500" />}
                    </button>
                  ))}
                </div>
                {errors.services && <p className="text-xs text-red-500 mt-1">{errors.services}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Home Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(HOME_TYPE_META).map(([key, meta]) => (
                    <button key={key} type="button" onClick={() => set("homeType", key)}
                      className={cn(
                        "flex flex-col items-center gap-1 px-3 py-3 rounded-xl border-2 text-xs font-bold transition-all text-center",
                        form.homeType === key
                          ? "border-orange-500 bg-orange-50 text-orange-700"
                          : "border-gray-200 text-gray-500 hover:border-orange-200"
                      )}>
                      <span className="text-2xl">{meta.emoji}</span>
                      {meta.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                {[
                  { key: "hasGarden", label: "🌿 Has Garden / Outdoor Area" },
                  { key: "hasCctv",   label: "📹 Has CCTV / Security Camera" },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer flex-1">
                    <div
                      onClick={() => set(key as any, !(form as any)[key])}
                      className={cn(
                        "w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all",
                        (form as any)[key] ? "bg-orange-500 border-orange-500" : "border-gray-300"
                      )}
                    >
                      {(form as any)[key] && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="text-sm text-gray-700 font-medium">{label}</span>
                  </label>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Working Hours</label>
                  <div className="relative">
                    <select value={form.workingHours} onChange={e => set("workingHours", e.target.value)} className="ht-input ht-select">
                      {["24/7","6 AM – 10 PM","8 AM – 8 PM","Morning Only","Evening Only"].map(h => (
                        <option key={h}>{h}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Emergency Contact</label>
                  <input type="tel" value={form.emergencyContact} onChange={e => set("emergencyContact", e.target.value)}
                    placeholder="Backup phone number" className="ht-input" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Pet-Friendly Space Description</label>
                <textarea rows={2} value={form.petFriendlySpace} onChange={e => set("petFriendlySpace", e.target.value)}
                  placeholder="Describe your space — separate room, pet area, garden, etc."
                  className="ht-input resize-none" />
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div onClick={() => set("available", !form.available)}
                    className={cn("w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                      form.available ? "bg-orange-500 border-orange-500" : "border-gray-300")}>
                    {form.available && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-sm text-gray-700 font-medium">I'm currently available to host pets</span>
                </label>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-white">
          <button type="button"
            onClick={() => step === 1 ? onClose() : setStep(s => s - 1)}
            className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-bold text-sm hover:border-gray-300 transition-all">
            {step === 1 ? "Cancel" : "← Back"}
          </button>
          <button type="button" onClick={goNext} disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-white font-bold text-sm hover:opacity-90 transition-all shadow-md shadow-orange-200/50 disabled:opacity-60">
            {loading
              ? <><Loader2 className="w-4 h-4 ht-spin" /> Creating…</>
              : step < 3 ? <>Continue →</>
                         : <>🏠 List My Home</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════════════ */
export default function Hosting() {
  const { user } = useUser();

  const [listings,    setListings]    = useState<HostListing[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [favorites,   setFavorites]   = useState<Set<string>>(new Set());
  const [selected,    setSelected]    = useState<HostListing | null>(null);
  const [showModal,   setShowModal]   = useState(false);

  const [search,      setSearch]      = useState("");
  const [cityFilter,  setCityFilter]  = useState("all");
  const [petFilter,   setPetFilter]   = useState("all");
  const [sortBy,      setSortBy]      = useState("rating");
  const [onlyAvail,   setOnlyAvail]   = useState(false);
  const [maxPrice,    setMaxPrice]    = useState(5000);
  const [activeView,  setActiveView]  = useState<"browse" | "list">("browse");

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ sortBy });
      if (cityFilter !== "all")  params.set("city", cityFilter);
      if (petFilter !== "all")   params.set("petType", petFilter);
      if (onlyAvail)             params.set("available", "true");
      if (maxPrice < 5000)       params.set("maxPrice", String(maxPrice));
      if (search.trim())         params.set("search", search.trim());

      const res = await fetch(`${API}?${params}`);
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      setListings(await res.json());
    } catch (err: any) {
      setError(err.message || "Failed to load listings");
    } finally {
      setLoading(false);
    }
  }, [cityFilter, petFilter, sortBy, onlyAvail, maxPrice, search]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  const toggleFav = (id: string) =>
    setFavorites(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const handleReviewAdded = (updated: HostListing) => {
    setListings(prev => prev.map(l => l.id === updated.id ? updated : l));
    setSelected(updated);
  };

  const handleListingCreated = (listing: HostListing) => {
    setListings(prev => [listing, ...prev]);
    setShowModal(false);
    setSelected(listing);
  };

  const topCities = ["Mumbai", "Delhi", "Bengaluru", "Pune", "Hyderabad", "Chennai", "Kolkata", "Ahmedabad", "Jaipur", "Kochi"];

  return (
    <>
      <style>{STYLES}</style>
      <div className="ht-root min-h-screen bg-[#FDFCF9]">
        <Header />

        {/* Modals */}
        {selected && (
          <HostDetailModal
            listing={selected}
            onClose={() => setSelected(null)}
            currentUser={user}
            onReviewAdded={handleReviewAdded}
          />
        )}
        {showModal && user && (
          <BecomeHostModal
            onClose={() => setShowModal(false)}
            onCreated={handleListingCreated}
            user={user}
          />
        )}

        {/* ── HERO ── */}
        <section className="relative overflow-hidden bg-gradient-to-br from-orange-600 via-orange-500 to-amber-400 pt-14 pb-20">
          <div className="absolute inset-0 ht-dot-bg pointer-events-none" />
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-16 -left-12 w-64 h-64 bg-orange-700/20 rounded-full blur-3xl" />

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 mb-4 text-white/70 text-xs font-bold uppercase tracking-widest">
                <PawPrint className="w-4 h-4" /> Pet Hosting Across India
              </div>
              <h1 className="ht-display text-5xl sm:text-6xl font-bold text-white leading-tight mb-4">
                Your Pet's<br />
                <span className="text-amber-200">Home Away</span><br />
                From Home
              </h1>
              <p className="text-white/75 text-base sm:text-lg max-w-md mb-8 leading-relaxed">
                Find trusted pet hosts across 50+ Indian cities. Vetted, caring, affordable — from ₹200/day.
              </p>

              {/* Search bar */}
              <div className="flex gap-2 flex-col sm:flex-row max-w-xl">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by city, area, name…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50 shadow-lg"
                  />
                </div>
                <button
                  onClick={() => user ? setShowModal(true) : alert("Please sign in to list your home")}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white text-orange-600 font-bold text-sm hover:bg-orange-50 transition-all shadow-lg flex-shrink-0"
                >
                  <Plus className="w-4 h-4" /> List My Home
                </button>
              </div>

              {/* Stats */}
              <div className="flex gap-6 mt-8 flex-wrap">
                {[
                  { val: `${listings.length || "100"}+`, label: "Trusted Hosts" },
                  { val: "50+", label: "Indian Cities" },
                  { val: "₹200+", label: "Starting/Day" },
                  { val: "5★", label: "Avg Rating" },
                ].map(({ val, label }) => (
                  <div key={label} className="text-white">
                    <p className="ht-display text-2xl font-bold">{val}</p>
                    <p className="text-white/60 text-xs font-semibold uppercase tracking-wider">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 32" preserveAspectRatio="none">
            <path d="M0,32 C480,0 960,0 1440,32 L1440,32 L0,32 Z" fill="#FDFCF9" />
          </svg>
        </section>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* City quick filters */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
            <button
              onClick={() => setCityFilter("all")}
              className={cn("ht-pill flex-shrink-0", cityFilter === "all" && "active")}
            >
              🇮🇳 All India
            </button>
            {topCities.map(city => (
              <button
                key={city}
                onClick={() => setCityFilter(city)}
                className={cn("ht-pill flex-shrink-0", cityFilter === city && "active")}
              >
                📍 {city}
              </button>
            ))}
          </div>

          <div className="grid lg:grid-cols-[280px,1fr] gap-8 items-start">
            {/* ── SIDEBAR ── */}
            <aside className="lg:sticky lg:top-24 space-y-4">
              {/* Become a host CTA */}
              <div className="relative overflow-hidden bg-gradient-to-br from-orange-500 to-amber-400 rounded-3xl p-6 text-white shadow-lg shadow-orange-200/50">
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full" />
                <div className="text-4xl mb-3 relative">🏠</div>
                <h3 className="ht-display font-bold text-xl mb-1 relative">Host Pets & Earn</h3>
                <p className="text-white/80 text-sm mb-4 leading-relaxed relative">
                  Turn your home into a pet haven and earn ₹500–₹2,000/day. Join 1,000+ hosts across India.
                </p>
                <button
                  onClick={() => user ? setShowModal(true) : alert("Please sign in")}
                  className="w-full bg-white text-orange-600 font-bold py-2.5 rounded-2xl hover:bg-orange-50 transition-colors text-sm relative"
                >
                  Become a Host
                </button>
              </div>

              {/* Filters */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                  <Filter className="w-4 h-4 text-orange-500" />
                  <span className="font-bold text-gray-900">Filters</span>
                </div>
                <div className="p-5 space-y-5">
                  {/* Pet type */}
                  <div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Pet Type</p>
                    <div className="space-y-1.5">
                      {[
                        { val: "all", label: "All Pets", emoji: "🐾" },
                        ...Object.entries(PET_TYPE_META).filter(([k]) => k !== "other").map(([k, v]) => ({ val: k, label: v.label, emoji: v.emoji }))
                      ].map(({ val, label, emoji }) => (
                        <button key={val} onClick={() => setPetFilter(val)}
                          className={cn("flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm font-semibold transition-all",
                            petFilter === val ? "bg-orange-500 text-white" : "text-gray-600 hover:bg-orange-50 hover:text-orange-600")}>
                          <span>{emoji}</span>{label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Max price */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Max Price / Day</p>
                      <p className="text-sm font-bold text-orange-600">{maxPrice >= 5000 ? "Any" : INR(maxPrice)}</p>
                    </div>
                    <input type="range" min="200" max="5000" step="100" value={maxPrice}
                      onChange={e => setMaxPrice(parseInt(e.target.value))}
                      className="w-full accent-orange-500" />
                    <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                      <span>₹200</span><span>Any</span>
                    </div>
                  </div>

                  {/* Sort */}
                  <div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Sort By</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { val: "rating",     label: "Top Rated" },
                        { val: "price-asc",  label: "Cheapest" },
                        { val: "experience", label: "Most Exp." },
                        { val: "newest",     label: "Newest" },
                      ].map(({ val, label }) => (
                        <button key={val} onClick={() => setSortBy(val)}
                          className={cn("py-2 text-xs font-bold rounded-xl border-2 transition-all",
                            sortBy === val ? "bg-orange-500 border-orange-500 text-white" : "border-gray-200 text-gray-500 hover:border-orange-200 hover:text-orange-500")}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Available only toggle */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 font-medium">Available Only</span>
                    <button type="button" onClick={() => setOnlyAvail(!onlyAvail)}
                      style={{ height: 22, width: 40 }}
                      className={cn("rounded-full relative border-2 transition-colors",
                        onlyAvail ? "bg-orange-500 border-orange-500" : "bg-gray-200 border-gray-200")}>
                      <div className={cn("absolute top-[3px] w-4 h-4 bg-white rounded-full shadow transition-transform",
                        onlyAvail ? "translate-x-[19px]" : "translate-x-[2px]")} />
                    </button>
                  </div>

                  {/* Reset */}
                  <button onClick={() => { setSearch(""); setCityFilter("all"); setPetFilter("all"); setSortBy("rating"); setOnlyAvail(false); setMaxPrice(5000); }}
                    className="w-full text-xs font-bold text-gray-400 hover:text-orange-500 transition-colors py-1">
                    Reset all filters
                  </button>
                </div>
              </div>
            </aside>

            {/* ── MAIN CONTENT ── */}
            <div>
              {/* Top bar */}
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-gray-500">
                  {loading
                    ? <span className="flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading…</span>
                    : <><span className="font-bold text-gray-900">{listings.length}</span> host{listings.length !== 1 ? "s" : ""} found{cityFilter !== "all" ? ` in ${cityFilter}` : ""}</>
                  }
                </p>
                <button onClick={fetchListings} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-orange-500 font-semibold transition-colors">
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh
                </button>
              </div>

              {/* Error */}
              {error && !loading && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-3 mb-6">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-700">{error}</p>
                    <button onClick={fetchListings} className="flex items-center gap-1 text-sm font-bold text-red-600 mt-2 hover:text-red-700">
                      <RefreshCw className="w-3.5 h-3.5" /> Retry
                    </button>
                  </div>
                </div>
              )}

              {/* Skeleton */}
              {loading && (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {[1,2,3,4,5,6].map(i => (
                    <div key={i} className="bg-white rounded-3xl overflow-hidden border border-gray-100 animate-pulse">
                      <div className="h-44 bg-gray-100" />
                      <div className="p-5 space-y-3">
                        <div className="h-4 bg-gray-100 rounded-full w-3/4" />
                        <div className="h-3 bg-gray-100 rounded-full w-1/2" />
                        <div className="h-5 bg-gray-100 rounded-full w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Empty state */}
              {!loading && !error && listings.length === 0 && (
                <div className="bg-white rounded-3xl p-16 text-center border border-gray-100 shadow-sm">
                  <div className="text-6xl mb-4 ht-paw inline-block">🐾</div>
                  <h3 className="ht-display text-2xl font-bold text-gray-900 mb-2">No hosts found</h3>
                  <p className="text-gray-400 mb-6 text-sm">Try changing filters or be the first host in this city!</p>
                  <button
                    onClick={() => user ? setShowModal(true) : alert("Please sign in")}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-orange-500 text-white font-bold text-sm hover:bg-orange-600 transition-colors mx-auto"
                  >
                    <Plus className="w-4 h-4" /> Become a Host
                  </button>
                </div>
              )}

              {/* Listings grid */}
              {!loading && !error && listings.length > 0 && (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {listings.map((listing, i) => (
                    <div key={listing.id} className="ht-up" style={{ animationDelay: `${Math.min(i, 9) * 45}ms` }}>
                      <HostCard
                        listing={listing}
                        isFavorite={favorites.has(listing.id)}
                        onFavorite={() => toggleFav(listing.id)}
                        onClick={() => setSelected(listing)}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Why host with us */}
              {!loading && (
                <div className="mt-12 bg-gradient-to-br from-orange-50 to-amber-50 rounded-3xl p-8 border border-orange-100">
                  <h2 className="ht-display text-2xl font-bold text-gray-900 mb-6 text-center">Why Pet Owners Love PetMatch Hosting</h2>
                  <div className="grid sm:grid-cols-3 gap-5">
                    {[
                      { emoji: "🏠", title: "Home-Like Care", desc: "Pets stay in real homes, not kennels — so they feel safe and loved" },
                      { emoji: "⭐", title: "Verified & Rated", desc: "All hosts are reviewed by real pet owners with verified 5-star ratings" },
                      { emoji: "💬", title: "Daily Updates", desc: "Get photos & updates of your pet every day via direct chat" },
                    ].map(({ emoji, title, desc }) => (
                      <div key={title} className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-sm flex-shrink-0">{emoji}</div>
                        <div>
                          <h4 className="font-bold text-gray-900 mb-1">{title}</h4>
                          <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
