import { Link } from "react-router-dom";
import Header from "@/components/Header";
import { ArrowRight } from "lucide-react";

interface PlaceholderProps {
  title: string;
  description: string;
  icon: string;
  color: string;
}

export default function Placeholder({
  title,
  description,
  icon,
  color,
}: PlaceholderProps) {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <section className={`bg-gradient-to-br ${color} py-20 sm:py-32`}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="text-9xl mb-6">{icon}</div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              {title}
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 mb-12">
              {description}
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-gray-900 hover:bg-gray-800 shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              Back to Home <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-32 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-12 text-center border-2 border-dashed border-blue-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Coming Soon!
            </h2>
            <p className="text-gray-600 mb-6">
              This page is being built out. Check back soon or continue browsing
              other features on our platform.
            </p>
            <p className="text-sm text-gray-500">
              Want to help shape this feature? Share your ideas with us!
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
