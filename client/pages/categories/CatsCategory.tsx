import { Link } from "react-router-dom";
import Header from "../../components/Header";
import { Heart, MapPin, Shield, ShoppingBag, Stethoscope, Home, Users, ArrowLeft } from "lucide-react";

export default function CatsCategory() {
  const features = [
    {
      icon: Heart,
      title: "Breeding Match",
      description: "Find the perfect breeding partner for your cat with our intelligent matching system.",
      color: "from-cats to-lime-400",
      link: "/breeding",
    },
    {
      icon: Home,
      title: "Adoption",
      description: "Discover amazing cats waiting for their forever homes.",
      color: "from-lime-400 to-lime-500",
      link: "/adoption",
    },
    {
      icon: MapPin,
      title: "Cat Hosting",
      description: "Host other cats or find trusted cat sitters for your furry friend.",
      color: "from-lime-500 to-lime-600",
      link: "/hosting",
    },
    {
      icon: ShoppingBag,
      title: "Cat Marketplace",
      description: "Buy and sell cat-related products, toys, and accessories.",
      color: "from-lime-600 to-cats",
      link: "/marketplace",
    },
    {
      icon: Stethoscope,
      title: "Vet Consultation",
      description: "Connect with veterinarians specialized in cat health and care.",
      color: "from-cats to-lime-400",
      link: "/vets",
    },
    {
      icon: Shield,
      title: "Pet Insurance",
      description: "Protect your cat with comprehensive pet health insurance plans.",
      color: "from-lime-400 to-lime-500",
      link: "/insurance",
    },
    {
      icon: ShoppingBag,
      title: "Cat Food & Store",
      description: "Premium cat food, treats, and supplies delivered to your door.",
      color: "from-lime-500 to-lime-600",
      link: "/store",
    },
    {
      icon: Users,
      title: "Cat Community",
      description: "Join our community of cat lovers and share experiences.",
      color: "from-lime-600 to-cats",
      link: "/community",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-cats to-lime-400 text-white py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 mb-6 opacity-90 hover:opacity-100 transition-opacity"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </Link>
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">🐱 Cats</h1>
            <p className="text-lg sm:text-xl opacity-90">
              Everything you need to know about cats, from breeding to adoption, healthcare, and community.
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-12 text-center">
            Cat Services & Features
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Link
                  key={index}
                  to={feature.link}
                  className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                >
                  <div className={`bg-gradient-to-br ${feature.color} h-32 flex items-center justify-center`}>
                    <Icon className="w-16 h-16 text-white opacity-90" />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-cats transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="bg-gray-50 py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="grid sm:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-cats mb-2">35K+</div>
              <p className="text-gray-600">Cats matched for breeding</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-cats mb-2">18K+</div>
              <p className="text-gray-600">Cats adopted</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-cats mb-2">80+</div>
              <p className="text-gray-600">Verified vets</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-cats to-lime-400 text-white py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Join thousands of cat lovers who are already using PetMatch to find the perfect companion or service.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/signup"
              className="inline-block px-8 py-3 bg-white text-cats font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              Create Account
            </Link>
            <Link
              to="/breeding"
              className="inline-block px-8 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-cats transition-colors"
            >
              Explore Breeding Match
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
