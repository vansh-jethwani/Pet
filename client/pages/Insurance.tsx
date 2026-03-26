import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/clerk-react";
import Header from "@/components/Header";
import { cn } from "@/lib/utils";
import {
  Shield, Heart, Award, Check, ChevronDown, ChevronUp,
  Loader2, AlertCircle, X, FileText, Plus, RefreshCw,
  Clock, Zap, Users, Star, ArrowRight, PawPrint,
  BadgeCheck, Sparkles, ReceiptText, Ban,
} from "lucide-react";

/* ─── Types ────────────────────────────────────────────────────────────────── */
interface Plan {
  planId: string;
  name: string;
  tier: "basic" | "premium" | "elite";
  monthlyPrice: number;
  annualPrice: number;
  coverageLimit: number;
  deductible: number;
  features: string[];
  description: string;
}

interface Policy {
  id: string;
  planId: string;
  planName: string;
  planTier: string;
  petName: string;
  petType: string;
  petBreed: string;
  petAge: number;
  petGender: string;
  billingCycle: string;
  price: number;
  coverageLimit: number;
  deductible: number;
  status: "active" | "pending" | "expired" | "cancelled";
  startDate: string;
  endDate: string;
  policyNumber: string;
  ownerName: string;
  ownerEmail: string;
}

interface Claim {
  id: string;
  policyId: string;
  policyNumber: string;
  petName: string;
  claimType: string;
  description: string;
  amount: number;
  status: "pending" | "under_review" | "approved" | "rejected";
  submittedAt: string;
  notes: string;
}

/* ─── Styles ───────────────────────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap');

  .ins-serif { font-family: 'Playfair Display', Georgia, serif; }
  .ins-body  { font-family: 'DM Sans', system-ui, sans-serif; }

  @keyframes ins-fade-up   { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes ins-pop       { 0%{transform:scale(.93);opacity:0} 70%{transform:scale(1.02)} 100%{transform:scale(1);opacity:1} }
  @keyframes ins-shimmer   { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
  @keyframes ins-badge     { 0%{transform:scale(0) rotate(-10deg);opacity:0} 70%{transform:scale(1.1) rotate(2deg)} 100%{transform:scale(1) rotate(0);opacity:1} }
  @keyframes ins-float     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
  @keyframes ins-pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.85)} }

  .ins-fade-up  { animation: ins-fade-up .5s cubic-bezier(.34,1.56,.64,1) both; }
  .ins-pop      { animation: ins-pop .4s cubic-bezier(.34,1.56,.64,1) both; }
  .ins-badge    { animation: ins-badge .5s cubic-bezier(.34,1.56,.64,1) both; }
  .ins-float    { animation: ins-float 4s ease-in-out infinite; }
  .ins-pulse    { animation: ins-pulse-dot 2s ease-in-out infinite; }

  .ins-card-hover { transition: transform .2s ease, box-shadow .2s ease; }
  .ins-card-hover:hover { transform: translateY(-3px); box-shadow: 0 20px 40px -12px rgba(0,0,0,.18); }

  .ins-shimmer-btn {
    background: linear-gradient(90deg, #4f46e5 0%, #7c3aed 40%, #4f46e5 60%, #6d28d9 100%);
    background-size: 200% 100%;
    animation: ins-shimmer 2.4s linear infinite;
  }

  .ins-recommended-glow {
    box-shadow: 0 0 0 3px rgba(99,102,241,.5), 0 24px 48px -12px rgba(99,102,241,.35);
  }

  .ins-scroll::-webkit-scrollbar { width: 4px; }
  .ins-scroll::-webkit-scrollbar-thumb { background: #c7d2fe; border-radius: 99px; }

  .ins-plan-basic    { background: linear-gradient(135deg, #f0fdf4, #dcfce7); border-color: #bbf7d0; }
  .ins-plan-premium  { background: linear-gradient(135deg, #eef2ff, #e0e7ff); border-color: #a5b4fc; }
  .ins-plan-elite    { background: linear-gradient(135deg, #fdf4ff, #f3e8ff); border-color: #d8b4fe; }

  .ins-status-active    { background:#dcfce7; color:#166534; border-color:#86efac; }
  .ins-status-pending   { background:#fef9c3; color:#854d0e; border-color:#fde047; }
  .ins-status-expired   { background:#fee2e2; color:#991b1b; border-color:#fca5a5; }
  .ins-status-cancelled { background:#f3f4f6; color:#4b5563; border-color:#d1d5db; }

  .ins-claim-pending     { background:#fef3c7; color:#92400e; }
  .ins-claim-under_review{ background:#dbeafe; color:#1e40af; }
  .ins-claim-approved    { background:#d1fae5; color:#065f46; }
  .ins-claim-rejected    { background:#fee2e2; color:#991b1b; }
`;

const PLAN_ICONS = {
  basic:   Heart,
  premium: Shield,
  elite:   Award,
};

const PLAN_ACCENTS = {
  basic:   { text: "text-emerald-600", bg: "bg-emerald-500", light: "bg-emerald-50", border: "border-emerald-200", btn: "bg-emerald-500 hover:bg-emerald-600" },
  premium: { text: "text-indigo-600",  bg: "bg-indigo-500",  light: "bg-indigo-50",  border: "border-indigo-200",  btn: "bg-indigo-500 hover:bg-indigo-600"  },
  elite:   { text: "text-violet-600",  bg: "bg-violet-500",  light: "bg-violet-50",  border: "border-violet-200",  btn: "bg-violet-500 hover:bg-violet-600"  },
};

const CLAIM_TYPES = [
  "Accident / Injury",
  "Illness / Disease",
  "Surgery",
  "Hospitalization",
  "Diagnostic Tests",
  "Prescription Medication",
  "Dental Treatment",
  "Wellness Visit",
  "Emergency Care",
  "Other",
];

const PET_TYPES = ["Dog", "Cat", "Bird", "Rabbit", "Fish", "Reptile", "Other"];
const FAQS = [
  { q: "What's the process to get coverage?", a: "Choose a plan, fill out your pet's health information, and you'll be covered instantly. No waiting period for accidents." },
  { q: "Are pre-existing conditions covered?", a: "Pre-existing conditions are not covered. However, our Premium and Elite plans cover hereditary and chronic conditions after the waiting period." },
  { q: "Can I choose my own veterinarian?", a: "Yes! Visit any licensed vet. Submit your receipt and we'll reimburse you within 5–7 business days." },
  { q: "What's the claims process?", a: "Submit claims online through this portal. Upload your vet receipt and we'll process it immediately. Most claims are approved within 24 hours." },
  { q: "Is there a maximum age limit for pets?", a: "No! We accept pets of all ages. Coverage for pets over 10 years may have different terms — contact us for details." },
  { q: "How do I cancel my policy?", a: "You can cancel anytime from your policy dashboard. Pro-rated refunds are available for annual plans cancelled within 30 days." },
];

/* ─── Main Component ────────────────────────────────────────────────────────── */
export default function Insurance() {
  const { user } = useUser();
  const clerkId = user?.id ?? "";

  const [tab, setTab] = useState<"plans" | "my-policies" | "claims">("plans");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Plans
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState<string | null>(null);

  // Policies
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [policiesLoading, setPoliciesLoading] = useState(false);

  // Claims
  const [claims, setClaims] = useState<Claim[]>([]);
  const [claimsLoading, setClaimsLoading] = useState(false);

  // Modals
  const [buyModal, setBuyModal] = useState<Plan | null>(null);
  const [claimModal, setClaimModal] = useState<Policy | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  /* ── Fetch plans ── */
  const fetchPlans = useCallback(async () => {
    setPlansLoading(true);
    setPlansError(null);
    try {
      const res = await fetch("/api/insurance/plans");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setPlans(await res.json());
    } catch (e: any) {
      setPlansError(e.message || "Failed to load plans");
    } finally {
      setPlansLoading(false);
    }
  }, []);

  /* ── Fetch policies ── */
  const fetchPolicies = useCallback(async () => {
    if (!clerkId) return;
    setPoliciesLoading(true);
    try {
      const res = await fetch(`/api/insurance/policies?clerkId=${encodeURIComponent(clerkId)}`);
      if (!res.ok) throw new Error();
      setPolicies(await res.json());
    } catch {
      /* silent */
    } finally {
      setPoliciesLoading(false);
    }
  }, [clerkId]);

  /* ── Fetch claims ── */
  const fetchClaims = useCallback(async () => {
    if (!clerkId) return;
    setClaimsLoading(true);
    try {
      const res = await fetch(`/api/insurance/claims?clerkId=${encodeURIComponent(clerkId)}`);
      if (!res.ok) throw new Error();
      setClaims(await res.json());
    } catch {
      /* silent */
    } finally {
      setClaimsLoading(false);
    }
  }, [clerkId]);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);
  useEffect(() => { if (tab === "my-policies") fetchPolicies(); }, [tab, fetchPolicies]);
  useEffect(() => { if (tab === "claims") fetchClaims(); }, [tab, fetchClaims]);

  /* ── Cancel policy ── */
  const cancelPolicy = async (id: string) => {
    if (!window.confirm("Are you sure you want to cancel this policy? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/insurance/policies/${id}/cancel`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clerkId }),
      });
      if (!res.ok) throw new Error();
      await fetchPolicies();
      showSuccess("Policy cancelled successfully.");
    } catch {
      alert("Failed to cancel policy. Please try again.");
    }
  };

  /* ── Renew policy ── */
  const renewPolicy = async (id: string) => {
    try {
      const res = await fetch(`/api/insurance/policies/${id}/renew`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clerkId }),
      });
      if (!res.ok) throw new Error();
      await fetchPolicies();
      showSuccess("Policy renewed for another year!");
    } catch {
      alert("Failed to renew policy.");
    }
  };

  const activePolicies = policies.filter(p => p.status === "active");

  return (
    <>
      <style>{STYLES}</style>
      <div className="ins-body min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20">
        <Header />

        {/* ── Success Toast ── */}
        {successMsg && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 ins-pop">
            <div className="flex items-center gap-3 bg-emerald-500 text-white px-5 py-3 rounded-2xl shadow-2xl font-semibold text-sm">
              <Check className="w-4 h-4" />
              {successMsg}
            </div>
          </div>
        )}

        {/* ── Nav Tabs ── */}
        <div className="sticky top-[65px] z-30 bg-white/90 backdrop-blur-md border-b border-indigo-100/60">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex gap-1 py-2.5 overflow-x-auto">
            {([
              { id: "plans",       label: "Insurance Plans", icon: Shield },
              { id: "my-policies", label: user ? `My Policies (${policies.length})` : "My Policies", icon: FileText },
              { id: "claims",      label: user ? `Claims (${claims.length})` : "Claims", icon: ReceiptText },
            ] as const).map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all",
                  tab === t.id
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200"
                    : "text-gray-500 hover:bg-indigo-50 hover:text-indigo-600"
                )}
              >
                <t.icon className="w-4 h-4" />
                {tab === t.id && t.id === "my-policies" ? `My Policies (${policies.length})` :
                 tab === t.id && t.id === "claims" ? `Claims (${claims.length})` : t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">

          {/* ══════════════════════ PLANS TAB ══════════════════════ */}
          {tab === "plans" && (
            <div className="space-y-10">

              {/* Billing toggle */}
              <div className="text-center">
                <h2 className="ins-serif text-3xl sm:text-4xl font-black text-gray-900 mb-3">Choose Your Plan</h2>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">Transparent pricing with no hidden fees. Cancel anytime.</p>
                <div className="inline-flex items-center gap-1 bg-gray-100 rounded-2xl p-1">
                  {(["monthly", "annual"] as const).map(cycle => (
                    <button
                      key={cycle}
                      onClick={() => setBillingCycle(cycle)}
                      className={cn(
                        "px-5 py-2.5 rounded-xl text-sm font-bold transition-all",
                        billingCycle === cycle
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-gray-500 hover:text-gray-700"
                      )}
                    >
                      {cycle === "monthly" ? "Monthly" : "Annual (Save 17%)"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Plan Cards */}
              {plansLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                  <p className="text-sm">Loading plans…</p>
                </div>
              ) : plansError ? (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
                  <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                  <p className="text-red-600 font-semibold">{plansError}</p>
                  <button onClick={fetchPlans} className="mt-4 flex items-center gap-1.5 text-sm text-red-500 mx-auto hover:text-red-700">
                    <RefreshCw className="w-3.5 h-3.5" /> Retry
                  </button>
                </div>
              ) : (
                <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
                  {plans.map((plan, i) => {
                    const isPremium = plan.tier === "premium";
                    const Icon = PLAN_ICONS[plan.tier];
                    const accent = PLAN_ACCENTS[plan.tier];
                    const price = billingCycle === "annual"
                      ? Math.floor(plan.annualPrice / 12)
                      : plan.monthlyPrice;

                    return (
                      <div
                        key={plan.planId}
                        className={cn(
                          "relative rounded-3xl border-2 overflow-hidden ins-card-hover ins-fade-up",
                          `ins-plan-${plan.tier}`,
                          isPremium && "ins-recommended-glow scale-[1.03] z-10"
                        )}
                        style={{ animationDelay: `${i * 100}ms` }}
                      >
                        {isPremium && (
                          <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-center py-2 text-xs font-black uppercase tracking-widest ins-badge">
                            ⭐ Most Popular
                          </div>
                        )}

                        <div className={cn("p-7", isPremium && "pt-12")}>
                          {/* Header */}
                          <div className="flex items-start justify-between mb-5">
                            <div>
                              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-3", accent.bg)}>
                                <Icon className="w-6 h-6 text-white" />
                              </div>
                              <h3 className="ins-serif text-2xl font-black text-gray-900">{plan.name}</h3>
                              <p className="text-sm text-gray-500 mt-0.5">{plan.description}</p>
                            </div>
                          </div>

                          {/* Price */}
                          <div className="py-5 border-y border-black/8 mb-5">
                            <div className="flex items-end gap-1">
                              <span className="ins-serif text-5xl font-black text-gray-900">${price}</span>
                              <span className="text-gray-400 text-sm font-medium mb-1.5">/mo</span>
                            </div>
                            {billingCycle === "annual" && (
                              <p className="text-xs text-gray-400 mt-1">Billed ${plan.annualPrice}/year</p>
                            )}
                            <div className="flex flex-wrap gap-3 mt-3 text-xs">
                              <span className={cn("font-bold px-2.5 py-1 rounded-full", accent.light, accent.text)}>
                                Up to ${plan.coverageLimit.toLocaleString()} annual
                              </span>
                              <span className="font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                                ${plan.deductible} deductible
                              </span>
                            </div>
                          </div>

                          {/* Features */}
                          <ul className="space-y-2.5 mb-6">
                            {plan.features.map(f => (
                              <li key={f} className="flex items-start gap-2.5 text-sm text-gray-700">
                                <div className={cn("w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5", accent.bg)}>
                                  <Check className="w-2.5 h-2.5 text-white" />
                                </div>
                                {f}
                              </li>
                            ))}
                          </ul>

                          {/* CTA */}
                          <button
                            onClick={() => {
                              if (!user) { alert("Please sign in to purchase a plan."); return; }
                              setBuyModal(plan);
                            }}
                            className={cn(
                              "w-full py-3.5 rounded-2xl text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm",
                              isPremium ? "ins-shimmer-btn" : `${accent.btn}`,
                              "hover:scale-[1.02] active:scale-[.98]"
                            )}
                          >
                            Get {plan.name}
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Why Choose Us */}
              <div className="mt-16">
                <h2 className="ins-serif text-3xl font-black text-gray-900 text-center mb-10">Why PetMatch Insurance?</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {[
                    { Icon: Zap,       color: "text-indigo-600 bg-indigo-50", title: "Instant Coverage",       desc: "Covered within minutes of sign-up. No waiting period for accidents." },
                    { Icon: Heart,     color: "text-rose-600 bg-rose-50",     title: "Comprehensive Care",     desc: "Accidents, illness, hereditary conditions and more in one plan." },
                    { Icon: Users,     color: "text-emerald-600 bg-emerald-50", title: "1,000+ Trusted Vets", desc: "Visit any licensed vet nationwide. We handle the paperwork." },
                    { Icon: BadgeCheck,color: "text-violet-600 bg-violet-50", title: "Fast Claims",           desc: "Most claims processed within 24 hours. Direct vet payments." },
                  ].map(({ Icon, color, title, desc }) => (
                    <div key={title} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm ins-card-hover ins-fade-up">
                      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-4", color)}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <h3 className="font-bold text-gray-900 mb-1.5">{title}</h3>
                      <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* FAQ */}
              <div className="max-w-2xl mx-auto mt-4">
                <h2 className="ins-serif text-3xl font-black text-gray-900 text-center mb-8">Frequently Asked Questions</h2>
                <div className="space-y-3">
                  {FAQS.map((faq, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden ins-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
                      <button
                        onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                        className="w-full flex items-center justify-between px-6 py-4 text-left font-semibold text-gray-900 hover:bg-indigo-50 transition-colors"
                      >
                        <span className="text-sm pr-4">{faq.q}</span>
                        {expandedFaq === i
                          ? <ChevronUp className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                          : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        }
                      </button>
                      {expandedFaq === i && (
                        <div className="px-6 pb-5 text-sm text-gray-600 leading-relaxed border-t border-indigo-50 pt-3 ins-fade-up">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════ MY POLICIES TAB ══════════════════════ */}
          {tab === "my-policies" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="ins-serif text-2xl font-black text-gray-900">My Policies</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Manage your active insurance policies</p>
                </div>
                <button
                  onClick={() => setTab("plans")}
                  className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Policy
                </button>
              </div>

              {!user ? (
                <div className="bg-white rounded-3xl p-16 text-center border border-gray-100 shadow-sm">
                  <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Sign in to view your policies</h3>
                  <p className="text-gray-500 text-sm">Create an account or sign in to manage your pet insurance.</p>
                </div>
              ) : policiesLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                </div>
              ) : policies.length === 0 ? (
                <div className="bg-white rounded-3xl p-16 text-center border-2 border-dashed border-indigo-200">
                  <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-indigo-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No policies yet</h3>
                  <p className="text-gray-500 text-sm mb-6">Protect your pet with a comprehensive insurance plan today.</p>
                  <button onClick={() => setTab("plans")} className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors">
                    <Plus className="w-4 h-4" /> Browse Plans
                  </button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {policies.map((policy, i) => {
                    const isActive = policy.status === "active";
                    const endDate = new Date(policy.endDate);
                    const daysLeft = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

                    return (
                      <div key={policy.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden ins-fade-up ins-card-hover" style={{ animationDelay: `${i * 80}ms` }}>
                        {/* Header band */}
                        <div className={cn(
                          "px-6 py-4 flex items-center justify-between",
                          policy.planTier === "basic" ? "bg-emerald-50" :
                          policy.planTier === "premium" ? "bg-indigo-50" : "bg-violet-50"
                        )}>
                          <div className="flex items-center gap-3">
                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", PLAN_ACCENTS[policy.planTier as keyof typeof PLAN_ACCENTS]?.bg || "bg-indigo-500")}>
                              {policy.planTier === "basic"   ? <Heart className="w-5 h-5 text-white" /> :
                               policy.planTier === "premium" ? <Shield className="w-5 h-5 text-white" /> :
                               <Award className="w-5 h-5 text-white" />}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 text-sm">{policy.planName}</p>
                              <p className="text-xs text-gray-500 font-mono">{policy.policyNumber}</p>
                            </div>
                          </div>
                          <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full border capitalize", `ins-status-${policy.status}`)}>
                            {policy.status}
                          </span>
                        </div>

                        <div className="p-6">
                          {/* Pet info */}
                          <div className="flex items-center gap-3 mb-5 p-3 bg-gray-50 rounded-2xl">
                            <div className="text-2xl">{policy.petType === "Dog" ? "🐕" : policy.petType === "Cat" ? "🐱" : policy.petType === "Bird" ? "🐦" : "🐾"}</div>
                            <div>
                              <p className="font-bold text-gray-900">{policy.petName}</p>
                              <p className="text-xs text-gray-500">{policy.petType}{policy.petBreed ? ` · ${policy.petBreed}` : ""} · {policy.petAge} yr · {policy.petGender}</p>
                            </div>
                            <div className="ml-auto text-right">
                              <p className="font-bold text-gray-900">${policy.price}<span className="text-xs font-normal text-gray-400">/mo</span></p>
                              <p className="text-xs text-gray-400 capitalize">{policy.billingCycle}</p>
                            </div>
                          </div>

                          {/* Coverage details */}
                          <div className="grid grid-cols-3 gap-3 mb-5">
                            {[
                              { label: "Coverage", val: `$${policy.coverageLimit.toLocaleString()}` },
                              { label: "Deductible", val: `$${policy.deductible}` },
                              { label: "Days Left", val: isActive ? (daysLeft > 0 ? `${daysLeft}d` : "Expired") : "—" },
                            ].map(({ label, val }) => (
                              <div key={label} className="text-center bg-gray-50 rounded-xl py-3">
                                <p className="text-xs text-gray-400 font-semibold">{label}</p>
                                <p className="font-bold text-gray-900 text-sm mt-0.5">{val}</p>
                              </div>
                            ))}
                          </div>

                          <div className="text-xs text-gray-400 mb-5 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            Valid: {new Date(policy.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            {" "}→ {new Date(policy.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 flex-wrap">
                            {isActive && (
                              <button
                                onClick={() => setClaimModal(policy)}
                                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors"
                              >
                                <ReceiptText className="w-3.5 h-3.5" /> File Claim
                              </button>
                            )}
                            {(policy.status === "expired" || policy.status === "cancelled") && (
                              <button
                                onClick={() => renewPolicy(policy.id)}
                                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white text-sm font-bold rounded-xl hover:bg-emerald-600 transition-colors"
                              >
                                <RefreshCw className="w-3.5 h-3.5" /> Renew
                              </button>
                            )}
                            {isActive && (
                              <button
                                onClick={() => cancelPolicy(policy.id)}
                                className="flex items-center gap-1.5 px-4 py-2 border border-red-200 text-red-500 text-sm font-bold rounded-xl hover:bg-red-50 transition-colors"
                              >
                                <Ban className="w-3.5 h-3.5" /> Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════ CLAIMS TAB ══════════════════════ */}
          {tab === "claims" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="ins-serif text-2xl font-black text-gray-900">My Claims</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Track and manage your insurance claims</p>
                </div>
                {activePolicies.length > 0 && (
                  <button
                    onClick={() => setClaimModal(activePolicies[0])}
                    className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm"
                  >
                    <Plus className="w-4 h-4" /> New Claim
                  </button>
                )}
              </div>

              {!user ? (
                <div className="bg-white rounded-3xl p-16 text-center border border-gray-100 shadow-sm">
                  <ReceiptText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Sign in to view your claims.</p>
                </div>
              ) : claimsLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                </div>
              ) : claims.length === 0 ? (
                <div className="bg-white rounded-3xl p-16 text-center border-2 border-dashed border-indigo-200">
                  <ReceiptText className="w-12 h-12 text-indigo-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No claims yet</h3>
                  <p className="text-gray-500 text-sm mb-6">
                    {activePolicies.length > 0
                      ? "File a claim when your pet needs medical care."
                      : "Get a policy first to start filing claims."}
                  </p>
                  {activePolicies.length === 0 && (
                    <button onClick={() => setTab("plans")} className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors">
                      Browse Plans
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {claims.map((claim, i) => (
                    <div key={claim.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 ins-fade-up ins-card-hover" style={{ animationDelay: `${i * 60}ms` }}>
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                            <ReceiptText className="w-6 h-6 text-indigo-500" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{claim.claimType}</p>
                            <p className="text-xs text-gray-500 mt-0.5 font-mono">Policy: {claim.policyNumber}</p>
                            <p className="text-sm text-gray-600 mt-2 max-w-md leading-relaxed">{claim.description}</p>
                            <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-500">
                              <span className="flex items-center gap-1"><PawPrint className="w-3 h-3" />{claim.petName}</span>
                              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(claim.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <p className="text-2xl font-black text-gray-900">${claim.amount}</p>
                          <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full capitalize", `ins-claim-${claim.status}`)}>
                            {claim.status.replace("_", " ")}
                          </span>
                        </div>
                      </div>
                      {claim.notes && (
                        <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500 bg-gray-50 rounded-xl p-3">
                          <span className="font-semibold">Note: </span>{claim.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ══════════════════════ BUY MODAL ══════════════════════ */}
        {buyModal && (
          <BuyModal
            plan={buyModal}
            billingCycle={billingCycle}
            clerkId={clerkId}
            ownerName={user?.fullName ?? user?.firstName ?? ""}
            ownerEmail={user?.emailAddresses?.[0]?.emailAddress ?? ""}
            onClose={() => setBuyModal(null)}
            onSuccess={(policy) => {
              setBuyModal(null);
              setPolicies(prev => [policy, ...prev]);
              setTab("my-policies");
              showSuccess(`🎉 Policy created! Your ${policy.planName} is now active.`);
            }}
          />
        )}

        {/* ══════════════════════ CLAIM MODAL ══════════════════════ */}
        {claimModal && (
          <ClaimModal
            policies={activePolicies.length > 0 ? activePolicies : [claimModal]}
            defaultPolicy={claimModal}
            clerkId={clerkId}
            onClose={() => setClaimModal(null)}
            onSuccess={(claim) => {
              setClaimModal(null);
              setClaims(prev => [claim, ...prev]);
              setTab("claims");
              showSuccess("Claim submitted! We'll process it within 24 hours.");
            }}
          />
        )}
      </div>
    </>
  );
}

/* ─── BuyModal ─────────────────────────────────────────────────────────────── */
function BuyModal({ plan, billingCycle, clerkId, ownerName, ownerEmail, onClose, onSuccess }: {
  plan: Plan;
  billingCycle: "monthly" | "annual";
  clerkId: string;
  ownerName: string;
  ownerEmail: string;
  onClose: () => void;
  onSuccess: (policy: Policy) => void;
}) {
  const accent = PLAN_ACCENTS[plan.tier];
  const price = billingCycle === "annual"
    ? Math.floor(plan.annualPrice / 12)
    : plan.monthlyPrice;

  const [form, setForm] = useState({
    petName:   "",
    petType:   "Dog",
    petBreed:  "",
    petAge:    "",
    petGender: "Male" as "Male" | "Female",
    billing:   billingCycle,
    ownerName,
    ownerEmail,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.petName.trim())    e.petName   = "Pet name is required";
    if (!form.petAge || isNaN(Number(form.petAge)) || Number(form.petAge) < 0) e.petAge = "Valid age required";
    if (!form.ownerName.trim())  e.ownerName  = "Your name is required";
    if (!form.ownerEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.ownerEmail)) e.ownerEmail = "Valid email required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setServerError("");
    try {
      const res = await fetch("/api/insurance/policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerkId,
          ownerName: form.ownerName,
          ownerEmail: form.ownerEmail,
          planId: plan.planId,
          petName: form.petName,
          petType: form.petType,
          petBreed: form.petBreed,
          petAge: parseInt(form.petAge),
          petGender: form.petGender,
          billingCycle: form.billing,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create policy");
      onSuccess(data);
    } catch (err: any) {
      setServerError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inpCls = (hasError: boolean) => cn(
    "w-full px-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all bg-white",
    hasError ? "border-red-400 bg-red-50" : "border-gray-200"
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[92vh] overflow-y-auto ins-scroll ins-pop">
        {/* Header */}
        <div className={cn("px-6 py-5 flex items-center justify-between rounded-t-3xl", accent.light)}>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0.5">Get Covered</p>
            <h2 className="ins-serif text-xl font-black text-gray-900">{plan.name}</h2>
            <p className="text-sm text-gray-500">${price}/mo · {plan.description}</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/70 hover:bg-white flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Pet details */}
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Pet Details</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Pet Name</label>
              <input type="text" value={form.petName} onChange={e => setForm({ ...form, petName: e.target.value })} placeholder="e.g. Buddy" className={inpCls(!!errors.petName)} />
              {errors.petName && <p className="text-xs text-red-500 mt-1">{errors.petName}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Pet Type</label>
              <select value={form.petType} onChange={e => setForm({ ...form, petType: e.target.value })} className={inpCls(false)}>
                {PET_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Breed (optional)</label>
            <input type="text" value={form.petBreed} onChange={e => setForm({ ...form, petBreed: e.target.value })} placeholder="e.g. Golden Retriever" className={inpCls(false)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Age (years)</label>
              <input type="number" min="0" max="30" value={form.petAge} onChange={e => setForm({ ...form, petAge: e.target.value })} placeholder="e.g. 3" className={inpCls(!!errors.petAge)} />
              {errors.petAge && <p className="text-xs text-red-500 mt-1">{errors.petAge}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Gender</label>
              <div className="flex gap-2">
                {(["Male", "Female"] as const).map(g => (
                  <button key={g} type="button" onClick={() => setForm({ ...form, petGender: g })}
                    className={cn("flex-1 py-2 rounded-xl text-sm font-bold border-2 transition-all", form.petGender === g ? `${accent.btn.split(" ")[0]} border-transparent text-white` : "border-gray-200 text-gray-500 hover:border-gray-300")}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Owner details */}
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest pt-2">Your Details</p>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
            <input type="text" value={form.ownerName} onChange={e => setForm({ ...form, ownerName: e.target.value })} placeholder="Your name" className={inpCls(!!errors.ownerName)} />
            {errors.ownerName && <p className="text-xs text-red-500 mt-1">{errors.ownerName}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
            <input type="email" value={form.ownerEmail} onChange={e => setForm({ ...form, ownerEmail: e.target.value })} placeholder="you@example.com" className={inpCls(!!errors.ownerEmail)} />
            {errors.ownerEmail && <p className="text-xs text-red-500 mt-1">{errors.ownerEmail}</p>}
          </div>

          {/* Billing */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Billing Cycle</label>
            <div className="flex gap-2">
              {(["monthly", "annual"] as const).map(b => (
                <button key={b} type="button" onClick={() => setForm({ ...form, billing: b })}
                  className={cn("flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all", form.billing === b ? `${accent.btn.split(" ")[0]} border-transparent text-white` : "border-gray-200 text-gray-500 hover:border-gray-300")}>
                  {b === "monthly" ? "Monthly" : `Annual ($${plan.annualPrice}/yr)`}
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className={cn("rounded-2xl p-4 border", accent.light, accent.border)}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-500">{plan.name} · {form.billing}</span>
              <span className="font-black text-gray-900">${form.billing === "annual" ? Math.floor(plan.annualPrice / 12) : plan.monthlyPrice}/mo</span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Coverage up to ${plan.coverageLimit.toLocaleString()}</span>
              <span>${plan.deductible} deductible</span>
            </div>
          </div>

          {serverError && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {serverError}
            </div>
          )}

          <button type="submit" disabled={loading}
            className={cn("w-full py-3.5 rounded-2xl font-bold text-white transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-60", accent.btn.split(" ")[0], accent.btn.split(" ")[1] || "")}>
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating Policy…</>
              : <><Shield className="w-4 h-4" /> Activate Coverage — ${form.billing === "annual" ? Math.floor(plan.annualPrice / 12) : plan.monthlyPrice}/mo</>
            }
          </button>
        </form>
      </div>
    </div>
  );
}

/* ─── ClaimModal ───────────────────────────────────────────────────────────── */
function ClaimModal({ policies, defaultPolicy, clerkId, onClose, onSuccess }: {
  policies: Policy[];
  defaultPolicy: Policy;
  clerkId: string;
  onClose: () => void;
  onSuccess: (claim: Claim) => void;
}) {
  const [form, setForm] = useState({
    policyId:    defaultPolicy.id,
    claimType:   "",
    description: "",
    amount:      "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const selectedPolicy = policies.find(p => p.id === form.policyId) ?? defaultPolicy;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.claimType)               e.claimType   = "Select a claim type";
    if (!form.description.trim())      e.description = "Describe what happened";
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) e.amount = "Enter a valid amount";
    if (Number(form.amount) > selectedPolicy.coverageLimit) e.amount = `Amount exceeds your coverage limit ($${selectedPolicy.coverageLimit})`;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setServerError("");
    try {
      const res = await fetch("/api/insurance/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerkId,
          policyId:     form.policyId,
          policyNumber: selectedPolicy.policyNumber,
          petName:      selectedPolicy.petName,
          claimType:    form.claimType,
          description:  form.description,
          amount:       parseFloat(form.amount),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit claim");
      onSuccess(data);
    } catch (err: any) {
      setServerError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const inpCls = (hasError: boolean) => cn(
    "w-full px-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all bg-white",
    hasError ? "border-red-400 bg-red-50" : "border-gray-200"
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[92vh] overflow-y-auto ins-scroll ins-pop">
        {/* Header */}
        <div className="bg-indigo-50 px-6 py-5 flex items-center justify-between rounded-t-3xl border-b border-indigo-100">
          <div>
            <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-0.5">New Claim</p>
            <h2 className="ins-serif text-xl font-black text-gray-900">File a Claim</h2>
            <p className="text-sm text-gray-500">For {selectedPolicy.petName}</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Policy selector */}
          {policies.length > 1 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Select Policy</label>
              <select value={form.policyId} onChange={e => setForm({ ...form, policyId: e.target.value })} className={inpCls(false)}>
                {policies.map(p => (
                  <option key={p.id} value={p.id}>{p.planName} — {p.petName} ({p.policyNumber})</option>
                ))}
              </select>
            </div>
          )}

          {/* Selected policy info */}
          <div className="bg-indigo-50 rounded-2xl p-3 border border-indigo-100 text-xs">
            <div className="flex justify-between text-gray-600">
              <span className="font-semibold">Policy:</span>
              <span className="font-mono">{selectedPolicy.policyNumber}</span>
            </div>
            <div className="flex justify-between text-gray-600 mt-1">
              <span className="font-semibold">Coverage:</span>
              <span>${selectedPolicy.coverageLimit.toLocaleString()} · ${selectedPolicy.deductible} deductible</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Claim Type</label>
            <select value={form.claimType} onChange={e => setForm({ ...form, claimType: e.target.value })} className={inpCls(!!errors.claimType)}>
              <option value="">Select claim type…</option>
              {CLAIM_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
            {errors.claimType && <p className="text-xs text-red-500 mt-1">{errors.claimType}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
            <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Describe your pet's condition and the treatment received…"
              className={cn(inpCls(!!errors.description), "resize-none")} />
            {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Claim Amount ($)</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">$</span>
              <input type="number" min="1" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                placeholder="0.00" className={cn(inpCls(!!errors.amount), "pl-8")} />
            </div>
            {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
          </div>

          {serverError && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {serverError}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-3.5 rounded-2xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-60">
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
              : <><ReceiptText className="w-4 h-4" /> Submit Claim</>
            }
          </button>

          <p className="text-xs text-gray-400 text-center">Most claims are processed within 24 hours.</p>
        </form>
      </div>
    </div>
  );
}
