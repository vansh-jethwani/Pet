import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSignUp } from "@clerk/clerk-react";
import {
  Heart, ArrowLeft, ArrowRight, Check, AlertCircle,
  User, Mail, Phone, Building, MapPin, Package, Shield,
  Clock, CreditCard, Instagram, Facebook, Globe, ChevronDown,
  MessageSquare, Camera, Truck, RotateCcw, Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Styles ──────────────────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=IBM+Plex+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');

  .so-root    { font-family: 'IBM Plex Sans', sans-serif; }
  .so-display { font-family: 'Syne', sans-serif; }

  @keyframes so-up   { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:none} }
  @keyframes so-in   { from{opacity:0;transform:translateX(24px)} to{opacity:1;transform:none} }
  @keyframes so-spin { to{transform:rotate(360deg)} }
  @keyframes so-check{ 0%{transform:scale(0)} 60%{transform:scale(1.2)} 100%{transform:scale(1)} }
  @keyframes so-glow { 0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,.4)} 50%{box-shadow:0 0 24px 8px rgba(16,185,129,.15)} }
  @keyframes so-bar  { from{width:0} }

  .so-up    { animation: so-up  .5s cubic-bezier(.34,1.56,.64,1) both; }
  .so-in    { animation: so-in  .4s cubic-bezier(.34,1.56,.64,1) both; }
  .so-spin  { animation: so-spin .8s linear infinite; }
  .so-check { animation: so-check .3s cubic-bezier(.34,1.56,.64,1) both; }
  .so-glow  { animation: so-glow 3s ease-in-out infinite; }
  .so-bar   { animation: so-bar .6s ease both; }

  .so-input {
    width:100%; padding:11px 16px; background:#f9fafb; border:1.5px solid #e5e7eb;
    border-radius:10px; font-family:'IBM Plex Sans',sans-serif; font-size:14px; color:#111827;
    transition:border-color .2s, box-shadow .2s, background .2s; outline:none;
  }
  .so-input:focus { border-color:#10b981; box-shadow:0 0 0 3px rgba(16,185,129,.15); background:#fff; }
  .so-input.error { border-color:#ef4444; background:#fef2f2; }
  .so-input::placeholder { color:#9ca3af; }
  .so-select { appearance:none; cursor:pointer; }

  .so-check-item {
    display:flex; align-items:center; gap:10px; padding:10px 14px;
    border-radius:10px; border:1.5px solid #e5e7eb; cursor:pointer;
    transition:all .18s; background:#f9fafb; font-size:13px; font-weight:500; color:#374151;
  }
  .so-check-item:hover { border-color:#10b981; color:#10b981; background:#f0fdf4; }
  .so-check-item.active { border-color:#10b981; background:#ecfdf5; color:#065f46; }

  .so-pill {
    display:inline-flex; align-items:center; gap:5px; padding:5px 12px;
    border-radius:6px; border:1.5px solid #e5e7eb; font-size:12px; font-weight:600;
    cursor:pointer; transition:all .15s; background:#f9fafb; color:#6b7280;
    font-family:'IBM Plex Sans',sans-serif;
  }
  .so-pill:hover  { border-color:#10b981; color:#10b981; background:#f0fdf4; }
  .so-pill.active { background:#10b981; border-color:#10b981; color:#fff; }

  .so-progress-dot {
    width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center;
    border:2px solid #e5e7eb; background:#fff; transition:all .3s; font-size:14px; font-weight:700;
  }
`;

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab",
  "Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh",
  "Uttarakhand","West Bengal","Delhi","Jammu & Kashmir","Ladakh","Puducherry",
];

const CATEGORIES = ["Food & Treats","Toys","Grooming","Accessories","Medicine","Cages & Kennels","Aquarium","Clothing","Supplements","Bedding","Training","Other"];
const PET_TYPES  = ["Dog","Cat","Bird","Fish","Reptile","Rabbit","Hamster","Other"];
const DAYS       = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const GOV_IDS    = [
  { value:"aadhar",          label:"Aadhaar Card"   },
  { value:"pan",             label:"PAN Card"       },
  { value:"passport",        label:"Passport"       },
  { value:"driving_license", label:"Driving License"},
];
const SHOP_TYPES = [
  { value:"physical", label:"Physical Store",        emoji:"🏪" },
  { value:"online",   label:"Online Only",           emoji:"💻" },
  { value:"both",     label:"Physical + Online",     emoji:"🌐" },
];

const CLOUDINARY_CLOUD_NAME    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

type Step = 1|2|3|4|5;

interface FormData {
  // Step 1
  fullName:string; email:string; phone:string; password:string; confirmPassword:string;
  // Step 2
  shopName:string; shopType:string; gstNumber:string; panNumber:string;
  yearsInBusiness:string; tagline:string; description:string; website:string;
  logoUrl:string;
  // Step 3
  address:string; city:string; state:string; pincode:string;
  categories:string[]; petTypesServed:string[];
  totalProducts:string; priceRangeMin:string; priceRangeMax:string;
  // Step 4
  deliveryAvailable:boolean; freeDeliveryAbove:string; returnPolicyDays:string; codAvailable:boolean;
  openingHours:string; closingHours:string; workingDays:string[];
  // Step 5
  govIdType:string; govIdNumber:string; govIdUrl:string; shopPhotoUrl:string;
  upiId:string; instagram:string; facebook:string; whatsapp:string;
}

const INIT: FormData = {
  fullName:"", email:"", phone:"", password:"", confirmPassword:"",
  shopName:"", shopType:"both", gstNumber:"", panNumber:"",
  yearsInBusiness:"", tagline:"", description:"", website:"", logoUrl:"",
  address:"", city:"", state:"", pincode:"",
  categories:[], petTypesServed:[], totalProducts:"", priceRangeMin:"", priceRangeMax:"",
  deliveryAvailable:true, freeDeliveryAbove:"500", returnPolicyDays:"7", codAvailable:true,
  openingHours:"09:00", closingHours:"21:00", workingDays:["Mon","Tue","Wed","Thu","Fri","Sat"],
  govIdType:"pan", govIdNumber:"", govIdUrl:"", shopPhotoUrl:"",
  upiId:"", instagram:"", facebook:"", whatsapp:"",
};

const STEPS = [
  { num:1, title:"Account",              sub:"Login credentials",        icon:User     },
  { num:2, title:"Shop Info",            sub:"Business details",          icon:Building },
  { num:3, title:"Location & Products",  sub:"Address & what you sell",   icon:Package  },
  { num:4, title:"Operations",           sub:"Delivery & hours",          icon:Truck    },
  { num:5, title:"Verify",               sub:"ID & social",               icon:Shield   },
];

function Field({ label, error, children, required }: { label:string; error?:string; children:React.ReactNode; required?:boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-gray-700">
        {label}{required && <span className="text-emerald-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{error}</p>}
    </div>
  );
}

async function uploadCloudinary(file: File): Promise<string> {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) throw new Error("Cloudinary not configured");
  const fd = new FormData();
  fd.append("file", file); fd.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  const r = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,{method:"POST",body:fd});
  const d = await r.json();
  if (!r.ok) throw new Error(d.error?.message||"Upload failed");
  return d.secure_url;
}

export default function ShopOwnerSignUp() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const navigate = useNavigate();

  const [step,         setStep]         = useState<Step>(1);
  const [form,         setForm]         = useState<FormData>(INIT);
  const [errors,       setErrors]       = useState<Partial<Record<keyof FormData|"submit",string>>>({});
  const [stage,        setStage]        = useState<"form"|"verify"|"done">("form");
  const [otp,          setOtp]          = useState("");
  const [otpError,     setOtpError]     = useState("");
  const [isVerifying,  setIsVerifying]  = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading,    setUploading]    = useState<string|null>(null);
  const [showPass,     setShowPass]     = useState(false);

  const set = (key: keyof FormData, val: any) => {
    setForm(p => ({ ...p, [key]: val }));
    setErrors(p => ({ ...p, [key]:"" }));
  };

  const toggleArr = (key: "categories"|"petTypesServed"|"workingDays", val: string) => {
    const cur = form[key] as string[];
    set(key, cur.includes(val) ? cur.filter(x=>x!==val) : [...cur, val]);
  };

  const validate = (s: Step) => {
    const e: any = {};
    if (s===1) {
      if (!form.fullName.trim()) e.fullName = "Required";
      if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Valid email required";
      if (!form.phone.trim() || form.phone.replace(/\D/g,"").length < 10) e.phone = "Valid 10-digit number";
      if (!form.password || form.password.length < 8) e.password = "Min 8 characters";
      if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords don't match";
    }
    if (s===2) {
      if (!form.shopName.trim())   e.shopName   = "Required";
      if (!form.description.trim())e.description = "Required";
    }
    if (s===3) {
      if (!form.address.trim()) e.address = "Required";
      if (!form.city.trim())    e.city    = "Required";
      if (!form.state)          e.state   = "Required";
      if (!form.pincode.trim() || form.pincode.replace(/\D/g,"").length!==6) e.pincode = "6-digit required";
      if (form.categories.length===0)   e.categories   = "Select at least one";
      if (form.petTypesServed.length===0)e.petTypesServed= "Select at least one";
    }
    if (s===5) {
      if (!form.govIdNumber.trim()) e.govIdNumber = "Required";
    }
    return e;
  };

  const goNext = () => {
    const e = validate(step);
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    if (step < 5) setStep((step+1) as Step);
    else handleSubmit();
  };
  const goPrev = () => { setErrors({}); setStep(Math.max(1,step-1) as Step); };

  const handleSubmit = async () => {
    if (!isLoaded) return;
    setIsSubmitting(true); setErrors({});
    try {
      const parts = form.fullName.trim().split(" ");
      await signUp!.create({ firstName:parts[0], lastName:parts.slice(1).join(" "), emailAddress:form.email, password:form.password });
      await signUp!.prepareEmailAddressVerification({ strategy:"email_code" });
      setStage("verify");
    } catch (err:any) {
      setErrors({ submit: err?.errors?.[0]?.longMessage || "Something went wrong." });
    } finally { setIsSubmitting(false); }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    setIsVerifying(true); setOtpError("");
    try {
      const result = await signUp!.attemptEmailAddressVerification({ code:otp });
      if (result.status!=="complete") throw new Error("Incomplete");
      await setActive!({ session:result.createdSessionId });

      const payload = {
        ...form,
        clerkId:        result.createdUserId ?? "",
        yearsInBusiness:parseInt(form.yearsInBusiness)||0,
        totalProducts:  parseInt(form.totalProducts)||0,
        priceRangeMin:  parseInt(form.priceRangeMin)||0,
        priceRangeMax:  parseInt(form.priceRangeMax)||0,
        freeDeliveryAbove:parseInt(form.freeDeliveryAbove)||500,
        returnPolicyDays: parseInt(form.returnPolicyDays)||7,
      };
      const res = await fetch("/api/sellers/shops", {
        method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.error || "Failed to save your shop profile. Please contact support.");
      }

      setStage("done");
    } catch (err:any) {
      setOtpError(err?.errors?.[0]?.longMessage || err?.message || "Invalid code.");
    } finally { setIsVerifying(false); }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: "govIdUrl"|"shopPhotoUrl"|"logoUrl") => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(field);
    try {
      const url = await uploadCloudinary(file);
      set(field, url);
    } catch (err:any) {
      setErrors(p => ({ ...p, [field]: err?.message || "Upload failed" }));
    } finally { setUploading(null); e.target.value=""; }
  };

  const progress = ((step-1)/4)*100;

  /* ── Done ── */
  if (stage==="done") return (
    <div className="so-root min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-3xl border border-gray-800 p-10 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg so-glow so-check">
          <Check className="w-10 h-10 text-white"/>
        </div>
        <h2 className="so-display text-3xl font-bold text-white mb-3">Shop Registered!</h2>
        <p className="text-gray-400 mb-2">Welcome, <strong className="text-white">{form.fullName}</strong>!</p>
        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
          <strong className="text-emerald-400">{form.shopName}</strong> is under review. We'll verify your documents and go live within 1–2 business days.
        </p>
        <div className="bg-gray-800 rounded-2xl p-4 mb-8 text-left border border-gray-700">
          <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-3">Next steps</p>
          {["Shop profile under review","Documents & GST verified","Store goes live on marketplace"].map((s,i) => (
            <div key={i} className="flex items-center gap-3 py-1.5 text-sm text-gray-300">
              <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold">{i+1}</div>
              {s}
            </div>
          ))}
        </div>
        <button onClick={() => navigate("/")} className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold hover:opacity-90 transition-all">
          Go to Home
        </button>
      </div>
    </div>
  );

  /* ── OTP ── */
  if (stage==="verify") return (
    <div className="so-root min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-900/50 border border-emerald-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-emerald-400"/>
          </div>
          <h2 className="so-display text-2xl font-bold text-white mb-2">Check your email</h2>
          <p className="text-gray-400 text-sm">6-digit code sent to <strong className="text-white">{form.email}</strong></p>
        </div>
        <form onSubmit={handleVerify} className="space-y-4">
          <input type="text" inputMode="numeric" value={otp} maxLength={6}
            onChange={e => { setOtp(e.target.value.replace(/\D/g,"").slice(0,6)); setOtpError(""); }}
            placeholder="000000"
            className={cn("so-input text-center text-2xl tracking-[.5em] font-bold bg-gray-900 border-gray-700 text-white", otpError&&"error")}/>
          {otpError && <p className="text-sm text-red-400 flex items-center gap-1.5 justify-center"><AlertCircle className="w-4 h-4"/>{otpError}</p>}
          <button type="submit" disabled={isVerifying||otp.length<6}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold disabled:opacity-50 transition-all">
            {isVerifying?"Verifying…":"Verify & Launch Shop"}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-5">
          Didn't receive it?{" "}
          <button type="button" onClick={() => signUp?.prepareEmailAddressVerification({strategy:"email_code"})}
            className="text-emerald-400 font-semibold hover:text-emerald-300">Resend</button>
        </p>
      </div>
    </div>
  );

  /* ── Main form — dark editorial ── */
  return (
    <>
      <style>{STYLES}</style>
      <div className="so-root min-h-screen bg-gray-950">
        {/* Accent glow */}
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-emerald-500/5 blur-3xl pointer-events-none"/>

        {/* Header */}
        <header className="relative z-10 flex items-center justify-between px-6 py-5 max-w-3xl mx-auto border-b border-gray-800">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-400 rounded-xl flex items-center justify-center shadow-md shadow-emerald-900">
              <Heart className="w-4 h-4 text-white fill-white"/>
            </div>
            <span className="so-display text-xl font-bold text-white">PetMatch</span>
          </Link>
          <Link to="/signup" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-emerald-400 transition-colors font-medium">
            <ArrowLeft className="w-4 h-4"/>Back
          </Link>
        </header>

        <div className="relative z-10 max-w-3xl mx-auto px-4 py-10 pb-20">
          {/* Hero */}
          <div className="relative bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 rounded-3xl border border-gray-700 p-8 mb-8 overflow-hidden so-up">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-3xl rounded-full"/>
            <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-teal-500/5 blur-3xl rounded-full"/>
            <div className="relative flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl border border-emerald-700 bg-emerald-900/40 flex items-center justify-center text-4xl so-glow">🛍️</div>
              <div>
                <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-0.5">Shop Registration</p>
                <h1 className="so-display text-2xl sm:text-3xl font-bold text-white">Open Your Pet Store</h1>
                <p className="text-gray-400 text-sm mt-1">Sell products to thousands of pet owners</p>
              </div>
            </div>
          </div>

          {/* Step indicator */}
          <div className="mb-8 so-up" style={{animationDelay:"60ms"}}>
            <div className="flex items-start justify-between relative">
              <div className="absolute top-[18px] left-[10%] right-[10%] h-px bg-gray-800 z-0"/>
              {STEPS.map((s) => {
                const done   = step > s.num;
                const active = step === s.num;
                const Icon   = s.icon;
                return (
                  <div key={s.num} className="relative z-10 flex flex-col items-center gap-2">
                    <div className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                      done   ? "bg-emerald-500 border-emerald-500 text-white"
                             : active ? "bg-gray-900 border-emerald-500 text-emerald-400"
                             : "bg-gray-900 border-gray-700 text-gray-600"
                    )}>
                      {done ? <Check className="w-4 h-4"/> : <Icon className="w-3.5 h-3.5"/>}
                    </div>
                    <p className={cn("hidden sm:block text-[11px] font-bold text-center",
                      active?"text-emerald-400":done?"text-gray-300":"text-gray-600"
                    )}>{s.title}</p>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 h-1 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full so-bar transition-all duration-500" style={{width:`${progress}%`}}/>
            </div>
          </div>

          {/* Card */}
          <div className="bg-gray-900 rounded-3xl border border-gray-800 overflow-hidden so-in" key={step}>
            <div className="px-8 py-5 border-b border-gray-800 bg-gray-900/80 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-900/50 border border-emerald-800 flex items-center justify-center">
                {(() => { const Icon = STEPS[step-1].icon; return <Icon className="w-5 h-5 text-emerald-400"/>; })()}
              </div>
              <div>
                <h2 className="so-display text-xl font-bold text-white">{STEPS[step-1].title}</h2>
                <p className="text-sm text-gray-500">{STEPS[step-1].sub} · Step {step}/5</p>
              </div>
            </div>

            <div className="p-8 [&_.so-input]:bg-gray-800 [&_.so-input]:border-gray-700 [&_.so-input]:text-white [&_.so-input:focus]:border-emerald-500 [&_.so-input:focus]:bg-gray-800 [&_.so-input::placeholder]:text-gray-500 [&_.so-check-item]:bg-gray-800 [&_.so-check-item]:border-gray-700 [&_.so-check-item]:text-gray-300 [&_.so-pill]:bg-gray-800 [&_.so-pill]:border-gray-700 [&_.so-pill]:text-gray-400">

              {/* ── STEP 1: Account ── */}
              {step===1 && (
                <div className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Full Name" error={errors.fullName} required>
                      <div className="relative"><User className="absolute left-3.5 top-3 w-4 h-4 text-gray-500 pointer-events-none"/>
                        <input type="text" value={form.fullName} onChange={e=>set("fullName",e.target.value)}
                          placeholder="Your full name" className={cn("so-input pl-10",errors.fullName&&"error")}/></div>
                    </Field>
                    <Field label="Email Address" error={errors.email} required>
                      <div className="relative"><Mail className="absolute left-3.5 top-3 w-4 h-4 text-gray-500 pointer-events-none"/>
                        <input type="email" value={form.email} onChange={e=>set("email",e.target.value)}
                          placeholder="you@example.com" className={cn("so-input pl-10",errors.email&&"error")}/></div>
                    </Field>
                    <Field label="Phone" error={errors.phone} required>
                      <div className="relative"><Phone className="absolute left-3.5 top-3 w-4 h-4 text-gray-500 pointer-events-none"/>
                        <input type="tel" value={form.phone} onChange={e=>set("phone",e.target.value)}
                          placeholder="+91 98765 43210" className={cn("so-input pl-10",errors.phone&&"error")}/></div>
                    </Field>
                    <Field label="Password" error={errors.password} required>
                      <div className="relative">
                        <input type={showPass?"text":"password"} value={form.password} onChange={e=>set("password",e.target.value)}
                          placeholder="Min 8 characters" className={cn("so-input pr-14",errors.password&&"error")}/>
                        <button type="button" onClick={()=>setShowPass(v=>!v)}
                          className="absolute right-3.5 top-3 text-xs text-gray-500 hover:text-emerald-400 font-semibold">{showPass?"Hide":"Show"}</button>
                      </div>
                    </Field>
                    <Field label="Confirm Password" error={errors.confirmPassword} required>
                      <input type="password" value={form.confirmPassword} onChange={e=>set("confirmPassword",e.target.value)}
                        placeholder="Repeat password" className={cn("so-input",errors.confirmPassword&&"error")}/>
                    </Field>
                  </div>
                </div>
              )}

              {/* ── STEP 2: Shop Info ── */}
              {step===2 && (
                <div className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Shop Name" error={errors.shopName} required>
                      <div className="relative"><Building className="absolute left-3.5 top-3 w-4 h-4 text-gray-500 pointer-events-none"/>
                        <input type="text" value={form.shopName} onChange={e=>set("shopName",e.target.value)}
                          placeholder="e.g. Pawsome Pet Store" className={cn("so-input pl-10",errors.shopName&&"error")}/></div>
                    </Field>
                    <Field label="Tagline">
                      <input type="text" value={form.tagline} onChange={e=>set("tagline",e.target.value)}
                        placeholder="e.g. Everything for your pet" className="so-input"/>
                    </Field>
                  </div>

                  <Field label="Shop Type" required>
                    <div className="grid grid-cols-3 gap-3">
                      {SHOP_TYPES.map(t => (
                        <button key={t.value} type="button" onClick={()=>set("shopType",t.value)}
                          className={cn("so-check-item flex-col items-center justify-center gap-1.5 py-3 text-center",form.shopType===t.value&&"active")}>
                          <span className="text-2xl">{t.emoji}</span>
                          <span className="text-xs font-semibold">{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </Field>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="GST Number">
                      <input type="text" value={form.gstNumber} onChange={e=>set("gstNumber",e.target.value)}
                        placeholder="22AAAAA0000A1Z5" className="so-input"/>
                    </Field>
                    <Field label="PAN Number">
                      <input type="text" value={form.panNumber} onChange={e=>set("panNumber",e.target.value.toUpperCase())}
                        placeholder="ABCDE1234F" maxLength={10} className="so-input"/>
                    </Field>
                    <Field label="Years in Business">
                      <input type="number" min="0" value={form.yearsInBusiness} onChange={e=>set("yearsInBusiness",e.target.value)}
                        placeholder="e.g. 3" className="so-input"/>
                    </Field>
                    <Field label="Website">
                      <div className="relative"><Globe className="absolute left-3.5 top-3 w-4 h-4 text-gray-500 pointer-events-none"/>
                        <input type="url" value={form.website} onChange={e=>set("website",e.target.value)}
                          placeholder="https://" className="so-input pl-10"/></div>
                    </Field>
                  </div>

                  <Field label="About Your Shop" error={errors.description} required>
                    <textarea rows={4} value={form.description} onChange={e=>set("description",e.target.value)}
                      placeholder="Describe your shop, product quality, and what makes you special…"
                      className={cn("so-input resize-none",errors.description&&"error")}/>
                  </Field>

                  <Field label="Shop Logo">
                    <label className={cn("so-input flex items-center gap-3 cursor-pointer hover:border-emerald-500 transition-colors",uploading==="logoUrl"&&"opacity-60 cursor-wait")}>
                      <Camera className="w-4 h-4 text-gray-500 flex-shrink-0"/>
                      <span className="text-sm text-gray-500 truncate">
                        {uploading==="logoUrl"?"Uploading…":form.logoUrl?"✓ Logo uploaded":"Upload shop logo"}
                      </span>
                      <input type="file" accept="image/*" className="hidden" onChange={e=>handleUpload(e,"logoUrl")} disabled={!!uploading}/>
                    </label>
                    {form.logoUrl && <img src={form.logoUrl} alt="Logo" className="mt-2 w-16 h-16 rounded-xl object-cover border border-gray-700"/>}
                  </Field>
                </div>
              )}

              {/* ── STEP 3: Products ── */}
              {step===3 && (
                <div className="space-y-5">
                  <Field label="Street Address" error={errors.address} required>
                    <div className="relative"><MapPin className="absolute left-3.5 top-3 w-4 h-4 text-gray-500 pointer-events-none"/>
                      <input type="text" value={form.address} onChange={e=>set("address",e.target.value)}
                        placeholder="Building, street, area" className={cn("so-input pl-10",errors.address&&"error")}/></div>
                  </Field>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <Field label="City" error={errors.city} required>
                      <input type="text" value={form.city} onChange={e=>set("city",e.target.value)}
                        placeholder="e.g. Delhi" className={cn("so-input",errors.city&&"error")}/>
                    </Field>
                    <Field label="State" error={errors.state} required>
                      <div className="relative">
                        <select value={form.state} onChange={e=>set("state",e.target.value)} className={cn("so-input so-select",errors.state&&"error")}>
                          <option value="">Select state</option>
                          {INDIAN_STATES.map(s=><option key={s}>{s}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3.5 top-3 w-4 h-4 text-gray-500 pointer-events-none"/>
                      </div>
                    </Field>
                    <Field label="Pincode" error={errors.pincode} required>
                      <input type="text" maxLength={6} value={form.pincode} onChange={e=>set("pincode",e.target.value.replace(/\D/g,""))}
                        placeholder="110001" className={cn("so-input",errors.pincode&&"error")}/>
                    </Field>
                  </div>

                  <Field label="Product Categories" error={errors.categories as string} required>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {CATEGORIES.map(c => (
                        <button key={c} type="button" onClick={()=>toggleArr("categories",c)}
                          className={cn("so-pill",form.categories.includes(c)&&"active")}>{c}</button>
                      ))}
                    </div>
                  </Field>

                  <Field label="Pet Types You Cater To" error={errors.petTypesServed as string} required>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {PET_TYPES.map(t => (
                        <button key={t} type="button" onClick={()=>toggleArr("petTypesServed",t.toLowerCase())}
                          className={cn("so-pill",form.petTypesServed.includes(t.toLowerCase())&&"active")}>{t}</button>
                      ))}
                    </div>
                  </Field>

                  <div className="grid sm:grid-cols-3 gap-4">
                    <Field label="Total Products (approx.)">
                      <input type="number" min="0" value={form.totalProducts} onChange={e=>set("totalProducts",e.target.value)}
                        placeholder="e.g. 200" className="so-input"/>
                    </Field>
                    <Field label="Min Price (₹)">
                      <input type="number" min="0" value={form.priceRangeMin} onChange={e=>set("priceRangeMin",e.target.value)}
                        placeholder="e.g. 99" className="so-input"/>
                    </Field>
                    <Field label="Max Price (₹)">
                      <input type="number" min="0" value={form.priceRangeMax} onChange={e=>set("priceRangeMax",e.target.value)}
                        placeholder="e.g. 9999" className="so-input"/>
                    </Field>
                  </div>
                </div>
              )}

              {/* ── STEP 4: Operations ── */}
              {step===4 && (
                <div className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    {[
                      { key:"deliveryAvailable", label:"🚚 Home Delivery Available" },
                      { key:"codAvailable",      label:"💵 Cash on Delivery (COD)" },
                    ].map(({key,label}) => (
                      <button key={key} type="button" onClick={()=>set(key as keyof FormData,!(form as any)[key])}
                        className={cn("so-check-item",( form as any)[key]&&"active")}>
                        <div className={cn("w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0",
                          (form as any)[key]?"bg-emerald-500 border-emerald-500":"border-gray-600"
                        )}>
                          {(form as any)[key] && <Check className="w-3 h-3 text-white"/>}
                        </div>
                        {label}
                      </button>
                    ))}
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Free Delivery Above (₹)">
                      <div className="relative"><Truck className="absolute left-3.5 top-3 w-4 h-4 text-gray-500 pointer-events-none"/>
                        <input type="number" min="0" value={form.freeDeliveryAbove} onChange={e=>set("freeDeliveryAbove",e.target.value)}
                          placeholder="e.g. 500" className="so-input pl-10"/></div>
                    </Field>
                    <Field label="Return Policy (days)">
                      <div className="relative"><RotateCcw className="absolute left-3.5 top-3 w-4 h-4 text-gray-500 pointer-events-none"/>
                        <input type="number" min="0" max="30" value={form.returnPolicyDays} onChange={e=>set("returnPolicyDays",e.target.value)}
                          placeholder="e.g. 7" className="so-input pl-10"/></div>
                    </Field>
                    <Field label="Opening Time">
                      <div className="relative"><Clock className="absolute left-3.5 top-3 w-4 h-4 text-gray-500 pointer-events-none"/>
                        <input type="time" value={form.openingHours} onChange={e=>set("openingHours",e.target.value)} className="so-input pl-10"/></div>
                    </Field>
                    <Field label="Closing Time">
                      <div className="relative"><Clock className="absolute left-3.5 top-3 w-4 h-4 text-gray-500 pointer-events-none"/>
                        <input type="time" value={form.closingHours} onChange={e=>set("closingHours",e.target.value)} className="so-input pl-10"/></div>
                    </Field>
                  </div>

                  <Field label="Working Days">
                    <div className="flex flex-wrap gap-2 mt-1">
                      {DAYS.map(d => (
                        <button key={d} type="button" onClick={()=>toggleArr("workingDays",d)}
                          className={cn("so-pill",form.workingDays.includes(d)&&"active")}>{d}</button>
                      ))}
                    </div>
                  </Field>

                  <div className="border-t border-gray-800 pt-5">
                    <p className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2"><CreditCard className="w-4 h-4 text-emerald-400"/>Payout Details (optional)</p>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field label="UPI ID">
                        <input type="text" value={form.upiId} onChange={e=>set("upiId",e.target.value)}
                          placeholder="yourname@upi" className="so-input"/>
                      </Field>
                      <Field label="WhatsApp Number">
                        <div className="relative"><MessageSquare className="absolute left-3.5 top-3 w-4 h-4 text-gray-500 pointer-events-none"/>
                          <input type="tel" value={form.whatsapp} onChange={e=>set("whatsapp",e.target.value)}
                            placeholder="+91 98765 43210" className="so-input pl-10"/></div>
                      </Field>
                    </div>
                  </div>
                </div>
              )}

              {/* ── STEP 5: Verification ── */}
              {step===5 && (
                <div className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Government ID Type" required>
                      <div className="relative">
                        <select value={form.govIdType} onChange={e=>set("govIdType",e.target.value)} className="so-input so-select">
                          {GOV_IDS.map(g=><option key={g.value} value={g.value}>{g.label}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3.5 top-3 w-4 h-4 text-gray-500 pointer-events-none"/>
                      </div>
                    </Field>
                    <Field label="ID Number" error={errors.govIdNumber} required>
                      <input type="text" value={form.govIdNumber} onChange={e=>set("govIdNumber",e.target.value)}
                        placeholder="Enter ID number" className={cn("so-input",errors.govIdNumber&&"error")}/>
                    </Field>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Upload ID Document" error={errors.govIdUrl}>
                      <label className={cn("so-input flex items-center gap-3 cursor-pointer hover:border-emerald-500 transition-colors",uploading==="govIdUrl"&&"opacity-60 cursor-wait")}>
                        <Camera className="w-4 h-4 text-gray-500 flex-shrink-0"/>
                        <span className="text-sm text-gray-500 truncate">
                          {uploading==="govIdUrl"?"Uploading…":form.govIdUrl?"✓ Uploaded":"Choose file"}
                        </span>
                        <input type="file" accept="image/*,.pdf" className="hidden" onChange={e=>handleUpload(e,"govIdUrl")} disabled={!!uploading}/>
                      </label>
                      {form.govIdUrl&&!form.govIdUrl.endsWith(".pdf")&&
                        <img src={form.govIdUrl} alt="ID" className="mt-2 h-14 rounded-lg object-cover border border-gray-700"/>}
                    </Field>
                    <Field label="Shop / Store Photo">
                      <label className={cn("so-input flex items-center gap-3 cursor-pointer hover:border-emerald-500 transition-colors",uploading==="shopPhotoUrl"&&"opacity-60 cursor-wait")}>
                        <Camera className="w-4 h-4 text-gray-500 flex-shrink-0"/>
                        <span className="text-sm text-gray-500 truncate">
                          {uploading==="shopPhotoUrl"?"Uploading…":form.shopPhotoUrl?"✓ Uploaded":"Shop exterior photo"}
                        </span>
                        <input type="file" accept="image/*" className="hidden" onChange={e=>handleUpload(e,"shopPhotoUrl")} disabled={!!uploading}/>
                      </label>
                      {form.shopPhotoUrl&&
                        <img src={form.shopPhotoUrl} alt="Shop" className="mt-2 h-14 rounded-lg object-cover border border-gray-700"/>}
                    </Field>
                  </div>

                  <div className="border-t border-gray-800 pt-4">
                    <p className="text-sm font-semibold text-gray-300 mb-3">Social Links (optional)</p>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field label="Instagram">
                        <div className="relative"><Instagram className="absolute left-3.5 top-3 w-4 h-4 text-gray-500 pointer-events-none"/>
                          <input type="text" value={form.instagram} onChange={e=>set("instagram",e.target.value)}
                            placeholder="@yourshop" className="so-input pl-10"/></div>
                      </Field>
                      <Field label="Facebook">
                        <div className="relative"><Facebook className="absolute left-3.5 top-3 w-4 h-4 text-gray-500 pointer-events-none"/>
                          <input type="text" value={form.facebook} onChange={e=>set("facebook",e.target.value)}
                            placeholder="Page URL" className="so-input pl-10"/></div>
                      </Field>
                    </div>
                  </div>

                  <div className="bg-gray-800 rounded-2xl p-4 border border-gray-700 flex gap-3">
                    <Shield className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5"/>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      By submitting you certify all details are accurate. Your shop will be reviewed and listed within 1–2 business days after document verification.
                    </p>
                  </div>

                  {errors.submit && (
                    <div className="flex items-start gap-2 p-3 bg-red-950 border border-red-800 rounded-xl text-sm text-red-400">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5"/>{errors.submit}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Nav footer */}
            <div className="px-8 py-5 border-t border-gray-800 flex items-center justify-between bg-gray-900/50">
              <button type="button" onClick={step===1?()=>navigate("/signup"):goPrev}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-gray-700 text-gray-400 font-semibold text-sm hover:border-gray-600 hover:text-gray-200 transition-all">
                <ArrowLeft className="w-4 h-4"/>{step===1?"Cancel":"Back"}
              </button>
              <button type="button" onClick={goNext} disabled={isSubmitting}
                className="flex items-center gap-2 px-7 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-emerald-900/50 disabled:opacity-60">
                {isSubmitting
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full so-spin"/>&nbsp;Creating…</>
                  : step<5 ? <>Continue <ArrowRight className="w-4 h-4"/></> : <>Launch My Shop <Check className="w-4 h-4"/></>
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
