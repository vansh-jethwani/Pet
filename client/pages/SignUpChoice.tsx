import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Outfit:wght@300;400;500;600;700&display=swap');

  .sc-root { font-family: 'Outfit', sans-serif; }
  .sc-display { font-family: 'Playfair Display', Georgia, serif; }

  @keyframes sc-fade-up {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes sc-scale-in {
    from { opacity: 0; transform: scale(0.92); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes sc-shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  @keyframes sc-float {
    0%, 100% { transform: translateY(0px) rotate(-2deg); }
    50%       { transform: translateY(-8px) rotate(2deg); }
  }
  @keyframes sc-pulse-soft {
    0%, 100% { opacity: 0.6; transform: scale(1); }
    50%       { opacity: 1;   transform: scale(1.05); }
  }
  @keyframes sc-blob {
    0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
    50%       { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
  }

  .sc-fade-up   { animation: sc-fade-up   0.6s cubic-bezier(.34,1.56,.64,1) both; }
  .sc-scale-in  { animation: sc-scale-in  0.4s cubic-bezier(.34,1.56,.64,1) both; }
  .sc-float     { animation: sc-float 6s ease-in-out infinite; }
  .sc-pulse     { animation: sc-pulse-soft 3s ease-in-out infinite; }
  .sc-blob      { animation: sc-blob 8s ease-in-out infinite; }

  .sc-shimmer-text {
    background: linear-gradient(90deg, #ea580c 0%, #f97316 30%, #fbbf24 50%, #f97316 70%, #ea580c 100%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: sc-shimmer 3s linear infinite;
  }

  .sc-card {
    position: relative;
    cursor: pointer;
    transition: transform 0.3s cubic-bezier(.34,1.56,.64,1), box-shadow 0.3s ease;
  }
  .sc-card:hover {
    transform: translateY(-8px) scale(1.02);
  }
  .sc-card.selected {
    transform: translateY(-10px) scale(1.03);
  }
  .sc-card::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    opacity: 0;
    transition: opacity 0.3s ease;
    background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 60%);
    pointer-events: none;
  }
  .sc-card:hover::before, .sc-card.selected::before { opacity: 1; }

  .sc-noise {
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
    pointer-events: none;
    position: absolute;
    inset: 0;
    border-radius: inherit;
  }
`;

const roles = [
  {
    id: "pet-owner",
    emoji: "🐾",
    title: "Pet Owner",
    subtitle: "Looking for matches, vets & community",
    description: "Breed, adopt, host, and connect your pet with the best care and community.",
    gradient: "from-orange-400 via-orange-500 to-amber-500",
    bg: "from-orange-50 to-amber-50",
    border: "border-orange-200",
    selectedBorder: "border-orange-500",
    accent: "#ea580c",
    features: ["Pet Companion", "Adopt a Pet", "Vet Consultations", "Community Forum"],
    href: "/signup/owner",
    delay: "0ms",
  },
  {
    id: "vet",
    emoji: "🩺",
    title: "Veterinarian",
    subtitle: "Offer consultations & build your practice",
    description: "Connect with pet owners, offer video/phone/in-person consults and grow your clientele.",
    gradient: "from-red-500 via-rose-500 to-pink-500",
    bg: "from-red-50 to-rose-50",
    border: "border-red-200",
    selectedBorder: "border-red-500",
    accent: "#ef4444",
    features: ["Online Consultations", "Booking Management", "Verified Profile", "Direct Payments"],
    href: "/vet-signup",
    delay: "80ms",
  },
  {
    id: "pet-seller",
    emoji: "🏷️",
    title: "Pet Seller",
    subtitle: "List & sell pets through the Marketplace",
    description: "Create verified listings, connect with serious buyers and manage your sales professionally.",
    gradient: "from-blue-500 via-cyan-500 to-sky-500",
    bg: "from-blue-50 to-cyan-50",
    border: "border-blue-200",
    selectedBorder: "border-blue-500",
    accent: "#3b82f6",
    features: ["Marketplace Listings", "Buyer Messaging", "Verified Seller Badge", "Analytics"],
    href: "/seller-signup",
    delay: "160ms",
  },
  {
    id: "shopkeeper",
    emoji: "🛍️",
    title: "Shop Owner",
    subtitle: "Sell pet food, toys & accessories",
    description: "List your pet store products, manage inventory and reach thousands of pet owners.",
    gradient: "from-emerald-500 via-green-500 to-teal-500",
    bg: "from-emerald-50 to-green-50",
    border: "border-emerald-200",
    selectedBorder: "border-emerald-500",
    accent: "#10b981",
    features: ["Product Listings", "Order Management", "Store Dashboard", "Promotions"],
    href: "/shop-signup",
    delay: "240ms",
  },
];

export default function SignUpChoice() {
  const [selected, setSelected] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSelect = (role: typeof roles[0]) => {
    setSelected(role.id);
    setTimeout(() => navigate(role.href), 350);
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="sc-root min-h-screen bg-[#fafaf8] relative overflow-hidden">

        {/* Decorative blobs */}
        <div className="sc-blob absolute -top-32 -left-32 w-96 h-96 bg-orange-200/30 blur-3xl" />
        <div className="sc-blob absolute -bottom-32 -right-32 w-96 h-96 bg-amber-200/25 blur-3xl" style={{ animationDelay: "4s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-radial from-orange-100/20 to-transparent blur-3xl pointer-events-none" />

        {/* Dot grid pattern */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: "radial-gradient(circle, #d4d4d4 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          opacity: 0.4,
        }} />

        {/* Header */}
        <header className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-400 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200 group-hover:shadow-xl transition-shadow">
              <Heart className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="sc-display text-xl font-bold text-gray-900">PetMatch</span>
          </Link>
          <p className="text-sm text-gray-500">
            Already have an account?{" "}
            <Link to="/signin" className="text-orange-600 font-semibold hover:text-orange-700 transition-colors">
              Sign in
            </Link>
          </p>
        </header>

        {/* Hero */}
        <div className="relative z-10 text-center px-4 pt-8 pb-12 sc-fade-up">
          <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-6 border border-orange-200">
            <span className="sc-pulse inline-block w-2 h-2 rounded-full bg-orange-500" />
            Create your account
          </div>
          <h1 className="sc-display text-5xl sm:text-6xl font-black text-gray-900 mb-4 leading-tight">
            Who are you<br />
            <span className="sc-shimmer-text">joining as?</span>
          </h1>
          <p className="text-gray-500 text-lg max-w-md mx-auto font-light">
            Choose your role to get a tailored experience built just for you.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 pb-20">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {roles.map((role) => (
              <div
                key={role.id}
                className={`sc-card sc-scale-in rounded-3xl border-2 overflow-hidden bg-white shadow-sm hover:shadow-xl ${
                  selected === role.id ? `${role.selectedBorder} shadow-xl` : role.border
                }`}
                style={{ animationDelay: role.delay }}
                onClick={() => handleSelect(role)}
              >
                <div className="sc-noise" />

                {/* Gradient top strip */}
                <div className={`h-2 bg-gradient-to-r ${role.gradient}`} />

                <div className={`p-6 bg-gradient-to-br ${role.bg} relative`}>
                  {/* Floating emoji */}
                  <div className="sc-float text-5xl mb-4 inline-block" style={{ animationDelay: role.delay }}>
                    {role.emoji}
                  </div>

                  <h3 className="sc-display text-2xl font-black text-gray-900 mb-1">
                    {role.title}
                  </h3>
                  <p className="text-sm font-semibold mb-3" style={{ color: role.accent }}>
                    {role.subtitle}
                  </p>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    {role.description}
                  </p>
                </div>

                <div className="p-5 pt-4 bg-white">
                  <ul className="space-y-2 mb-5">
                    {role.features.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm text-gray-600">
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: role.accent + "20" }}
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ color: role.accent }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button
                    className={`w-full py-3 rounded-2xl font-bold text-white text-sm transition-all bg-gradient-to-r ${role.gradient} hover:opacity-90 shadow-sm flex items-center justify-center gap-2`}
                    onClick={(e) => { e.stopPropagation(); handleSelect(role); }}
                  >
                    {selected === role.id ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
                        </svg>
                        Redirecting…
                      </>
                    ) : (
                      <>Join as {role.title} →</>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom note */}
          <p className="text-center text-xs text-gray-400 mt-10 font-light">
            You can always switch or add roles later from your dashboard.
          </p>
        </div>
      </div>
    </>
  );
}
