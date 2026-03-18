import { Link } from "react-router-dom";
import { Heart, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { label: "Home", href: "/" },
    { label: "My Pets", href: "/pet-profile" },
    { label: "Breeding Match", href: "/breeding" },
    { label: "Adoption", href: "/adoption" },
    { label: "Host a Pet", href: "/hosting" },
    { label: "Marketplace", href: "/marketplace" },
    { label: "Vets", href: "/vets" },
    { label: "Insurance", href: "/insurance" },
    { label: "Store", href: "/store" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-gradient-to-br from-dogs to-orange-400 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
            <Heart className="w-6 h-6 text-white fill-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-dogs to-orange-400 bg-clip-text text-transparent hidden sm:inline">
            PetMatch
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-dogs rounded-lg hover:bg-orange-50 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="hidden sm:flex items-center gap-3">
          <Link
            to="/signin"
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Sign In
          </Link>
          <Link
            to="/signup"
            className="px-4 py-2 text-sm font-medium text-white bg-dogs rounded-lg hover:bg-orange-600 transition-colors shadow-lg hover:shadow-xl"
          >
            Sign Up
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {isOpen ? (
            <X className="w-6 h-6 text-gray-700" />
          ) : (
            <Menu className="w-6 h-6 text-gray-700" />
          )}
        </button>
      </nav>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-gray-50">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-dogs rounded-lg hover:bg-white transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
              <Link
                to="/signin"
                onClick={() => setIsOpen(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors text-center"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                onClick={() => setIsOpen(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-dogs rounded-lg hover:bg-orange-600 transition-colors text-center"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
