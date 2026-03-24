import { useState } from "react";
import Header from "@/components/Header";
import {
  Check,
  Shield,
  Heart,
  Zap,
  Award,
  FileText,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface InsurancePlan {
  id: number;
  name: string;
  monthly: number;
  annual: number;
  coverage: number;
  deductible: number;
  icon: React.ReactNode;
  description: string;
  features: string[];
  recommended?: boolean;
}

const insurancePlans: InsurancePlan[] = [
  {
    id: 1,
    name: "Basic Care",
    monthly: 15,
    annual: 150,
    coverage: 5000,
    deductible: 250,
    icon: <Heart className="w-6 h-6" />,
    description: "Essential coverage for accidents and illnesses",
    features: [
      "Accident & Illness coverage",
      "Up to $5,000 annual limit",
      "$250 deductible",
      "24/7 customer support",
      "Covers vet visits up to $300",
    ],
  },
  {
    id: 2,
    name: "Premium Coverage",
    monthly: 35,
    annual: 350,
    coverage: 15000,
    deductible: 100,
    icon: <Shield className="w-6 h-6" />,
    description: "Comprehensive coverage for peace of mind",
    features: [
      "Accident & Illness coverage",
      "Up to $15,000 annual limit",
      "$100 deductible",
      "Covers hereditary conditions",
      "Covers chronic conditions",
      "Wellness visits included",
      "24/7 customer support",
      "Direct vet payments",
    ],
    recommended: true,
  },
  {
    id: 3,
    name: "Elite Plus",
    monthly: 55,
    annual: 550,
    coverage: 30000,
    deductible: 50,
    icon: <Award className="w-6 h-6" />,
    description: "Maximum coverage with all benefits included",
    features: [
      "Accident & Illness coverage",
      "Up to $30,000 annual limit",
      "$50 deductible",
      "Covers hereditary conditions",
      "Covers chronic conditions",
      "Wellness visits included",
      "Dental & Vision coverage",
      "Behavioral therapy",
      "Prescription medications",
      "24/7 emergency hotline",
      "Direct vet payments",
      "Nationwide coverage",
    ],
  },
];

interface FAQ {
  question: string;
  answer: string;
}

const faqs: FAQ[] = [
  {
    question: "What's the process to get coverage?",
    answer:
      "Simply choose a plan, fill out your pet's health information, and you'll be covered within 24 hours. No waiting period for accidents.",
  },
  {
    question: "Are pre-existing conditions covered?",
    answer:
      "Pre-existing conditions are not covered under our plans. However, our Premium Coverage and Elite Plus plans cover hereditary and chronic conditions after the waiting period.",
  },
  {
    question: "Can I choose my own veterinarian?",
    answer:
      "Yes! You can visit any licensed veterinarian in the United States. Simply submit your receipt and we'll reimburse you within 5-7 business days.",
  },
  {
    question: "What's the claims process?",
    answer:
      "You can submit claims online through our app or website. Upload your vet receipt and we'll process it immediately. Most claims are approved within 24 hours.",
  },
  {
    question: "Is there a maximum age limit for pets?",
    answer:
      "No, we accept pets of all ages! However, coverage for pets over 10 years may have different terms. Contact us for details.",
  },
];

export default function Insurance() {
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(
    "monthly"
  );
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Pet Insurance
            </h1>
            <p className="text-lg text-gray-600">
              Protect your pet with comprehensive insurance plans. Compare plans
              and find the best coverage for your furry friend.
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Billing Toggle */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Our Insurance Plans
          </h2>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={cn(
                "px-6 py-2 rounded-lg font-semibold transition-all",
                billingCycle === "monthly"
                  ? "bg-indigo-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              className={cn(
                "px-6 py-2 rounded-lg font-semibold transition-all",
                billingCycle === "annual"
                  ? "bg-indigo-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              Annual (Save 15%)
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {insurancePlans.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                "relative rounded-2xl overflow-hidden transition-all",
                plan.recommended
                  ? "ring-2 ring-indigo-500 shadow-2xl scale-105"
                  : "border border-gray-100 shadow-lg hover:shadow-xl"
              )}
            >
              {/* Recommended Badge */}
              {plan.recommended && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-2 text-center text-sm font-bold">
                  RECOMMENDED
                </div>
              )}

              <div
                className={cn(
                  "p-8 pt-12",
                  plan.recommended
                    ? "bg-white"
                    : "bg-gray-50"
                )}
              >
                {/* Plan Header */}
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 mb-4">
                    {plan.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-600 text-sm">{plan.description}</p>
                </div>

                {/* Price */}
                <div className="text-center mb-6 py-6 border-y border-gray-200">
                  <div className="text-4xl font-bold text-gray-900">
                    ${billingCycle === "monthly" ? plan.monthly : Math.floor(plan.annual / 12)}
                  </div>
                  <div className="text-gray-600 text-sm">
                    {billingCycle === "monthly"
                      ? "per month"
                      : "per month (billed annually)"}
                  </div>
                  <div className="text-indigo-600 font-semibold text-sm mt-2">
                    Up to ${plan.coverage} annual limit
                  </div>
                  <div className="text-gray-600 text-sm">
                    ${plan.deductible} deductible
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-3 text-gray-700 text-sm"
                    >
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={() => setSelectedPlan(plan.id)}
                  className={cn(
                    "w-full py-3 rounded-xl font-semibold transition-all",
                    selectedPlan === plan.id
                      ? "bg-green-500 text-white"
                      : plan.recommended
                        ? "bg-indigo-500 text-white hover:bg-indigo-600"
                        : "bg-gray-200 text-gray-900 hover:bg-gray-300"
                  )}
                >
                  {selectedPlan === plan.id ? (
                    <span className="flex items-center justify-center gap-2">
                      <Check className="w-5 h-5" />
                      Selected
                    </span>
                  ) : (
                    "Choose Plan"
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Why Choose Us Section */}
        <section className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-12 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
            Why Choose PetMatch Insurance?
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-lg mb-4">
                <Zap className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Instant Coverage
              </h3>
              <p className="text-gray-600">
                Get coverage within 24 hours. No waiting period for accidents.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-lg mb-4">
                <Heart className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Comprehensive Coverage
              </h3>
              <p className="text-gray-600">
                Coverage for accidents, illnesses, hereditary conditions, and
                more.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-lg mb-4">
                <Users className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Trusted by Vets
              </h3>
              <p className="text-gray-600">
                Partnered with 1000+ veterinary clinics nationwide.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Frequently Asked Questions
          </h2>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpandedFAQ(expandedFAQ === index ? null : index)
                  }
                  className="w-full px-6 py-4 text-left font-semibold text-gray-900 hover:bg-gray-50 transition-colors flex items-center justify-between"
                >
                  {faq.question}
                  <span
                    className={cn(
                      "transition-transform",
                      expandedFAQ === index ? "rotate-180" : ""
                    )}
                  >
                    ▼
                  </span>
                </button>

                {expandedFAQ === index && (
                  <div className="px-6 py-4 bg-gray-50 text-gray-600 border-t border-gray-200">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Protect Your Pet Today
          </h2>
          <p className="text-lg mb-8 opacity-90">
            Join thousands of pet owners who trust us with their pet's health.
          </p>
          <button className="px-8 py-4 rounded-xl bg-white text-indigo-600 font-bold hover:bg-gray-100 transition-colors">
            Get Started Now
          </button>
        </section>
      </div>
    </div>
  );
}
