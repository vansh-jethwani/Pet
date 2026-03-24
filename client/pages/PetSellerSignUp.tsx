import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSignUp } from "@clerk/clerk-react";
import {
  Heart, ArrowLeft, ArrowRight, Check, AlertCircle,
  User, Mail, Phone, Building, MapPin, Tag, Shield,
  Truck, Camera, Globe, Instagram, Facebook, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Styles ──────────────────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');

  .ps-root    { font-family: 'DM Sans', sans-serif; }
  .ps-display { font-family: 'DM Serif Display', Georgia, serif; }

  @keyframes ps-up   { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:none} }
  @keyframes ps-in   { from{opacity:0;transform:translateX(30px)} to{opacity:1;transform:none} }
  @keyframes ps-blob {
    0%,100%{border-radius:60% 40% 30% 70%/60% 30% 70% 40%}
    50%{border-radius:30% 60% 70% 40%/50% 60% 30% 60%}
  }
  @keyframes ps-spin { to{transform:rotate(360deg)} }
  @keyframes ps-check { 0%{transform:scale(0)} 60%{transform:scale(1.2)} 100%{transform:scale(1)} }
  @keyframes ps-bar { from{width:0} }

  .ps-up    { animation: ps-up  .5s cubic-bezier(.34,1.56,.64,1) both; }
  .ps-in    { animation: ps-in  .4s cubic-bezier(.34,1.56,.64,1) both; }
  .ps-blob  { animation: ps-blob 10s ease-in-out infinite; }
  .ps-spin  { animation: ps-spin .8s linear infinite; }
  .ps-check { animation: ps-check .3s cubic-bezier(.34,1.56,.64,1) both; }
  .ps-bar   { animation: ps-bar .6s ease both; }

  .ps-input {
    width:100%; padding:12px 16px; background:#f8f7f4; border:2px solid #e8e4dc;
    border-radius:12px; font-family:'DM Sans',sans-serif; font-size:14px; color:#1a1a1a;
    transition:border-color .2s, box-shadow .2s; outline:none;
  }
  .ps-input:focus { border-color:#e06c2c; box-shadow:0 0 0 4px rgba(224,108,44,.12); background:#fff; }
  .ps-input.error { border-color:#ef4444; background:#fef2f2; }
  .ps-input::placeholder { color:#b0a99a; }
  .ps-select { appearance:none; cursor:pointer; }

  .ps-toggle {
    display:inline-flex; align-items:center; gap:8px; padding:8px 16px;
    border-radius:100px; border:2px solid #e8e4dc; font-size:13px; font-weight:600;
    cursor:pointer; transition:all .2s; background:#f8f7f4; color:#666;
  }
  .ps-toggle:hover { border-color:#e06c2c; color:#e06c2c; }
  .ps-toggle.active { background:#e06c2c; border-color:#e06c2c; color:#fff; }

  .ps-pill {
    display:inline-flex; align-items:center; gap:6px; padding:6px 14px;
    border-radius:100px; border:2px solid #e8e4dc; font-size:12px; font-weight:600;
    cursor:pointer; transition:all .18s; background:#f8f7f4; color:#888;
  }
  .ps-pill:hover { border-color:#e06c2c; color:#e06c2c; background:#fff7f2; }
  .ps-pill.active { background:#fff2e8; border-color:#e06c2c; color:#e06c2c; }

  .ps-step-line { height:3px; background:#e8e4dc; border-radius:99px; overflow:hidden; }
  .ps-step-fill { height:100%; background:linear-gradient(90deg,#e06c2c,#f59e0b); border-radius:99px; transition:width .5s ease; }
`;

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab",
  "Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh",
  "Uttarakhand","West Bengal","Delhi","Jammu & Kashmir","Ladakh","Puducherry",
];

const PET_TYPES = ["Dog","Cat","Bird","Fish","Reptile","Rabbit","Hamster","Other"];
const SELLER_TYPES = [
  { value:"individual", label:"Individual Seller" },
  { value:"breeder",    label:"Professional Breeder" },
  { value:"rescue",     label:"Rescue Organization" },
  { value:"shelter",    label:"Animal Shelter" },
];
const GOV_IDS = [
  { value:"aadhar",          label:"Aadhaar Card" },
  { value:"pan",             label:"PAN Card" },
  { value:"passport",        label:"Passport" },
  { value:"driving_license", label:"Driving License" },
];
const CLOUDINARY_CLOUD_NAME   = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

type Step = 1 | 2 | 3 | 4;

interface FormData {
  // Step 1 – Account
  fullName: string; email: string; phone: string; password: string; confirmPassword: string;
  // Step 2 – Business
  businessName: string; sellerType: string; licenseNumber: string; yearsInBusiness: string;
  website: string; description: string;
  // Step 3 – Location & Pets
  address: string; city: string; state: string; pincode: string;
  petTypes: string[]; breeds: string; averagePetsPerMonth: string;
  healthCertificateProvided: boolean; vaccinationIncluded: boolean;
  deliveryAvailable: boolean; deliveryRadius: string; returnPolicy: string;
  // Step 4 – Verification & Social
  govIdType: string; govIdNumber: string; govIdUrl: string;
  sellerPhotoUrl: string; instagram: string; facebook: string;
}

const INIT: FormData = {
  fullName:"", email:"", phone:"", password:"", confirmPassword:"",
  businessName:"", sellerType:"individual", licenseNumber:"", yearsInBusiness:"",
  website:"", description:"",
  address:"", city:"", state:"", pincode:"",
  petTypes:[], breeds:"", averagePetsPerMonth:"",
  healthCertificateProvided:false, vaccinationIncluded:false,
  deliveryAvailable:false, deliveryRadius:"", returnPolicy:"",
  govIdType:"aadhar", govIdNumber:"", govIdUrl:"", sellerPhotoUrl:"",
  instagram:"", facebook:"",
};

const STEPS = [
  { num:1, title:"Account Details",    icon:User    },
  { num:2, title:"Business Info",      icon:Building },
  { num:3, title:"Location & Pets",    icon:MapPin  },
  { num:4, title:"Verification",       icon:Shield  },
];

function Field({ label, error, children, required, className }: { label:string; error?:string; children:React.ReactNode; required?:boolean; className?:string }) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label className="text-sm font-semibold text-gray-700">
        {label}{required && <span className="text-orange-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{error}</p>}
    </div>
  );
}

async function uploadToCloudinary(file: File): Promise<string> {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) throw new Error("Cloudinary not configured");
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, { method:"POST", body:fd });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Upload failed");
  return data.secure_url;
}

export default function PetSellerSignUp() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const navigate = useNavigate();

  const [step,         setStep]         = useState<Step>(1);
  const [form,         setForm]         = useState<FormData>(INIT);
  const [errors,       setErrors]       = useState<Partial<Record<keyof FormData | "submit", string>>>({});
  const [stage,        setStage]        = useState<"form"|"verify"|"done">("form");
  const [otp,          setOtp]          = useState("");
  const [otpError,     setOtpError]     = useState("");
  const [isVerifying,  setIsVerifying]  = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading,    setUploading]    = useState<string|null>(null);
  const [showPass,     setShowPass]     = useState(false);

  const set = (key: keyof FormData, val: any) => {
    setForm(p => ({ ...p, [key]: val }));
    setErrors(p => ({ ...p, [key]: "" }));
  };

  const togglePetType = (t: string) => {
    set("petTypes", form.petTypes.includes(t) ? form.petTypes.filter(x => x !== t) : [...form.petTypes, t]);
  };

  const validate = (s: Step): Partial<Record<keyof FormData | "submit", string>> => {
    const e: any = {};
    if (s === 1) {
      if (!form.fullName.trim())   e.fullName = "Required";
      if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Valid email required";
      if (!form.phone.trim() || form.phone.replace(/\D/g,"").length < 10) e.phone = "Valid 10-digit number required";
      if (!form.password || form.password.length < 8) e.password = "Min 8 characters";
      if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords don't match";
    }
    if (s === 2) {
      if (!form.businessName.trim()) e.businessName = "Required";
      if (!form.description.trim())  e.description  = "Required";
    }
    if (s === 3) {
      if (!form.address.trim()) e.address = "Required";
      if (!form.city.trim())    e.city    = "Required";
      if (!form.state)          e.state   = "Required";
      if (!form.pincode.trim() || form.pincode.replace(/\D/g,"").length !== 6) e.pincode = "6-digit pincode required";
      if (form.petTypes.length === 0) e.petTypes = "Select at least one";
    }
    if (s === 4) {
      if (!form.govIdNumber.trim()) e.govIdNumber = "Required";
    }
    return e;
  };

  const goNext = () => {
    const e = validate(step);
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    if (step < 4) setStep((step + 1) as Step);
    else handleSubmit();
  };

  const goPrev = () => { setErrors({}); setStep(Math.max(1, step - 1) as Step); };

  const handleSubmit = async () => {
    if (!isLoaded) return;
    setIsSubmitting(true);
    setErrors({});
    try {
      const parts = form.fullName.trim().split(" ");
      await signUp!.create({
        firstName: parts[0], lastName: parts.slice(1).join(" "),
        emailAddress: form.email, password: form.password,
      });
      await signUp!.prepareEmailAddressVerification({ strategy: "email_code" });
      setStage("verify");
    } catch (err: any) {
      setErrors({ submit: err?.errors?.[0]?.longMessage || "Something went wrong." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    setIsVerifying(true); setOtpError("");
    try {
      const result = await signUp!.attemptEmailAddressVerification({ code: otp });
      if (result.status !== "complete") throw new Error("Incomplete");
      await setActive!({ session: result.createdSessionId });

      // Save to MongoDB
      const payload = {
        ...form,
        clerkId: result.createdUserId ?? "",
        yearsInBusiness: parseInt(form.yearsInBusiness) || 0,
        averagePetsPerMonth: parseInt(form.averagePetsPerMonth) || 0,
        deliveryRadius: parseInt(form.deliveryRadius) || 0,
        breeds: form.breeds.split(",").map(b => b.trim()).filter(Boolean),
      };
      const res = await fetch("/api/sellers/pets", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.error || "Failed to save your profile. Please contact support.");
      }

      setStage("done");
    } catch (err: any) {
      setOtpError(err?.errors?.[0]?.longMessage || err?.message || "Invalid code.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: "govIdUrl" | "sellerPhotoUrl") => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(field);
    try {
      const url = await uploadToCloudinary(file);
      set(field, url);
    } catch (err: any) {
      setErrors(p => ({ ...p, [field]: err?.message || "Upload failed" }));
    } finally { setUploading(null); e.target.value = ""; }
  };

  const progress = ((step - 1) / 3) * 100;

  /* ── Done screen ── */
  if (stage === "done") return (
    <div className="ps-root min-h-screen bg-[#faf8f5] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center border border-orange-100">
        <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-200 ps-check">
          <Check className="w-10 h-10 text-white" />
        </div>
        <h2 className="ps-display text-3xl font-bold text-gray-900 mb-3">Application Submitted!</h2>
        <p className="text-gray-500 mb-2">Welcome, <strong>{form.fullName}</strong>!</p>
        <p className="text-gray-400 text-sm mb-8 leading-relaxed">
          Your pet seller profile is under review. We'll verify your details within 1–2 business days and notify you by email.
        </p>
        <div className="bg-orange-50 rounded-2xl p-4 mb-8 text-left border border-orange-100">
          <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-3">What's next</p>
          {["Profile under review","Documents verified","Profile goes live on marketplace"].map((s,i) => (
            <div key={i} className="flex items-center gap-3 py-1.5 text-sm text-gray-600">
              <div className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold">{i+1}</div>
              {s}
            </div>
          ))}
        </div>
        <button onClick={() => navigate("/")} className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-400 text-white font-bold hover:opacity-90 transition-all">
          Go to Home
        </button>
      </div>
    </div>
  );

  /* ── OTP verify screen ── */
  if (stage === "verify") return (
    <div className="ps-root min-h-screen bg-[#faf8f5] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4"><Mail className="w-8 h-8 text-orange-500"/></div>
          <h2 className="ps-display text-2xl font-bold text-gray-900 mb-2">Check your email</h2>
          <p className="text-gray-500 text-sm">6-digit code sent to <strong>{form.email}</strong></p>
        </div>
        <form onSubmit={handleVerify} className="space-y-4">
          <input
            type="text" inputMode="numeric" value={otp} maxLength={6}
            onChange={e => { setOtp(e.target.value.replace(/\D/g,"").slice(0,6)); setOtpError(""); }}
            placeholder="000000"
            className={cn("ps-input text-center text-2xl tracking-[.5em] font-bold", otpError && "error")}
          />
          {otpError && <p className="text-sm text-red-500 flex items-center gap-1.5 justify-center"><AlertCircle className="w-4 h-4"/>{otpError}</p>}
          <button type="submit" disabled={isVerifying || otp.length < 6}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-400 text-white font-bold disabled:opacity-50 transition-all">
            {isVerifying ? "Verifying…" : "Verify & Submit Application"}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-5">
          Didn't get it?{" "}
          <button type="button" onClick={() => signUp?.prepareEmailAddressVerification({ strategy:"email_code" })}
            className="text-orange-500 font-semibold hover:text-orange-600">Resend</button>
        </p>
      </div>
    </div>
  );

  /* ── Main multi-step form ── */
  return (
    <>
      <style>{STYLES}</style>
      <div className="ps-root min-h-screen bg-[#faf8f5]">
        {/* Decorative blobs */}
        <div className="fixed -top-40 -left-40 w-[500px] h-[500px] bg-orange-200/20 blur-3xl ps-blob pointer-events-none" />
        <div className="fixed -bottom-40 -right-40 w-[400px] h-[400px] bg-amber-200/15 blur-3xl ps-blob pointer-events-none" style={{animationDelay:"5s"}} />

        {/* Header */}
        <header className="relative z-10 flex items-center justify-between px-6 py-5 max-w-3xl mx-auto">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-amber-400 rounded-xl flex items-center justify-center shadow-md">
              <Heart className="w-4 h-4 text-white fill-white"/>
            </div>
            <span className="ps-display text-xl font-bold text-gray-900">PetMatch</span>
          </Link>
          <Link to="/signup" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-orange-500 transition-colors font-medium">
            <ArrowLeft className="w-4 h-4"/> Back
          </Link>
        </header>

        <div className="relative z-10 max-w-3xl mx-auto px-4 pb-16">
          {/* Hero banner */}
          <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 rounded-3xl p-8 text-white mb-8 relative overflow-hidden shadow-xl shadow-orange-200/50 ps-up">
            <div className="absolute inset-0 opacity-10" style={{backgroundImage:"radial-gradient(circle,white 1px,transparent 1px)",backgroundSize:"22px 22px"}}/>
            <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-white/10 blur-2xl"/>
            <div className="relative flex items-center gap-5">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-4xl border border-white/30">🏷️</div>
              <div>
                <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-0.5">Seller Registration</p>
                <h1 className="ps-display text-2xl sm:text-3xl font-bold">Become a Pet Seller</h1>
                <p className="text-white/70 text-sm mt-1">List & sell pets to thousands of loving families</p>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="mb-8 ps-up" style={{animationDelay:"80ms"}}>
            <div className="flex items-center justify-between mb-3">
              {STEPS.map((s, i) => {
                const done   = step > s.num;
                const active = step === s.num;
                const Icon   = s.icon;
                return (
                  <div key={s.num} className="flex-1 flex flex-col items-center gap-2">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                      done   ? "bg-orange-500 border-orange-500 text-white"
                             : active ? "bg-white border-orange-500 text-orange-500"
                             : "bg-white border-gray-200 text-gray-400"
                    )}>
                      {done ? <Check className="w-4 h-4"/> : <Icon className="w-4 h-4"/>}
                    </div>
                    <p className={cn("hidden sm:block text-xs font-semibold text-center",
                      active ? "text-orange-600" : done ? "text-gray-700" : "text-gray-400"
                    )}>{s.title}</p>
                  </div>
                );
              })}
            </div>
            <div className="ps-step-line">
              <div className="ps-step-fill ps-bar" style={{width:`${progress}%`}}/>
            </div>
          </div>

          {/* Form card */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden ps-in" key={step}>
            <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-amber-50/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                  {(() => { const Icon = STEPS[step-1].icon; return <Icon className="w-5 h-5 text-orange-600"/>; })()}
                </div>
                <div>
                  <h2 className="ps-display text-xl font-bold text-gray-900">{STEPS[step-1].title}</h2>
                  <p className="text-sm text-gray-400">Step {step} of 4</p>
                </div>
              </div>
            </div>

            <div className="p-8">
              {/* ── STEP 1: Account ── */}
              {step === 1 && (
                <div className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Full Name" error={errors.fullName} required>
                      <div className="relative">
                        <User className="absolute left-3.5 top-3 w-4 h-4 text-gray-400 pointer-events-none"/>
                        <input type="text" value={form.fullName} onChange={e => set("fullName",e.target.value)}
                          placeholder="Your legal name" className={cn("ps-input pl-10", errors.fullName&&"error")}/>
                      </div>
                    </Field>
                    <Field label="Email Address" error={errors.email} required>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-3 w-4 h-4 text-gray-400 pointer-events-none"/>
                        <input type="email" value={form.email} onChange={e => set("email",e.target.value)}
                          placeholder="you@example.com" className={cn("ps-input pl-10", errors.email&&"error")}/>
                      </div>
                    </Field>
                    <Field label="Phone Number" error={errors.phone} required>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-3 w-4 h-4 text-gray-400 pointer-events-none"/>
                        <input type="tel" value={form.phone} onChange={e => set("phone",e.target.value)}
                          placeholder="+91 98765 43210" className={cn("ps-input pl-10", errors.phone&&"error")}/>
                      </div>
                    </Field>
                    <Field label="Password" error={errors.password} required>
                      <div className="relative">
                        <input type={showPass?"text":"password"} value={form.password} onChange={e => set("password",e.target.value)}
                          placeholder="Min 8 characters" className={cn("ps-input pr-14", errors.password&&"error")}/>
                        <button type="button" onClick={() => setShowPass(v=>!v)}
                          className="absolute right-3.5 top-3 text-xs text-gray-400 hover:text-orange-500 font-semibold">{showPass?"Hide":"Show"}</button>
                      </div>
                    </Field>
                    <Field label="Confirm Password" error={errors.confirmPassword} required>
                      <input type="password" value={form.confirmPassword} onChange={e => set("confirmPassword",e.target.value)}
                        placeholder="Repeat password" className={cn("ps-input", errors.confirmPassword&&"error")}/>
                    </Field>
                  </div>
                </div>
              )}

              {/* ── STEP 2: Business Info ── */}
              {step === 2 && (
                <div className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Business / Seller Name" error={errors.businessName} required>
                      <div className="relative">
                        <Building className="absolute left-3.5 top-3 w-4 h-4 text-gray-400 pointer-events-none"/>
                        <input type="text" value={form.businessName} onChange={e => set("businessName",e.target.value)}
                          placeholder="e.g. Happy Paws Kennel" className={cn("ps-input pl-10", errors.businessName&&"error")}/>
                      </div>
                    </Field>
                    <Field label="Seller Type" required>
                      <div className="relative">
                        <select value={form.sellerType} onChange={e => set("sellerType",e.target.value)} className="ps-input ps-select">
                          {SELLER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3.5 top-3 w-4 h-4 text-gray-400 pointer-events-none"/>
                      </div>
                    </Field>
                    <Field label="License / Registration No.">
                      <input type="text" value={form.licenseNumber} onChange={e => set("licenseNumber",e.target.value)}
                        placeholder="If applicable" className="ps-input"/>
                    </Field>
                    <Field label="Years in Business">
                      <input type="number" min="0" max="50" value={form.yearsInBusiness} onChange={e => set("yearsInBusiness",e.target.value)}
                        placeholder="e.g. 5" className="ps-input"/>
                    </Field>
                    <Field label="Website" className="sm:col-span-2">
                      <div className="relative">
                        <Globe className="absolute left-3.5 top-3 w-4 h-4 text-gray-400 pointer-events-none"/>
                        <input type="url" value={form.website} onChange={e => set("website",e.target.value)}
                          placeholder="https://yourwebsite.com" className="ps-input pl-10"/>
                      </div>
                    </Field>
                  </div>
                  <Field label="Tell buyers about yourself" error={errors.description} required>
                    <textarea rows={4} value={form.description} onChange={e => set("description",e.target.value)}
                      placeholder="Describe your breeding practice, care standards, and what makes you trustworthy…"
                      className={cn("ps-input resize-none", errors.description&&"error")}/>
                  </Field>
                </div>
              )}

              {/* ── STEP 3: Location & Pets ── */}
              {step === 3 && (
                <div className="space-y-5">
                  <Field label="Street Address" error={errors.address} required>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-gray-400 pointer-events-none"/>
                      <input type="text" value={form.address} onChange={e => set("address",e.target.value)}
                        placeholder="Building, street, area" className={cn("ps-input pl-10", errors.address&&"error")}/>
                    </div>
                  </Field>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <Field label="City" error={errors.city} required>
                      <input type="text" value={form.city} onChange={e => set("city",e.target.value)}
                        placeholder="e.g. Mumbai" className={cn("ps-input", errors.city&&"error")}/>
                    </Field>
                    <Field label="State" error={errors.state} required>
                      <div className="relative">
                        <select value={form.state} onChange={e => set("state",e.target.value)} className={cn("ps-input ps-select", errors.state&&"error")}>
                          <option value="">Select state</option>
                          {INDIAN_STATES.map(s => <option key={s}>{s}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3.5 top-3 w-4 h-4 text-gray-400 pointer-events-none"/>
                      </div>
                    </Field>
                    <Field label="Pincode" error={errors.pincode} required>
                      <input type="text" maxLength={6} value={form.pincode} onChange={e => set("pincode",e.target.value.replace(/\D/g,""))}
                        placeholder="6-digit" className={cn("ps-input", errors.pincode&&"error")}/>
                    </Field>
                  </div>

                  <Field label="Pet Types You Sell" error={errors.petTypes as string} required>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {PET_TYPES.map(t => (
                        <button key={t} type="button" onClick={() => togglePetType(t.toLowerCase())}
                          className={cn("ps-pill", form.petTypes.includes(t.toLowerCase())&&"active")}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </Field>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Breeds You Deal In">
                      <input type="text" value={form.breeds} onChange={e => set("breeds",e.target.value)}
                        placeholder="e.g. Labrador, Poodle, Persian (comma-separated)" className="ps-input"/>
                    </Field>
                    <Field label="Avg. Pets Sold per Month">
                      <input type="number" min="0" value={form.averagePetsPerMonth} onChange={e => set("averagePetsPerMonth",e.target.value)}
                        placeholder="e.g. 10" className="ps-input"/>
                    </Field>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Return Policy">
                      <textarea rows={2} value={form.returnPolicy} onChange={e => set("returnPolicy",e.target.value)}
                        placeholder="Describe your return/exchange policy…" className="ps-input resize-none"/>
                    </Field>
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-gray-700">Services Offered</p>
                      {[
                        { key:"deliveryAvailable",         label:"🚚 Home Delivery Available" },
                        { key:"healthCertificateProvided", label:"📋 Health Certificate Provided" },
                        { key:"vaccinationIncluded",       label:"💉 Vaccination Included" },
                      ].map(({ key, label }) => (
                        <label key={key} className="flex items-center gap-3 cursor-pointer group">
                          <div onClick={() => set(key as keyof FormData, !(form as any)[key])}
                            className={cn("w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                              (form as any)[key] ? "bg-orange-500 border-orange-500" : "border-gray-300 group-hover:border-orange-400"
                            )}>
                            {(form as any)[key] && <Check className="w-3 h-3 text-white"/>}
                          </div>
                          <span className="text-sm text-gray-700">{label}</span>
                        </label>
                      ))}
                      {form.deliveryAvailable && (
                        <Field label="Delivery Radius (km)">
                          <input type="number" min="0" value={form.deliveryRadius} onChange={e => set("deliveryRadius",e.target.value)}
                            placeholder="e.g. 50" className="ps-input"/>
                        </Field>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ── STEP 4: Verification & Social ── */}
              {step === 4 && (
                <div className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Government ID Type" required>
                      <div className="relative">
                        <select value={form.govIdType} onChange={e => set("govIdType",e.target.value)} className="ps-input ps-select">
                          {GOV_IDS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3.5 top-3 w-4 h-4 text-gray-400 pointer-events-none"/>
                      </div>
                    </Field>
                    <Field label="ID Number" error={errors.govIdNumber} required>
                      <input type="text" value={form.govIdNumber} onChange={e => set("govIdNumber",e.target.value)}
                        placeholder="Enter ID number" className={cn("ps-input", errors.govIdNumber&&"error")}/>
                    </Field>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Upload ID Document" error={errors.govIdUrl}>
                      <label className={cn("ps-input flex items-center gap-3 cursor-pointer hover:border-orange-400 transition-colors",
                        uploading==="govIdUrl" && "opacity-60 cursor-wait")}>
                        <Camera className="w-4 h-4 text-gray-400 flex-shrink-0"/>
                        <span className="text-sm text-gray-500 truncate">
                          {uploading==="govIdUrl" ? "Uploading…" : form.govIdUrl ? "✓ Uploaded" : "Choose file (JPG/PNG/PDF)"}
                        </span>
                        <input type="file" accept="image/*,.pdf" className="hidden"
                          onChange={e => handleFileUpload(e,"govIdUrl")} disabled={!!uploading}/>
                      </label>
                      {form.govIdUrl && !form.govIdUrl.endsWith(".pdf") &&
                        <img src={form.govIdUrl} alt="ID" className="mt-2 h-16 rounded-lg object-cover border border-gray-200"/>}
                    </Field>
                    <Field label="Your Photo / Profile Picture">
                      <label className={cn("ps-input flex items-center gap-3 cursor-pointer hover:border-orange-400 transition-colors",
                        uploading==="sellerPhotoUrl" && "opacity-60 cursor-wait")}>
                        <Camera className="w-4 h-4 text-gray-400 flex-shrink-0"/>
                        <span className="text-sm text-gray-500 truncate">
                          {uploading==="sellerPhotoUrl" ? "Uploading…" : form.sellerPhotoUrl ? "✓ Uploaded" : "Professional photo"}
                        </span>
                        <input type="file" accept="image/*" className="hidden"
                          onChange={e => handleFileUpload(e,"sellerPhotoUrl")} disabled={!!uploading}/>
                      </label>
                      {form.sellerPhotoUrl &&
                        <img src={form.sellerPhotoUrl} alt="Profile" className="mt-2 w-16 h-16 rounded-full object-cover border-2 border-orange-200"/>}
                    </Field>
                  </div>

                  <div className="border-t border-gray-100 pt-5">
                    <p className="text-sm font-semibold text-gray-700 mb-3">Social Links (optional)</p>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field label="Instagram">
                        <div className="relative">
                          <Instagram className="absolute left-3.5 top-3 w-4 h-4 text-gray-400 pointer-events-none"/>
                          <input type="text" value={form.instagram} onChange={e => set("instagram",e.target.value)}
                            placeholder="@yourusername" className="ps-input pl-10"/>
                        </div>
                      </Field>
                      <Field label="Facebook">
                        <div className="relative">
                          <Facebook className="absolute left-3.5 top-3 w-4 h-4 text-gray-400 pointer-events-none"/>
                          <input type="text" value={form.facebook} onChange={e => set("facebook",e.target.value)}
                            placeholder="Page URL or name" className="ps-input pl-10"/>
                        </div>
                      </Field>
                    </div>
                  </div>

                  <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100 flex gap-3">
                    <Shield className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5"/>
                    <p className="text-sm text-orange-700 leading-relaxed">
                      By submitting, you confirm all information is accurate and agree to PetMatch's seller guidelines. Your profile will go live after verification (1–2 business days).
                    </p>
                  </div>

                  {errors.submit && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5"/>{errors.submit}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Nav footer */}
            <div className="px-8 py-5 border-t border-gray-100 flex items-center justify-between">
              <button type="button" onClick={step === 1 ? () => navigate("/signup") : goPrev}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:border-gray-300 transition-all">
                <ArrowLeft className="w-4 h-4"/>{step === 1 ? "Cancel" : "Back"}
              </button>
              <button type="button" onClick={goNext} disabled={isSubmitting}
                className="flex items-center gap-2 px-7 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-white font-bold text-sm hover:opacity-90 transition-all shadow-md shadow-orange-200/60 disabled:opacity-60">
                {isSubmitting
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full ps-spin"/>&nbsp;Creating…</>
                  : step < 4 ? <>Continue <ArrowRight className="w-4 h-4"/></>
                             : <>Submit Application <Check className="w-4 h-4"/></>
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
