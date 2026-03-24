import { useState, useEffect, useCallback, useRef } from "react";
import { useUser } from "@clerk/clerk-react";
import Header from "@/components/Header";
import { cn } from "@/lib/utils";
import {
  ShoppingCart, Heart, Star, Search, Check, Truck, RotateCcw,
  Plus, X, ChevronDown, Package, Store as StoreIcon, Tag, Layers,
  AlertCircle, Loader2, RefreshCw, IndianRupee, ShieldCheck,
  Pencil, Trash2, ChevronRight, MapPin, Phone, SlidersHorizontal,
  ArrowLeft, CheckCircle, LogIn, Sparkles, Award, Clock, Filter,
} from "lucide-react";

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface Product {
  id: string;
  name: string;
  description: string;
  category: "food" | "toys" | "grooming" | "accessories" | "medicine" | "housing";
  petType: "dog" | "cat" | "fish" | "bird" | "all";
  price: number;
  stock: number;
  image: string;
  brand: string;
  sellerId: string;
  sellerName: string;
  sellerEmail: string;
  rating: number;
  reviews: number;
  approved: boolean;
  createdAt: string;
}

interface CartItem extends Product { quantity: number; }

interface Order {
  id: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  items: { productId: string; name: string; price: number; quantity: number; image: string; sellerName: string }[];
  totalAmount: number;
  status: string;
  address: string;
  phone: string;
  createdAt: string;
}

type PetFilter = "all" | "dog" | "cat" | "fish" | "bird";
type CatFilter = "all" | "food" | "toys" | "grooming" | "accessories" | "medicine" | "housing";
type SortBy    = "createdAt" | "price-asc" | "price-desc" | "rating" | "popular";
type Tab       = "shop" | "sell" | "orders";

/* ─── Constants ──────────────────────────────────────────────────────────── */
const API = "/api/store";

const PET_META: Record<string, { emoji: string; label: string; color: string; bg: string }> = {
  all:  { emoji: "🐾", label: "All Pets",  color: "text-slate-700",  bg: "bg-slate-100" },
  dog:  { emoji: "🐕", label: "Dogs",      color: "text-orange-700", bg: "bg-orange-100" },
  cat:  { emoji: "🐱", label: "Cats",      color: "text-amber-700",  bg: "bg-amber-100" },
  fish: { emoji: "🐠", label: "Fish",      color: "text-blue-700",   bg: "bg-blue-100" },
  bird: { emoji: "🐦", label: "Birds",     color: "text-green-700",  bg: "bg-green-100" },
};

const CAT_META: Record<string, { emoji: string; label: string }> = {
  all:         { emoji: "✨", label: "All Categories" },
  food:        { emoji: "🥩", label: "Food & Treats" },
  toys:        { emoji: "🧸", label: "Toys & Chews" },
  grooming:    { emoji: "🪮", label: "Grooming" },
  accessories: { emoji: "⛓️", label: "Accessories" },
  medicine:    { emoji: "💊", label: "Medicine" },
  housing:     { emoji: "🏠", label: "Housing" },
};

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: "createdAt",  label: "Newest First" },
  { value: "rating",     label: "Top Rated" },
  { value: "popular",    label: "Most Popular" },
  { value: "price-asc",  label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
];

const STATUS_META: Record<string, { label: string; color: string }> = {
  pending:   { label: "Pending",   color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  confirmed: { label: "Confirmed", color: "bg-blue-100 text-blue-700 border-blue-200" },
  shipped:   { label: "Shipped",   color: "bg-purple-100 text-purple-700 border-purple-200" },
  delivered: { label: "Delivered", color: "bg-green-100 text-green-700 border-green-200" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700 border-red-200" },
};

const INR = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const CLOUDINARY_CLOUD_NAME   = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME   || "";
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "";

/* ─── Styles ─────────────────────────────────────────────────────────────── */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Nunito:wght@400;500;600;700;800&display=swap');

.st-root { font-family: 'Nunito', sans-serif; }
.st-display { font-family: 'Playfair Display', Georgia, serif; }

@keyframes st-up   { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }
@keyframes st-pop  { 0%{transform:scale(.85);opacity:0} 65%{transform:scale(1.05)} 100%{transform:scale(1);opacity:1} }
@keyframes st-spin { to{transform:rotate(360deg)} }
@keyframes st-pulse{ 0%,100%{opacity:1}50%{opacity:.5} }
@keyframes st-badge{ 0%{transform:scale(0)} 65%{transform:scale(1.3)} 100%{transform:scale(1)} }
@keyframes st-shine{ 0%{background-position:200% center} 100%{background-position:-200% center} }

.st-up    { animation: st-up  .3s ease both; }
.st-pop   { animation: st-pop .28s cubic-bezier(.34,1.56,.64,1) both; }
.st-badge { animation: st-badge .22s cubic-bezier(.34,1.56,.64,1) both; }
.st-pulse { animation: st-pulse 1.8s ease-in-out infinite; }

.st-card {
  transition: transform .2s ease, box-shadow .2s ease;
}
.st-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 16px 40px -12px rgba(0,0,0,.15);
}
.st-scroll::-webkit-scrollbar { width: 3px; }
.st-scroll::-webkit-scrollbar-thumb { background: #fed7aa; border-radius: 999px; }

.gradient-btn {
  background: linear-gradient(135deg, #f97316, #f59e0b);
  transition: opacity .18s ease, transform .12s ease;
}
.gradient-btn:hover:not(:disabled) { opacity:.92; transform:scale(1.02); }
.gradient-btn:active:not(:disabled) { transform:scale(.98); }
.gradient-btn:disabled { opacity:.5; cursor:not-allowed; }

.fish-pill { background: linear-gradient(90deg, #dbeafe, #ede9fe); }
.dog-pill  { background: linear-gradient(90deg, #ffedd5, #fef3c7); }
.cat-pill  { background: linear-gradient(90deg, #fef3c7, #fef9c3); }
.bird-pill { background: linear-gradient(90deg, #dcfce7, #d1fae5); }
.all-pill  { background: linear-gradient(90deg, #f1f5f9, #e2e8f0); }

.shimmer {
  background: linear-gradient(90deg, #f8fafc 25%, #e2e8f0 50%, #f8fafc 75%);
  background-size: 200% 100%;
  animation: st-shine 1.4s ease-in-out infinite;
}
`;

/* ─── Helper components ──────────────────────────────────────────────────── */
function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={cn("w-3.5 h-3.5", i <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-gray-200")} />
      ))}
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="shimmer h-48 w-full" />
      <div className="p-5 space-y-3">
        <div className="shimmer h-4 rounded-full w-3/4" />
        <div className="shimmer h-3 rounded-full w-1/2" />
        <div className="shimmer h-5 rounded-full w-1/3" />
      </div>
    </div>
  );
}

function PetBadge({ petType }: { petType: string }) {
  const m = PET_META[petType] || PET_META.all;
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full", m.bg, m.color)}>
      {m.emoji} {m.label}
    </span>
  );
}

/* ─── Product Card ───────────────────────────────────────────────────────── */
function ProductCard({
  product,
  isFavorite,
  inCart,
  onAddCart,
  onFavorite,
  isOwn,
  onEdit,
  onDelete,
}: {
  product: Product;
  isFavorite: boolean;
  inCart: boolean;
  onAddCart: () => void;
  onFavorite: () => void;
  isOwn: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [imgErr, setImgErr] = useState(false);

  const catEmoji = CAT_META[product.category]?.emoji || "📦";

  return (
    <div className="st-card bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
      {/* Image */}
      <div className="relative h-48 bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center overflow-hidden">
        {product.image && !imgErr ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={() => setImgErr(true)}
          />
        ) : (
          <span className="text-7xl">{catEmoji}</span>
        )}
        {/* Top badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          <PetBadge petType={product.petType} />
          {product.stock === 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Out of Stock</span>
          )}
          {product.stock > 0 && product.stock <= 5 && (
            <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Only {product.stock} left</span>
          )}
        </div>
        {/* Favorite */}
        <button
          onClick={onFavorite}
          className={cn(
            "absolute top-3 right-3 w-8 h-8 rounded-xl flex items-center justify-center transition-all shadow-sm",
            isFavorite ? "bg-red-500 text-white" : "bg-white/90 text-gray-400 hover:text-red-400"
          )}
        >
          <Heart className="w-4 h-4 fill-current" />
        </button>
        {/* Seller actions */}
        {isOwn && (
          <div className="absolute bottom-3 right-3 flex gap-1.5">
            <button onClick={onEdit} className="w-7 h-7 bg-blue-500 text-white rounded-lg flex items-center justify-center shadow hover:bg-blue-600 transition-colors">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={onDelete} className="w-7 h-7 bg-red-500 text-white rounded-lg flex items-center justify-center shadow hover:bg-red-600 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-base leading-snug truncate">{product.name}</h3>
            <p className="text-xs text-gray-500 font-medium mt-0.5">{product.brand}</p>
          </div>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-semibold whitespace-nowrap">
            {CAT_META[product.category]?.label}
          </span>
        </div>

        <p className="text-sm text-gray-500 leading-relaxed mb-3 line-clamp-2">{product.description}</p>

        <div className="flex items-center gap-2 mb-3">
          <Stars rating={product.rating} />
          {product.reviews > 0 ? (
            <span className="text-xs text-gray-400">({product.reviews})</span>
          ) : (
            <span className="text-xs text-gray-400">New</span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="st-display text-2xl font-bold text-gray-900">{INR(product.price)}</p>
            <p className="text-xs text-gray-400">by {product.sellerName}</p>
          </div>
          <button
            onClick={onAddCart}
            disabled={product.stock === 0 || inCart}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all",
              product.stock === 0 ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : inCart ? "bg-green-100 text-green-700 cursor-default"
              : "gradient-btn text-white shadow-md shadow-orange-200"
            )}
          >
            {inCart ? (
              <><Check className="w-4 h-4" /> Added</>
            ) : product.stock === 0 ? (
              "Sold Out"
            ) : (
              <><ShoppingCart className="w-4 h-4" /> Add</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Checkout Modal ─────────────────────────────────────────────────────── */
function CheckoutModal({
  cart,
  onClose,
  onConfirm,
  user,
}: {
  cart: CartItem[];
  onClose: () => void;
  onConfirm: (address: string, phone: string) => Promise<void>;
  user: any;
}) {
  const [address, setAddress] = useState("");
  const [phone,   setPhone]   = useState("");
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState<Record<string, string>>({});

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const e2: Record<string, string> = {};
    if (!address.trim()) e2.address = "Delivery address is required";
    if (!phone.trim() || !/^\d{10}$/.test(phone.trim())) e2.phone = "Valid 10-digit phone number required";
    setErrors(e2);
    if (Object.keys(e2).length) return;
    setLoading(true);
    await onConfirm(address, phone);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto st-pop">
        <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-5 rounded-t-3xl flex items-center justify-between">
          <div className="text-white">
            <p className="text-xs font-bold uppercase tracking-widest opacity-70">Checkout</p>
            <h2 className="text-xl font-black">{cart.length} item{cart.length !== 1 ? "s" : ""} · {INR(total)}</h2>
          </div>
          <button onClick={onClose} className="w-9 h-9 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Order Summary */}
          <div className="space-y-2">
            {cart.map(item => (
              <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-xl flex-shrink-0">
                  {item.image ? <img src={item.image} className="w-full h-full object-cover rounded-lg" alt="" /> : CAT_META[item.category]?.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{item.name}</p>
                  <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                </div>
                <p className="font-bold text-gray-900 text-sm">{INR(item.price * item.quantity)}</p>
              </div>
            ))}
            <div className="flex justify-between font-black text-lg pt-2 border-t border-gray-200">
              <span>Total</span>
              <span className="text-orange-600">{INR(total)}</span>
            </div>
          </div>

          {/* Delivery */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-1.5"><MapPin className="w-4 h-4 text-orange-500" /> Delivery Address</label>
            <textarea rows={3} value={address} onChange={e => setAddress(e.target.value)}
              placeholder="House No., Street, Area, City, State, PIN"
              className={cn("w-full px-4 py-3 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none", errors.address ? "border-red-400 bg-red-50" : "border-gray-200")}
            />
            {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-1.5"><Phone className="w-4 h-4 text-orange-500" /> Phone Number</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="10-digit mobile number"
              className={cn("w-full px-4 py-3 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400", errors.phone ? "border-red-400 bg-red-50" : "border-gray-200")}
            />
            {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
          </div>

          <button type="submit" disabled={loading} className="gradient-btn w-full py-4 rounded-2xl font-black text-white text-base flex items-center justify-center gap-2 shadow-lg shadow-orange-200">
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Placing Order…</> : <><CheckCircle className="w-5 h-5" /> Place Order · {INR(total)}</>}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ─── Product Form Modal (Seller) ────────────────────────────────────────── */
function ProductFormModal({
  onClose,
  onSaved,
  user,
  editProduct,
}: {
  onClose: () => void;
  onSaved: (p: Product) => void;
  user: any;
  editProduct?: Product;
}) {
  const [form, setForm] = useState({
    name:        editProduct?.name        || "",
    description: editProduct?.description || "",
    category:    editProduct?.category    || "food",
    petType:     editProduct?.petType     || "dog",
    price:       editProduct?.price?.toString() || "",
    stock:       editProduct?.stock?.toString() || "",
    brand:       editProduct?.brand       || "",
    image:       editProduct?.image       || "",
  });
  const [errors,      setErrors]      = useState<Record<string, string>>({});
  const [loading,     setLoading]     = useState(false);
  const [uploading,   setUploading]   = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [serverError, setServerError] = useState("");

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim())        e.name        = "Product name is required";
    if (!form.description.trim()) e.description = "Description is required";
    if (!form.brand.trim())       e.brand       = "Brand is required";
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) e.price = "Valid price is required";
    if (!form.stock || isNaN(Number(form.stock)) || Number(form.stock) < 0)  e.stock = "Valid stock quantity required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setServerError("");
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        stock: parseInt(form.stock),
        sellerId:    user.id,
        sellerName:  user.fullName || user.firstName || "Seller",
        sellerEmail: user.emailAddresses?.[0]?.emailAddress || "",
      };
      const url = editProduct ? `${API}/products/${editProduct.id}` : `${API}/products`;
      const method = editProduct ? "PATCH" : "POST";
      if (editProduct) (payload as any).sellerId = user.id;
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      onSaved(data);
    } catch (err: any) {
      setServerError(err.message || "Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      setUploadError("Cloudinary not configured. Add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET to .env");
      return;
    }
    setUploading(true);
    setUploadError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      const r = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, { method: "POST", body: fd });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error?.message || "Upload failed");
      setForm(f => ({ ...f, image: d.secure_url }));
    } catch (err: any) {
      setUploadError(err.message || "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const inpCls = (hasErr: boolean) =>
    cn("w-full px-4 py-3 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all bg-white",
      hasErr ? "border-red-400 bg-red-50" : "border-gray-200");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto st-pop">
        <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-5 rounded-t-3xl flex items-center justify-between z-10">
          <div className="text-white">
            <p className="text-xs font-bold uppercase tracking-widest opacity-70">{editProduct ? "Edit Product" : "List New Product"}</p>
            <h2 className="text-xl font-black">{editProduct ? "Update Listing" : "Sell on PetMatch"}</h2>
          </div>
          <button onClick={onClose} className="w-9 h-9 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center text-white"><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Pet Type */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">For Which Pet?</label>
            <div className="flex flex-wrap gap-2">
              {(["dog", "cat", "fish", "bird", "all"] as const).map(pt => {
                const m = PET_META[pt];
                return (
                  <button key={pt} type="button" onClick={() => setForm(f => ({ ...f, petType: pt }))}
                    className={cn("flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm font-bold transition-all",
                      form.petType === pt ? "border-orange-500 bg-orange-50 text-orange-700" : "border-gray-200 text-gray-500 hover:border-orange-300 bg-white")}>
                    {m.emoji} {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Category</label>
            <div className="grid grid-cols-3 gap-2">
              {(["food", "toys", "grooming", "accessories", "medicine", "housing"] as const).map(cat => {
                const m = CAT_META[cat];
                return (
                  <button key={cat} type="button" onClick={() => setForm(f => ({ ...f, category: cat }))}
                    className={cn("flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 text-xs font-bold transition-all",
                      form.category === cat ? "border-orange-500 bg-orange-50 text-orange-700" : "border-gray-200 text-gray-500 hover:border-orange-200 bg-white")}>
                    {m.emoji} {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Product Name</label>
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Premium Dog Food — Chicken Flavour" className={inpCls(!!errors.name)} />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* Brand */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Brand / Shop Name</label>
            <input type="text" value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))}
              placeholder="e.g. Pedigree, Whiskas, My Pet Shop" className={inpCls(!!errors.brand)} />
            {errors.brand && <p className="text-xs text-red-500 mt-1">{errors.brand}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Description</label>
            <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Describe the product, its benefits, weight, ingredients, etc."
              className={cn(inpCls(!!errors.description), "resize-none")} />
            {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
          </div>

          {/* Price & Stock */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-1"><IndianRupee className="w-4 h-4 text-orange-500" /> Price (₹)</label>
              <input type="number" min="1" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                placeholder="e.g. 499" className={inpCls(!!errors.price)} />
              {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-1"><Package className="w-4 h-4 text-orange-500" /> Stock Qty</label>
              <input type="number" min="0" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                placeholder="e.g. 50" className={inpCls(!!errors.stock)} />
              {errors.stock && <p className="text-xs text-red-500 mt-1">{errors.stock}</p>}
            </div>
          </div>

          {/* Photo */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Product Photo (optional)</label>
            <input type="file" accept="image/*" onChange={handlePhotoUpload} className="w-full text-sm text-gray-600" />
            {uploading && <p className="text-xs text-blue-600 mt-1 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Uploading...</p>}
            {uploadError && <p className="text-xs text-red-500 mt-1">{uploadError}</p>}
            {form.image && (
              <div className="mt-2 relative w-24 h-24">
                <img src={form.image} alt="Preview" className="w-full h-full object-cover rounded-xl border border-gray-200" />
                <button type="button" onClick={() => setForm(f => ({ ...f, image: "" }))}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {serverError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{serverError}
            </div>
          )}

          <button type="submit" disabled={loading || uploading} className="gradient-btn w-full py-4 rounded-2xl font-black text-white text-base flex items-center justify-center gap-2 shadow-lg shadow-orange-200">
            {loading
              ? <><Loader2 className="w-5 h-5 animate-spin" />{editProduct ? "Updating..." : "Listing..."}</>
              : <><StoreIcon className="w-5 h-5" />{editProduct ? "Update Product" : "List Product"}</>}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ─── Main Store Page ────────────────────────────────────────────────────── */
export default function Store() {
  const { user, isLoaded } = useUser();

  const [tab,       setTab]       = useState<Tab>("shop");
  const [products,  setProducts]  = useState<Product[]>([]);
  const [myListings, setMyListings] = useState<Product[]>([]);
  const [orders,    setOrders]    = useState<Order[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  const [cart,      setCart]      = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [cartOpen,  setCartOpen]  = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const [petFilter, setPetFilter] = useState<PetFilter>("all");
  const [catFilter, setCatFilter] = useState<CatFilter>("all");
  const [sortBy,    setSortBy]    = useState<SortBy>("createdAt");
  const [search,    setSearch]    = useState("");

  const [showProductForm, setShowProductForm] = useState(false);
  const [editProduct,     setEditProduct]     = useState<Product | undefined>();
  const [showCheckout,    setShowCheckout]    = useState(false);
  const [orderSuccess,    setOrderSuccess]    = useState<Order | null>(null);

  /* ── Fetch products ── */
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ sortBy });
      if (petFilter !== "all") params.set("petType", petFilter);
      if (catFilter !== "all") params.set("category", catFilter);
      if (search.trim())       params.set("search",   search.trim());
      const res = await fetch(`${API}/products?${params}`);
      if (!res.ok) throw new Error("Failed to fetch products");
      setProducts(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [petFilter, catFilter, sortBy, search]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  /* ── Fetch my listings ── */
  const fetchMyListings = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${API}/products?sellerId=${user.id}`);
      if (res.ok) setMyListings(await res.json());
    } catch {}
  }, [user?.id]);

  useEffect(() => { if (tab === "sell") fetchMyListings(); }, [tab, fetchMyListings]);

  /* ── Fetch orders ── */
  const fetchOrders = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${API}/orders?buyerId=${user.id}`);
      if (res.ok) setOrders(await res.json());
    } catch {}
  }, [user?.id]);

  useEffect(() => { if (tab === "orders") fetchOrders(); }, [tab, fetchOrders]);

  /* ── Cart helpers ── */
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(i => i.id !== id));
  const updateQty = (id: string, qty: number) => {
    if (qty <= 0) return removeFromCart(id);
    setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i));
  };

  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  /* ── Place order ── */
  const handlePlaceOrder = async (address: string, phone: string) => {
    if (!user) return;
    const res = await fetch(`${API}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        buyerId:    user.id,
        buyerName:  user.fullName || user.firstName || "Customer",
        buyerEmail: user.emailAddresses?.[0]?.emailAddress || "",
        items: cart.map(i => ({
          productId:  i.id,
          name:       i.name,
          price:      i.price,
          quantity:   i.quantity,
          image:      i.image,
          sellerName: i.sellerName,
        })),
        address,
        phone,
      }),
    });
    if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
    const order = await res.json();
    setOrderSuccess(order);
    setCart([]);
    setShowCheckout(false);
    setTab("orders");
    fetchOrders();
    fetchProducts(); // refresh stock
  };

  /* ── Product CRUD ── */
  const handleProductSaved = (p: Product) => {
    setShowProductForm(false);
    setEditProduct(undefined);
    fetchMyListings();
    fetchProducts();
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!confirm(`Delete "${product.name}"?`)) return;
    try {
      await fetch(`${API}/products/${product.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sellerId: user?.id }),
      });
      fetchMyListings();
      fetchProducts();
    } catch {}
  };

  const toggleFavorite = (id: string) =>
    setFavorites(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const inCart = (id: string) => cart.some(i => i.id === id);

  return (
    <>
      <style>{STYLES}</style>
      <div className="st-root min-h-screen bg-[#FAFAF7]">
        <Header />

        {/* Modals */}
        {showProductForm && isLoaded && user && (
          <ProductFormModal
            onClose={() => { setShowProductForm(false); setEditProduct(undefined); }}
            onSaved={handleProductSaved}
            user={user}
            editProduct={editProduct}
          />
        )}
        {showCheckout && user && (
          <CheckoutModal
            cart={cart}
            onClose={() => setShowCheckout(false)}
            onConfirm={handlePlaceOrder}
            user={user}
          />
        )}

        {/* ── HERO ── */}
        <section className="relative overflow-hidden bg-gradient-to-br from-orange-600 via-orange-500 to-amber-400">
          <div className="absolute inset-0 opacity-[.06]" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
          <div className="absolute -top-16 -right-16 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-14 relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
              <div className="text-white">
                <div className="flex items-center gap-2 mb-3 text-white/70 text-xs font-bold uppercase tracking-widest">
                  <StoreIcon className="w-4 h-4" /> PetMatch Marketplace
                </div>
                <h1 className="st-display text-5xl sm:text-6xl font-black leading-tight mb-3">
                  Pet Store.<br />
                  <em className="not-italic text-amber-200">India's Own.</em>
                </h1>
                <p className="text-white/70 max-w-md text-base leading-relaxed mb-6">
                  Buy & sell pet products for dogs, cats, fish and birds — all prices in ₹ INR.
                </p>

                {/* Tab bar */}
                <div className="flex gap-2 flex-wrap">
                  {([
                    { id: "shop",   label: "Shop",      emoji: "🛒" },
                    { id: "sell",   label: "Sell",      emoji: "🏪" },
                    { id: "orders", label: "My Orders",  emoji: "📦" },
                  ] as const).map(({ id, label, emoji }) => (
                    <button key={id} onClick={() => setTab(id)}
                      className={cn("flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold border-2 transition-all",
                        tab === id ? "bg-white text-orange-600 border-white" : "bg-white/15 text-white border-white/30 hover:bg-white/25")}>
                      {emoji} {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-3">
                {[
                  { label: "Products",   value: products.length || "500+" },
                  { label: "In Cart",    value: cartCount },
                  { label: "Favourites", value: favorites.size },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-2xl px-5 py-4 text-white text-center min-w-[80px]">
                    <p className="st-display text-2xl font-black">{value}</p>
                    <p className="text-[10px] text-white/60 font-bold uppercase tracking-wider mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 28" preserveAspectRatio="none">
            <path d="M0,28 C480,0 960,0 1440,28 L1440,28 L0,28 Z" fill="#FAFAF7" />
          </svg>
        </section>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* ═══ SHOP TAB ═══ */}
          {tab === "shop" && (
            <div className="grid lg:grid-cols-[260px,1fr] gap-8 items-start">

              {/* Sidebar */}
              <aside className="lg:sticky lg:top-24 space-y-4">

                {/* Cart widget */}
                {cartCount > 0 && (
                  <div className="bg-white rounded-2xl border border-orange-100 shadow-sm p-4 st-pop">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5 text-orange-500" />
                        <span className="font-bold text-gray-900">Cart ({cartCount})</span>
                      </div>
                      <span className="st-display font-bold text-orange-600">{INR(cartTotal)}</span>
                    </div>
                    <div className="space-y-2 max-h-52 overflow-y-auto st-scroll mb-3">
                      {cart.map(item => (
                        <div key={item.id} className="flex items-center gap-2 text-sm">
                          <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center text-lg flex-shrink-0">
                            {item.image ? <img src={item.image} className="w-full h-full object-cover rounded-lg" alt="" /> : CAT_META[item.category]?.emoji}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate text-xs">{item.name}</p>
                            <p className="text-orange-600 font-bold text-xs">{INR(item.price)}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={() => updateQty(item.id, item.quantity - 1)} className="w-5 h-5 rounded bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-bold hover:bg-gray-200">−</button>
                            <span className="w-5 text-center text-xs font-bold">{item.quantity}</span>
                            <button onClick={() => updateQty(item.id, item.quantity + 1)} disabled={item.quantity >= item.stock}
                              className="w-5 h-5 rounded bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-bold hover:bg-gray-200 disabled:opacity-40">+</button>
                            <button onClick={() => removeFromCart(item.id)} className="w-5 h-5 rounded bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-100 ml-1">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => user ? setShowCheckout(true) : alert("Please sign in to checkout")}
                      className="gradient-btn w-full py-3 rounded-xl font-black text-white flex items-center justify-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4" /> Checkout · {INR(cartTotal)}
                    </button>
                  </div>
                )}

                {/* Pet type filter */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Pet Type</p>
                  <div className="space-y-1.5">
                    {(["all", "dog", "cat", "fish", "bird"] as PetFilter[]).map(pt => {
                      const m = PET_META[pt];
                      return (
                        <button key={pt} onClick={() => setPetFilter(pt)}
                          className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all",
                            petFilter === pt ? "bg-orange-500 text-white" : "text-gray-600 hover:bg-orange-50 hover:text-orange-600")}>
                          <span className="text-lg">{m.emoji}</span>{m.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Category filter */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Category</p>
                  <div className="space-y-1.5">
                    {(["all", "food", "toys", "grooming", "accessories", "medicine", "housing"] as CatFilter[]).map(cat => {
                      const m = CAT_META[cat];
                      return (
                        <button key={cat} onClick={() => setCatFilter(cat)}
                          className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all",
                            catFilter === cat ? "bg-orange-500 text-white" : "text-gray-600 hover:bg-orange-50 hover:text-orange-600")}>
                          <span>{m.emoji}</span>{m.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Info */}
                <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 text-sm space-y-2">
                  <div className="flex items-center gap-2 text-orange-700 font-semibold"><Truck className="w-4 h-4" /> Free delivery on ₹999+</div>
                  <div className="flex items-center gap-2 text-orange-700 font-semibold"><RotateCcw className="w-4 h-4" /> 7-day easy returns</div>
                  <div className="flex items-center gap-2 text-orange-700 font-semibold"><ShieldCheck className="w-4 h-4" /> Verified sellers only</div>
                </div>
              </aside>

              {/* Products grid */}
              <div>
                {/* Search + Sort bar */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" placeholder="Search products, brands…" value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400" />
                  </div>
                  <select value={sortBy} onChange={e => setSortBy(e.target.value as SortBy)}
                    className="px-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:outline-none font-semibold text-gray-700">
                    {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>

                {/* Active filters */}
                {(petFilter !== "all" || catFilter !== "all" || search) && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {petFilter !== "all" && (
                      <span className="flex items-center gap-1.5 bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1.5 rounded-full">
                        {PET_META[petFilter].emoji} {PET_META[petFilter].label}
                        <button onClick={() => setPetFilter("all")}><X className="w-3 h-3" /></button>
                      </span>
                    )}
                    {catFilter !== "all" && (
                      <span className="flex items-center gap-1.5 bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1.5 rounded-full">
                        {CAT_META[catFilter].emoji} {CAT_META[catFilter].label}
                        <button onClick={() => setCatFilter("all")}><X className="w-3 h-3" /></button>
                      </span>
                    )}
                    {search && (
                      <span className="flex items-center gap-1.5 bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1.5 rounded-full">
                        🔍 "{search}"
                        <button onClick={() => setSearch("")}><X className="w-3 h-3" /></button>
                      </span>
                    )}
                    <button onClick={() => { setPetFilter("all"); setCatFilter("all"); setSearch(""); }}
                      className="text-xs text-gray-400 hover:text-red-500 font-bold px-2 py-1.5 rounded-full hover:bg-red-50 transition-colors">
                      Clear all
                    </button>
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-center gap-3 mb-6">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold text-red-700">{error}</p>
                    </div>
                    <button onClick={fetchProducts} className="flex items-center gap-1 text-sm font-bold text-red-600 hover:text-red-700">
                      <RefreshCw className="w-3.5 h-3.5" /> Retry
                    </button>
                  </div>
                )}

                {loading ? (
                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                    {[1,2,3,4,5,6].map(i => <ProductSkeleton key={i} />)}
                  </div>
                ) : products.length === 0 ? (
                  <div className="bg-white rounded-3xl p-16 text-center border border-gray-100 shadow-sm">
                    <div className="text-6xl mb-4">🛍️</div>
                    <h3 className="st-display text-2xl font-black text-gray-900 mb-2">No products found</h3>
                    <p className="text-gray-500 mb-6">Try adjusting your filters or be the first to list a product!</p>
                    <button onClick={() => setTab("sell")}
                      className="gradient-btn px-8 py-3 rounded-2xl font-black text-white inline-flex items-center gap-2">
                      <Plus className="w-5 h-5" /> List a Product
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-gray-500 mb-4 font-semibold">
                      <span className="font-black text-gray-900">{products.length}</span> product{products.length !== 1 ? "s" : ""} found
                    </p>
                    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                      {products.map((p, i) => (
                        <div key={p.id} className="st-up" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
                          <ProductCard
                            product={p}
                            isFavorite={favorites.has(p.id)}
                            inCart={inCart(p.id)}
                            onAddCart={() => addToCart(p)}
                            onFavorite={() => toggleFavorite(p.id)}
                            isOwn={user?.id === p.sellerId}
                            onEdit={() => { setEditProduct(p); setShowProductForm(true); }}
                            onDelete={() => handleDeleteProduct(p)}
                          />
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ═══ SELL TAB ═══ */}
          {tab === "sell" && (
            <div className="max-w-4xl mx-auto st-up">
              {!user ? (
                <div className="bg-white rounded-3xl p-16 text-center border border-gray-100 shadow-sm">
                  <div className="text-6xl mb-4">🏪</div>
                  <h3 className="st-display text-2xl font-black text-gray-900 mb-2">Become a Seller</h3>
                  <p className="text-gray-500 mb-6">Sign in to list your pet products on PetMatch Store</p>
                  <a href="/signin" className="gradient-btn inline-flex px-8 py-3 rounded-2xl font-black text-white items-center gap-2">
                    <LogIn className="w-5 h-5" /> Sign In to Sell
                  </a>
                </div>
              ) : (
                <>
                  {/* Seller Hero */}
                  <div className="relative overflow-hidden bg-gradient-to-r from-orange-500 to-amber-400 rounded-3xl p-8 mb-8 text-white">
                    <div className="absolute -top-8 -right-8 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
                    <div className="relative flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2 mb-2 opacity-75 text-xs font-bold uppercase tracking-widest">
                          <StoreIcon className="w-4 h-4" /> Seller Dashboard
                        </div>
                        <h2 className="st-display text-3xl font-black mb-1">
                          Welcome, {user.firstName || "Seller"}!
                        </h2>
                        <p className="text-white/75 text-sm">
                          {myListings.length} listing{myListings.length !== 1 ? "s" : ""} active
                        </p>
                      </div>
                      <button onClick={() => { setEditProduct(undefined); setShowProductForm(true); }}
                        className="flex items-center gap-2 bg-white text-orange-600 font-black px-6 py-3 rounded-2xl hover:bg-orange-50 transition-colors shadow-lg text-sm">
                        <Plus className="w-5 h-5" /> List New Product
                      </button>
                    </div>
                  </div>

                  {/* Benefits */}
                  <div className="grid sm:grid-cols-3 gap-4 mb-8">
                    {[
                      { icon: IndianRupee, title: "₹ INR Pricing", desc: "All prices in Indian Rupees" },
                      { icon: Truck,            title: "Reach Lakhs",   desc: "Pet owners across India" },
                      { icon: ShieldCheck,      title: "Verified",      desc: "Trusted marketplace" },
                    ].map(({ icon: Icon, title, desc }) => (
                      <div key={title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
                        <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-orange-500" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{title}</p>
                          <p className="text-sm text-gray-500">{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* My listings */}
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="st-display text-2xl font-black text-gray-900">My Listings</h3>
                    <button onClick={fetchMyListings} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-orange-500 font-semibold transition-colors">
                      <RefreshCw className="w-3.5 h-3.5" /> Refresh
                    </button>
                  </div>

                  {myListings.length === 0 ? (
                    <div className="bg-white rounded-3xl border-2 border-dashed border-orange-200 p-12 text-center">
                      <div className="text-5xl mb-4">📦</div>
                      <p className="font-bold text-gray-800 mb-2">No listings yet</p>
                      <p className="text-gray-500 text-sm mb-6">Click "List New Product" to start selling!</p>
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-5">
                      {myListings.map(p => (
                        <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex gap-4 p-4">
                          <div className="w-20 h-20 bg-orange-50 rounded-xl flex items-center justify-center text-4xl flex-shrink-0 overflow-hidden">
                            {p.image ? <img src={p.image} className="w-full h-full object-cover" alt="" /> : CAT_META[p.category]?.emoji}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 truncate">{p.name}</p>
                            <p className="text-xs text-gray-500 mb-1">{p.brand} · {PET_META[p.petType]?.emoji} {CAT_META[p.category]?.label}</p>
                            <div className="flex items-center gap-3">
                              <p className="st-display font-bold text-orange-600 text-lg">{INR(p.price)}</p>
                              <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", p.stock > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                                {p.stock > 0 ? `${p.stock} in stock` : "Out of stock"}
                              </span>
                            </div>
                            <div className="flex gap-2 mt-2">
                              <button onClick={() => { setEditProduct(p); setShowProductForm(true); }}
                                className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg hover:bg-blue-100 transition-colors">
                                <Pencil className="w-3 h-3" /> Edit
                              </button>
                              <button onClick={() => handleDeleteProduct(p)}
                                className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-lg hover:bg-red-100 transition-colors">
                                <Trash2 className="w-3 h-3" /> Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ═══ ORDERS TAB ═══ */}
          {tab === "orders" && (
            <div className="max-w-3xl mx-auto st-up">
              {!user ? (
                <div className="bg-white rounded-3xl p-16 text-center border border-gray-100 shadow-sm">
                  <div className="text-6xl mb-4">📦</div>
                  <h3 className="st-display text-2xl font-black text-gray-900 mb-2">Your Orders</h3>
                  <p className="text-gray-500 mb-6">Sign in to view your order history</p>
                  <a href="/signin" className="gradient-btn inline-flex px-8 py-3 rounded-2xl font-black text-white items-center gap-2">
                    <LogIn className="w-5 h-5" /> Sign In
                  </a>
                </div>
              ) : (
                <>
                  {/* Success banner */}
                  {orderSuccess && (
                    <div className="bg-green-50 border border-green-200 rounded-2xl p-5 flex items-start gap-4 mb-6 st-pop">
                      <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-green-800">Order Placed Successfully! 🎉</p>
                        <p className="text-sm text-green-600 mt-0.5">Order #{orderSuccess.id.slice(-8).toUpperCase()} · {INR(orderSuccess.totalAmount)}</p>
                      </div>
                      <button onClick={() => setOrderSuccess(null)} className="ml-auto text-green-400 hover:text-green-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-6">
                    <h2 className="st-display text-2xl font-black text-gray-900">My Orders</h2>
                    <button onClick={fetchOrders} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-orange-500 font-semibold">
                      <RefreshCw className="w-3.5 h-3.5" /> Refresh
                    </button>
                  </div>

                  {orders.length === 0 ? (
                    <div className="bg-white rounded-3xl border-2 border-dashed border-orange-200 p-12 text-center">
                      <div className="text-5xl mb-4">🛒</div>
                      <p className="font-bold text-gray-800 mb-2">No orders yet</p>
                      <p className="text-gray-500 text-sm mb-6">Start shopping for your pet!</p>
                      <button onClick={() => setTab("shop")} className="gradient-btn inline-flex px-8 py-3 rounded-2xl font-black text-white items-center gap-2">
                        <ShoppingCart className="w-5 h-5" /> Shop Now
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map(order => {
                        const status = STATUS_META[order.status] || STATUS_META.confirmed;
                        return (
                          <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
                              <div>
                                <p className="font-black text-gray-900 text-sm">Order #{order.id.slice(-8).toUpperCase()}</p>
                                <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {new Date(order.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={cn("text-xs font-bold px-3 py-1.5 rounded-full border", status.color)}>{status.label}</span>
                                <span className="st-display font-bold text-orange-600 text-lg">{INR(order.totalAmount)}</span>
                              </div>
                            </div>
                            <div className="px-5 py-4 space-y-2">
                              {order.items.map((item, i) => (
                                <div key={i} className="flex items-center gap-3 text-sm">
                                  <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center text-xl flex-shrink-0 overflow-hidden">
                                    {item.image ? <img src={item.image} className="w-full h-full object-cover rounded-lg" alt="" /> : "📦"}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-900 truncate">{item.name}</p>
                                    <p className="text-xs text-gray-500">by {item.sellerName} · Qty: {item.quantity}</p>
                                  </div>
                                  <p className="font-bold text-gray-900">{INR(item.price * item.quantity)}</p>
                                </div>
                              ))}
                            </div>
                            {order.address && (
                              <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-500">
                                <MapPin className="w-3.5 h-3.5 text-orange-400" /> {order.address}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
