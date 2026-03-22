import { useState, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Stethoscope, Mail, Lock, User, Eye, EyeOff, ArrowLeft, ArrowRight,
  Check, Phone, MapPin, Award, BookOpen, Shield, Clock,
  ChevronRight, Camera, FileText, Building, AlertCircle, Video,
} from "lucide-react";
import { useSignUp } from "@clerk/clerk-react";
import { cn } from "@/lib/utils";

/* ─── Types ──────────────────────────────────────────────────────────────── */
type Step = 1 | 2 | 3 | 4;

interface AccountData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface ProfessionalData {
  title: string;
  licenseNumber: string;
  experience: string;
  specialties: string[];
  qualifications: string;
  clinic: string;
}

interface AvailabilityData {
  consultationTypes: ("video" | "phone" | "inperson")[];
  videoPrice: string;
  phonePrice: string;
  inpersonPrice: string;
  responseTime: string;
  location: string;
  bio: string;
}

const SPECIALTY_OPTIONS = [
  "Dogs", "Cats", "Birds", "Exotic Pets", "Fish & Aquatic",
  "Reptiles", "Small Animals", "Emergency Care", "Surgery",
  "Dentistry", "Dermatology", "Nutrition", "Behavioral Issues",
  "Preventive Care", "Oncology", "Cardiology",
];

const TITLE_OPTIONS = ["DVM", "DVM, MS", "DVM, PhD", "VMD", "BVSc", "BVMS"];

// BUG FIX: Use explicit number keys so STEP_CONFIG[step-1] never goes out of bounds
const STEP_CONFIG = [
  { title: "Account Details",    subtitle: "Create your login credentials",   Icon: User        },
  { title: "Professional Info",  subtitle: "Your credentials & specialties",   Icon: Award       },
  { title: "Consultation Setup", subtitle: "How you'll connect with patients", Icon: Clock       },
  { title: "Review & Submit",    subtitle: "Confirm your application",         Icon: Check       },
] as const;

/* ─── Sub-components defined OUTSIDE parent (fixes re-render / blank page) ── */

// BUG FIX: Field and other helpers must be defined outside VetSignUp so they
// are stable references and don't cause the parent to unmount children on
// every render (which blanks the page mid-step).

function inputCls(hasError: boolean, extra = "") {
  return cn(
    "w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all bg-white",
    hasError
      ? "border-red-400 bg-red-50"
      : "border-gray-200 hover:border-gray-300",
    extra
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="block text-sm font-semibold text-gray-700">{label}</label>
      {children}
      {error && (
        <p className="text-xs text-red-500 font-medium flex items-center gap-1">
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

function ReviewBlock({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
      <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-gray-400" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{title}</p>
        <p className="text-sm font-semibold text-gray-800 mt-0.5 break-words">{value}</p>
      </div>
    </div>
  );
}

/* ─── Step progress bar ───────────────────────────────────────────────────── */
function StepBar({ step }: { step: Step }) {
  const progress = ((step - 1) / 3) * 100;
  return (
    <div className="flex items-start justify-between mb-8 relative">
      {/* track */}
      <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 z-0">
        <div
          className="h-full bg-gradient-to-r from-red-500 to-rose-400 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      {STEP_CONFIG.map((s, i) => {
        const stepNum = (i + 1) as Step;
        const isActive = step === stepNum;
        const isDone = step > stepNum;
        const Icon = s.Icon;
        return (
          <div key={i} className="relative z-10 flex flex-col items-center gap-2">
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                isDone
                  ? "bg-gradient-to-br from-red-500 to-rose-400 border-red-500 text-white shadow-md shadow-red-200"
                  : isActive
                  ? "bg-white border-red-500 text-red-500 shadow-md shadow-red-100"
                  : "bg-white border-gray-200 text-gray-400"
              )}
            >
              {isDone ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
            </div>
            <p
              className={cn(
                "hidden sm:block text-xs font-bold transition-colors text-center",
                isActive ? "text-red-500" : isDone ? "text-gray-700" : "text-gray-400"
              )}
            >
              {s.title}
            </p>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   STEP PANELS — each is its own component so state updates in one step
   never cause another step to unmount/remount (which blanked the page)
═══════════════════════════════════════════════════════════════════════════ */

function Step1Panel({
  account,
  setAccount,
  errors,
  profilePhoto,
  onPhotoClick,
  showPassword,
  setShowPassword,
  showConfirm,
  setShowConfirm,
}: {
  account: AccountData;
  setAccount: React.Dispatch<React.SetStateAction<AccountData>>;
  errors: Record<string, string>;
  profilePhoto: string | null;
  onPhotoClick: () => void;
  showPassword: boolean;
  setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
  showConfirm: boolean;
  setShowConfirm: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  return (
    <div className="space-y-5">
      {/* Photo upload — BUG FIX: div not button so it can't accidentally submit */}
      <div className="flex items-center gap-5">
        <div
          role="button"
          tabIndex={0}
          onClick={onPhotoClick}
          onKeyDown={(e) => e.key === "Enter" && onPhotoClick()}
          className="relative w-20 h-20 rounded-2xl bg-red-50 border-2 border-dashed border-red-200 flex items-center justify-center cursor-pointer hover:bg-red-100 transition-colors flex-shrink-0 overflow-hidden"
        >
          {profilePhoto ? (
            <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <Camera className="w-7 h-7 text-red-300" />
          )}
        </div>
        <div>
          <p className="font-semibold text-gray-800 text-sm">Profile Photo</p>
          <p className="text-xs text-gray-400 mt-0.5">Upload a professional photo (optional)</p>
          {/* BUG FIX: type="button" prevents accidental form submission */}
          <button
            type="button"
            onClick={onPhotoClick}
            className="text-xs text-red-500 font-semibold mt-1.5 hover:text-red-600"
          >
            {profilePhoto ? "Change photo" : "Upload photo"}
          </button>
        </div>
      </div>

      <Field label="Full Name" error={errors.fullName}>
        <div className="relative">
          <User className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={account.fullName}
            onChange={(e) => setAccount((p) => ({ ...p, fullName: e.target.value }))}
            placeholder="Dr. Jane Smith"
            className={inputCls(!!errors.fullName, "pl-11")}
          />
        </div>
      </Field>

      <Field label="Email Address" error={errors.email}>
        <div className="relative">
          <Mail className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400 pointer-events-none" />
          <input
            type="email"
            value={account.email}
            onChange={(e) => setAccount((p) => ({ ...p, email: e.target.value }))}
            placeholder="jane@vetclinic.com"
            className={inputCls(!!errors.email, "pl-11")}
          />
        </div>
      </Field>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Password" error={errors.password}>
          <div className="relative">
            <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400 pointer-events-none" />
            <input
              type={showPassword ? "text" : "password"}
              value={account.password}
              onChange={(e) => setAccount((p) => ({ ...p, password: e.target.value }))}
              placeholder="Min 8 characters"
              className={inputCls(!!errors.password, "pl-11 pr-11")}
            />
            {/* BUG FIX: type="button" on all toggle buttons */}
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </Field>

        <Field label="Confirm Password" error={errors.confirmPassword}>
          <div className="relative">
            <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400 pointer-events-none" />
            <input
              type={showConfirm ? "text" : "password"}
              value={account.confirmPassword}
              onChange={(e) => setAccount((p) => ({ ...p, confirmPassword: e.target.value }))}
              placeholder="Repeat password"
              className={inputCls(!!errors.confirmPassword, "pl-11 pr-11")}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600"
            >
              {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </Field>
      </div>
    </div>
  );
}

function Step2Panel({
  professional,
  setProfessional,
  errors,
}: {
  professional: ProfessionalData;
  setProfessional: React.Dispatch<React.SetStateAction<ProfessionalData>>;
  errors: Record<string, string>;
}) {
  const toggleSpecialty = (s: string) =>
    setProfessional((prev) => ({
      ...prev,
      specialties: prev.specialties.includes(s)
        ? prev.specialties.filter((x) => x !== s)
        : [...prev.specialties, s],
    }));

  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Professional Title">
          <div className="relative">
            <Award className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400 pointer-events-none" />
            <select
              value={professional.title}
              onChange={(e) => setProfessional((p) => ({ ...p, title: e.target.value }))}
              className={inputCls(false, "pl-11")}
            >
              {TITLE_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </Field>

        <Field label="Veterinary License No." error={errors.licenseNumber}>
          <div className="relative">
            <FileText className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={professional.licenseNumber}
              onChange={(e) => setProfessional((p) => ({ ...p, licenseNumber: e.target.value }))}
              placeholder="e.g. VL-12345-CA"
              className={inputCls(!!errors.licenseNumber, "pl-11")}
            />
          </div>
        </Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Years of Experience" error={errors.experience}>
          <div className="relative">
            <Clock className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400 pointer-events-none" />
            <input
              type="number"
              min="0"
              max="60"
              value={professional.experience}
              onChange={(e) => setProfessional((p) => ({ ...p, experience: e.target.value }))}
              placeholder="e.g. 8"
              className={inputCls(!!errors.experience, "pl-11")}
            />
          </div>
        </Field>

        <Field label="Clinic / Hospital">
          <div className="relative">
            <Building className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={professional.clinic}
              onChange={(e) => setProfessional((p) => ({ ...p, clinic: e.target.value }))}
              placeholder="e.g. City Animal Hospital"
              className={inputCls(false, "pl-11")}
            />
          </div>
        </Field>
      </div>

      <Field label="Degrees & Qualifications">
        <div className="relative">
          <BookOpen className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={professional.qualifications}
            onChange={(e) => setProfessional((p) => ({ ...p, qualifications: e.target.value }))}
            placeholder="e.g. Cornell CVM 2015, Board-certified surgeon"
            className={inputCls(false, "pl-11")}
          />
        </div>
      </Field>

      <Field label="Specialties" error={errors.specialties}>
        <p className="text-xs text-gray-400 -mt-0.5 mb-2">Select all that apply</p>
        <div className="flex flex-wrap gap-2">
          {SPECIALTY_OPTIONS.map((s) => {
            const selected = professional.specialties.includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggleSpecialty(s)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-sm font-semibold border-2 transition-all",
                  selected
                    ? "bg-red-500 border-red-500 text-white shadow-sm"
                    : "border-gray-200 text-gray-500 hover:border-red-200 hover:text-red-500 bg-white"
                )}
              >
                {selected && <Check className="inline w-3 h-3 mr-1" />}
                {s}
              </button>
            );
          })}
        </div>
      </Field>
    </div>
  );
}

function Step3Panel({
  availability,
  setAvailability,
  errors,
}: {
  availability: AvailabilityData;
  setAvailability: React.Dispatch<React.SetStateAction<AvailabilityData>>;
  errors: Record<string, string>;
}) {
  const toggleConsultType = (t: "video" | "phone" | "inperson") =>
    setAvailability((prev) => ({
      ...prev,
      consultationTypes: prev.consultationTypes.includes(t)
        ? prev.consultationTypes.filter((x) => x !== t)
        : [...prev.consultationTypes, t],
    }));

  const consultOptions = [
    { type: "video"    as const, Icon: Video,       label: "Video Call",  color: "from-red-500 to-rose-400"     },
    { type: "phone"    as const, Icon: Phone,       label: "Phone Call",  color: "from-orange-500 to-amber-400" },
    { type: "inperson" as const, Icon: Stethoscope, label: "In-Person",   color: "from-rose-500 to-pink-400"    },
  ];

  return (
    <div className="space-y-6">
      {/* Consultation types */}
      <Field label="Consultation Types" error={errors.consultationTypes}>
        <p className="text-xs text-gray-400 -mt-0.5 mb-2">Select the types you offer</p>
        <div className="grid grid-cols-3 gap-3">
          {consultOptions.map(({ type, Icon, label, color }) => {
            const selected = availability.consultationTypes.includes(type);
            return (
              <button
                key={type}
                type="button"
                onClick={() => toggleConsultType(type)}
                className={cn(
                  "relative rounded-2xl p-4 text-left border-2 transition-all",
                  selected
                    ? "border-red-400 bg-red-50 shadow-sm"
                    : "border-gray-100 hover:border-gray-200 bg-white"
                )}
              >
                {selected && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
                <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br mb-2.5 flex items-center justify-center text-white", color)}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className={cn("font-bold text-sm", selected ? "text-red-600" : "text-gray-800")}>{label}</p>
              </button>
            );
          })}
        </div>
      </Field>

      {/* Prices — only shown when types are selected */}
      {availability.consultationTypes.length > 0 && (
        <Field label="Consultation Fees (USD per session)">
          <div className="grid sm:grid-cols-3 gap-4">
            {availability.consultationTypes.map((type) => {
              const labelMap = { video: "Video Call", phone: "Phone Call", inperson: "In-Person" };
              const valMap: Record<string, string> = {
                video:    availability.videoPrice,
                phone:    availability.phonePrice,
                inperson: availability.inpersonPrice,
              };
              const placeholderMap = { video: "45", phone: "35", inperson: "75" };
              return (
                <div key={type}>
                  <p className="text-xs text-gray-400 mb-1.5 font-semibold">{labelMap[type]}</p>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm pointer-events-none">$</span>
                    <input
                      type="number"
                      min="0"
                      value={valMap[type]}
                      onChange={(e) =>
                        setAvailability((prev) => ({
                          ...prev,
                          [`${type}Price`]: e.target.value,
                        }))
                      }
                      placeholder={placeholderMap[type]}
                      className={inputCls(false, "pl-8")}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Field>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Location" error={errors.location}>
          <div className="relative">
            <MapPin className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={availability.location}
              onChange={(e) => setAvailability((p) => ({ ...p, location: e.target.value }))}
              placeholder="e.g. San Francisco, CA"
              className={inputCls(!!errors.location, "pl-11")}
            />
          </div>
        </Field>

        <Field label="Average Response Time">
          <div className="relative">
            <Clock className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400 pointer-events-none" />
            <select
              value={availability.responseTime}
              onChange={(e) => setAvailability((p) => ({ ...p, responseTime: e.target.value }))}
              className={inputCls(false, "pl-11")}
            >
              {["< 30 minutes", "1–2 hours", "2–4 hours", "Within a day"].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </Field>
      </div>

      <Field label="Professional Bio" error={errors.bio}>
        <textarea
          rows={4}
          value={availability.bio}
          onChange={(e) => setAvailability((p) => ({ ...p, bio: e.target.value }))}
          placeholder="Tell pet owners about your background, approach to care, and what makes you unique…"
          className={cn(inputCls(!!errors.bio), "resize-none")}
        />
      </Field>
    </div>
  );
}

function Step4Panel({
  account,
  professional,
  availability,
  profilePhoto,
  errors,
}: {
  account: AccountData;
  professional: ProfessionalData;
  availability: AvailabilityData;
  profilePhoto: string | null;
  errors: Record<string, string>;
}) {
  return (
    <div className="space-y-6">
      {/* Profile summary card */}
      <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-red-50 to-rose-50 rounded-2xl border border-red-100">
        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-red-100 flex-shrink-0 flex items-center justify-center">
          {profilePhoto ? (
            <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl">👨‍⚕️</span>
          )}
        </div>
        <div className="min-w-0">
          <p className="font-black text-gray-900 text-lg truncate">
            {professional.title} {account.fullName || "—"}
          </p>
          <p className="text-sm text-gray-500 truncate">{account.email || "—"}</p>
          <p className="text-sm text-red-500 font-semibold mt-0.5">
            {professional.experience ? `${professional.experience} yrs` : "—"} experience
            {availability.location ? ` · ${availability.location}` : ""}
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <ReviewBlock title="License"        value={professional.licenseNumber  || "—"} icon={FileText}  />
        <ReviewBlock title="Clinic"         value={professional.clinic         || "—"} icon={Building}  />
        <ReviewBlock title="Qualifications" value={professional.qualifications || "—"} icon={BookOpen}  />
        <ReviewBlock title="Response Time"  value={availability.responseTime        } icon={Clock}      />
      </div>

      {professional.specialties.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Specialties</p>
          <div className="flex flex-wrap gap-2">
            {professional.specialties.map((s) => (
              <span key={s} className="bg-red-50 border border-red-100 text-red-600 px-2.5 py-1 rounded-full text-xs font-semibold">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {availability.consultationTypes.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Consultation Types & Fees</p>
          <div className="flex flex-wrap gap-2">
            {availability.consultationTypes.map((type) => {
              const priceMap: Record<string, string> = {
                video:    availability.videoPrice,
                phone:    availability.phonePrice,
                inperson: availability.inpersonPrice,
              };
              const labelMap = { video: "Video", phone: "Phone", inperson: "In-Person" };
              const price = priceMap[type];
              return (
                <span key={type} className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-xl text-sm font-semibold">
                  {labelMap[type]}{price ? ` — $${price}` : ""}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {availability.bio && (
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Bio</p>
          <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-xl p-4 border border-gray-100">
            {availability.bio}
          </p>
        </div>
      )}

      <div className="flex gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
        <Shield className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-700 leading-relaxed">
          By submitting, you certify that all information is accurate. Your license will be verified within 2–3 business days before your profile goes live.
        </p>
      </div>

      {errors.submit && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{errors.submit}</span>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
export default function VetSignUp() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const navigate = useNavigate();

  // BUG FIX: step is clamped to 1-4. goNext guards against exceeding 4.
  const [step,         setStep]         = useState<Step>(1);
  const [stage,        setStage]        = useState<"form" | "verify" | "done">("form");
  const [otp,          setOtp]          = useState("");
  const [otpError,     setOtpError]     = useState("");
  const [isVerifying,  setIsVerifying]  = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  // BUG FIX: errors is never reset to {} before validation — we set it
  // directly from validateStepN so there's no async race between two setErrors calls.
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [account, setAccount] = useState<AccountData>({
    fullName: "", email: "", password: "", confirmPassword: "",
  });

  const [professional, setProfessional] = useState<ProfessionalData>({
    title: "DVM", licenseNumber: "", experience: "",
    specialties: [], qualifications: "", clinic: "",
  });

  const [availability, setAvailability] = useState<AvailabilityData>({
    consultationTypes: [], videoPrice: "", phonePrice: "", inpersonPrice: "",
    responseTime: "1–2 hours", location: "", bio: "",
  });

  /* ── Validation — returns errors map directly, does NOT call setErrors ── */
  const validateStep1 = useCallback((): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!account.fullName.trim())
      e.fullName = "Full name is required";
    if (!account.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account.email))
      e.email = "Valid email is required";
    if (!account.password || account.password.length < 8)
      e.password = "Password must be at least 8 characters";
    if (account.password !== account.confirmPassword)
      e.confirmPassword = "Passwords do not match";
    return e;
  }, [account]);

  const validateStep2 = useCallback((): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!professional.licenseNumber.trim())
      e.licenseNumber = "License number is required";
    if (!professional.experience.trim() || isNaN(Number(professional.experience)))
      e.experience = "Valid years of experience is required";
    if (professional.specialties.length === 0)
      e.specialties = "Select at least one specialty";
    return e;
  }, [professional]);

  const validateStep3 = useCallback((): Record<string, string> => {
    const e: Record<string, string> = {};
    if (availability.consultationTypes.length === 0)
      e.consultationTypes = "Select at least one consultation type";
    if (!availability.location.trim())
      e.location = "Location is required";
    if (!availability.bio.trim())
      e.bio = "A short bio is required";
    return e;
  }, [availability]);

  /* ── Navigation — BUG FIX: single setErrors call, no race, step clamped ── */
  const goNext = useCallback(() => {
    // Guard: never go past step 4
    if (step >= 4) return;

    let errs: Record<string, string> = {};
    if (step === 1) errs = validateStep1();
    if (step === 2) errs = validateStep2();
    if (step === 3) errs = validateStep3();

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setErrors({});
    setStep((s) => Math.min(s + 1, 4) as Step);
  }, [step, validateStep1, validateStep2, validateStep3]);

  const goPrev = useCallback(() => {
    setErrors({});
    setStep((s) => Math.max(s - 1, 1) as Step);
  }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setProfilePhoto(ev.target?.result as string ?? null);
    reader.readAsDataURL(file);
    // Reset input so same file can be selected again
    e.target.value = "";
  };

  const handlePhotoClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  /* ── Submit Step 4: create Clerk account ── */
  const handleSubmit = async () => {
    if (!isLoaded) return;
    setIsSubmitting(true);
    setErrors({});
    try {
      const parts = account.fullName.trim().split(" ");
      const firstName = parts[0] || "";
      const lastName  = parts.slice(1).join(" ");
      await signUp.create({
        firstName,
        lastName,
        emailAddress: account.email,
        password:     account.password,
      });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setStage("verify");
    } catch (err: any) {
      const message =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        "Something went wrong. Please try again.";
      setErrors({ submit: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Verify OTP → save to MongoDB ── */
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    setIsVerifying(true);
    setOtpError("");
    try {
      const result = await signUp.attemptEmailAddressVerification({ code: otp });
      if (result.status !== "complete") {
        throw new Error("Verification incomplete. Please try again.");
      }

      await setActive({ session: result.createdSessionId });

      // Save vet profile to MongoDB
      const payload = {
        name:              account.fullName,
        email:             account.email,
        image:             "👨‍⚕️",
        clerkId:           result.createdUserId ?? "",
        title:             professional.title,
        licenseNumber:     professional.licenseNumber,
        experience:        parseInt(professional.experience) || 0,
        specialties:       professional.specialties,
        qualifications:    professional.qualifications,
        clinic:            professional.clinic,
        consultationTypes: availability.consultationTypes,
        videoPrice:        parseInt(availability.videoPrice)    || 0,
        phonePrice:        parseInt(availability.phonePrice)    || 0,
        inpersonPrice:     parseInt(availability.inpersonPrice) || 0,
        responseTime:      availability.responseTime,
        location:          availability.location,
        bio:               availability.bio,
      };

      const res = await fetch("/api/vets", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        // Non-fatal — account was created, profile save failed
        console.error("[VetSignUp] MongoDB profile save failed:", data.error);
      }

      setStage("done");
    } catch (err: any) {
      const message =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        err?.message ||
        "Invalid code. Please try again.";
      setOtpError(message);
    } finally {
      setIsVerifying(false);
    }
  };

  const currentStepConfig = STEP_CONFIG[step - 1]; // always valid: step is 1-4

  /* ══════ DONE ══════ */
  if (stage === "done") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-rose-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-10 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-rose-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-200">
            <Check className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-2">Application Submitted!</h2>
          <p className="text-gray-500 leading-relaxed mb-2">
            Welcome,{" "}
            <span className="font-bold text-gray-800">
              {professional.title} {account.fullName}
            </span>
          </p>
          <p className="text-gray-400 text-sm mb-8 leading-relaxed">
            Our team will review your credentials within 2–3 business days.
            You'll get an email once approved.
          </p>
          <div className="bg-red-50 rounded-2xl p-4 border border-red-100 mb-8 text-left">
            <p className="text-xs font-bold text-red-500 uppercase tracking-widest mb-3">What happens next</p>
            {[
              "Your profile is under review",
              "License & credentials verified",
              "Account activated & listed",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-gray-600 py-1.5">
                <div className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {i + 1}
                </div>
                {item}
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate("/")}
            className="w-full bg-gradient-to-r from-red-500 to-rose-500 text-white font-bold py-3.5 rounded-xl hover:from-red-600 hover:to-rose-600 transition-all shadow-md shadow-red-200"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  /* ══════ OTP VERIFY ══════ */
  if (stage === "verify") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full mx-auto py-12">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify your email</h2>
            <p className="text-gray-500 text-sm">
              We sent a 6-digit code to{" "}
              <span className="font-semibold text-gray-800">{account.email}</span>
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-4">
            <input
              type="text"
              inputMode="numeric"
              value={otp}
              onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "").slice(0, 6)); setOtpError(""); }}
              placeholder="000000"
              maxLength={6}
              className={cn(
                "w-full px-4 py-4 border rounded-xl text-center text-2xl tracking-[0.5em] font-bold focus:outline-none focus:ring-2 focus:ring-red-400",
                otpError ? "border-red-400 bg-red-50" : "border-gray-200"
              )}
            />
            {otpError && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{otpError}</span>
              </div>
            )}
            <button
              type="submit"
              disabled={isVerifying || otp.length < 6}
              className="w-full bg-gradient-to-r from-red-500 to-rose-500 text-white font-bold py-3.5 rounded-xl disabled:opacity-50 transition-all hover:from-red-600 hover:to-rose-600"
            >
              {isVerifying ? "Verifying & saving profile…" : "Verify & Submit Application"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            Didn't receive it?{" "}
            <button
              type="button"
              onClick={async () => {
                try {
                  await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
                } catch {}
              }}
              className="text-red-500 font-semibold hover:text-red-600"
            >
              Resend code
            </button>
          </p>
        </div>
      </div>
    );
  }

  /* ══════ MAIN MULTI-STEP FORM ══════ */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50/20 to-white">
      {/* Ambient blobs — pointer-events-none so they never interfere with clicks */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-red-200/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-rose-200/15 blur-3xl" />
      </div>

      {/* Hidden file input — always mounted */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePhotoChange}
      />

      <div className="relative max-w-3xl mx-auto px-4 py-10">
        {/* ── Top nav ── */}
        <div className="flex items-center justify-between mb-10">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-rose-400 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <span className="font-black text-xl bg-gradient-to-r from-red-500 to-rose-500 bg-clip-text text-transparent">
              PetMatch
            </span>
          </Link>
          <Link
            to="/signup"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to signup
          </Link>
        </div>

        {/* ── Hero banner ── */}
        <div className="bg-gradient-to-r from-red-600 via-rose-500 to-pink-500 rounded-3xl p-8 text-white mb-8 relative overflow-hidden shadow-xl shadow-red-200/40">
          <div
            className="absolute inset-0 opacity-10"
            style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "24px 24px" }}
            aria-hidden="true"
          />
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
          <div className="relative z-10 flex items-center gap-5">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0 border border-white/30">
              <Stethoscope className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-white/70 text-sm font-semibold uppercase tracking-widest mb-0.5">
                Professional Application
              </p>
              <h1 className="text-2xl sm:text-3xl font-black">Join as a Veterinarian</h1>
              <p className="text-white/75 text-sm mt-1">Get verified and start seeing patients online</p>
            </div>
          </div>
        </div>

        {/* ── Step bar ── */}
        <StepBar step={step} />

        {/* ── Form card ── */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Step header */}
          <div className="px-8 pt-8 pb-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                <currentStepConfig.Icon className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-900">{currentStepConfig.title}</h2>
                <p className="text-sm text-gray-400">{currentStepConfig.subtitle}</p>
              </div>
              <div className="ml-auto text-sm font-bold text-gray-300 flex-shrink-0">
                Step {step} / 4
              </div>
            </div>
          </div>

          {/* Step content */}
          <div className="p-8">
            {step === 1 && (
              <Step1Panel
                account={account}
                setAccount={setAccount}
                errors={errors}
                profilePhoto={profilePhoto}
                onPhotoClick={handlePhotoClick}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                showConfirm={showConfirm}
                setShowConfirm={setShowConfirm}
              />
            )}
            {step === 2 && (
              <Step2Panel
                professional={professional}
                setProfessional={setProfessional}
                errors={errors}
              />
            )}
            {step === 3 && (
              <Step3Panel
                availability={availability}
                setAvailability={setAvailability}
                errors={errors}
              />
            )}
            {step === 4 && (
              <Step4Panel
                account={account}
                professional={professional}
                availability={availability}
                profilePhoto={profilePhoto}
                errors={errors}
              />
            )}
          </div>

          {/* ── Navigation footer ── */}
          <div className="px-8 py-6 border-t border-gray-100 flex items-center justify-between">
            <button
              type="button"
              onClick={step === 1 ? () => navigate("/signup") : goPrev}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:border-gray-300 hover:text-gray-800 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              {step === 1 ? "Cancel" : "Back"}
            </button>

            {step < 4 ? (
              <button
                type="button"
                onClick={goNext}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 text-white font-bold text-sm hover:from-red-600 hover:to-rose-600 transition-all shadow-md shadow-red-200"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-7 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 text-white font-bold text-sm hover:from-red-600 hover:to-rose-600 transition-all shadow-md shadow-red-200 disabled:opacity-60"
              >
                {isSubmitting ? "Creating account…" : "Submit Application"}
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <Link to="/signin" className="text-red-500 font-semibold hover:text-red-600">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
