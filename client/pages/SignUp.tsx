import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { useSignUp } from "@clerk/clerk-react";

export default function SignUp() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const navigate = useNavigate();

  const [stage, setStage] = useState<"form" | "verify" | "done">("form");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !validateForm()) return;
    setIsLoading(true);
    try {
      const [firstName, ...rest] = formData.fullName.trim().split(" ");
      const lastName = rest.join(" ");
      await signUp.create({
        firstName,
        lastName,
        emailAddress: formData.email,
        password: formData.password,
      });
      // Send verification email OTP
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setStage("verify");
    } catch (err: any) {
      const message =
        err?.errors?.[0]?.longMessage || "Something went wrong. Please try again.";
      setErrors({ email: message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    setIsVerifying(true);
    setOtpError("");
    try {
      const result = await signUp.attemptEmailAddressVerification({ code: otp });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        setStage("done");
      }
    } catch (err: any) {
      const message =
        err?.errors?.[0]?.longMessage || "Invalid code. Please try again.";
      setOtpError(message);
    } finally {
      setIsVerifying(false);
    }
  };

  // ✅ Success screen
  if (stage === "done") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to PetMatch!</h2>
            <p className="text-gray-600">
              Your account has been created successfully.
            </p>
          </div>
          <button
            onClick={() => navigate("/")}
            className="inline-block w-full bg-gradient-to-r from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // 📧 Email verification screen
  if (stage === "verify") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <Link to="/" className="inline-block mb-6">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                PetMatch
              </h1>
            </Link>
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-orange-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h2>
            <p className="text-gray-600">
              We sent a 6-digit verification code to
            </p>
            <p className="font-semibold text-gray-900 mt-1">{formData.email}</p>
          </div>

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verification Code
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value);
                  setOtpError("");
                }}
                placeholder="Enter 6-digit code"
                maxLength={6}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-center text-xl tracking-widest font-semibold ${
                  otpError ? "border-red-500 bg-red-50" : "border-gray-200 bg-white"
                }`}
              />
              {otpError && <p className="mt-1 text-sm text-red-600">{otpError}</p>}
            </div>

            <button
              type="submit"
              disabled={isVerifying || otp.length < 6}
              className="w-full bg-gradient-to-r from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 disabled:from-orange-300 disabled:to-orange-400 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center"
            >
              {isVerifying ? "Verifying..." : "Verify Email"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Didn't receive the code?{" "}
            <button
              type="button"
              onClick={async () => {
                await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
              }}
              className="text-orange-600 hover:text-orange-700 font-semibold"
            >
              Resend code
            </button>
          </p>
        </div>
      </div>
    );
  }

  // 📝 Signup form screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white">
      <div className="max-w-md mx-auto px-4 py-12">

        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
              PetMatch
            </h1>
          </Link>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Account</h2>
          <p className="text-gray-600">Join our pet-loving community today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mb-6">

          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="John Doe"
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                  errors.fullName ? "border-red-500 bg-red-50" : "border-gray-200 bg-white"
                }`}
              />
            </div>
            {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                  errors.email ? "border-red-500 bg-red-50" : "border-gray-200 bg-white"
                }`}
              />
            </div>
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                  errors.password ? "border-red-500 bg-red-50" : "border-gray-200 bg-white"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                  errors.confirmPassword ? "border-red-500 bg-red-50" : "border-gray-200 bg-white"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 disabled:from-orange-300 disabled:to-orange-400 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 mt-6"
          >
            {isLoading ? "Creating account..." : "Create Account"}
          </button>

        </form>

        <div className="text-center">
          <p className="text-gray-600">
            Already have an account?{" "}
            <Link to="/signin" className="text-orange-600 hover:text-orange-700 font-semibold">
              Sign In
            </Link>
          </p>
        </div>

        <p className="text-xs text-gray-500 text-center mt-6">
          By signing up, you agree to our{" "}
          <a href="#" className="text-orange-600 hover:underline">Terms of Service</a>{" "}
          and{" "}
          <a href="#" className="text-orange-600 hover:underline">Privacy Policy</a>
        </p>

      </div>
    </div>
  );
}