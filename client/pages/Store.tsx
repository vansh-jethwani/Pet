import { useState } from "react";
import Header from "@/components/Header";
import {
  ShoppingCart,
  Heart,
  Star,
  Search,
  Filter,
  Check,
  Truck,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StoreProduct {
  id: number;
  name: string;
  category: "food" | "toys" | "grooming" | "accessories";
  price: number;
  rating: number;
  reviews: number;
  image: string;
  inStock: boolean;
  description: string;
  brand: string;
}

const products: StoreProduct[] = [
  {
    id: 1,
    name: "Premium Dog Food - Organic Chicken",
    category: "food",
    price: 45.99,
    rating: 4.9,
    reviews: 234,
    image: "🥩",
    inStock: true,
    description: "High-quality organic dog food with real chicken and vegetables.",
    brand: "PetNutrition Pro",
  },
  {
    id: 2,
    name: "Interactive Rubber Chew Toy",
    category: "toys",
    price: 12.99,
    rating: 4.7,
    reviews: 156,
    image: "🧸",
    inStock: true,
    description: "Durable rubber toy that keeps dogs entertained for hours.",
    brand: "Pawsome Toys",
  },
  {
    id: 3,
    name: "Cat Grooming Brush Set",
    category: "grooming",
    price: 24.95,
    rating: 4.8,
    reviews: 89,
    image: "🪮",
    inStock: true,
    description: "Complete grooming set with 3 different brushes for cats.",
    brand: "GroomPro",
  },
  {
    id: 4,
    name: "Personalized Pet Collar",
    category: "accessories",
    price: 19.99,
    rating: 4.6,
    reviews: 112,
    image: "⛓️",
    inStock: true,
    description: "Customizable pet collar with engraved name and ID.",
    brand: "PetStyle",
  },
  {
    id: 5,
    name: "Cat Litter - Premium Clay",
    category: "food",
    price: 16.50,
    rating: 4.8,
    reviews: 198,
    image: "🚽",
    inStock: true,
    description: "Odor-control cat litter with superior clumping.",
    brand: "CleanPaws",
  },
  {
    id: 6,
    name: "Dog Bed - Orthopedic Memory Foam",
    category: "accessories",
    price: 89.99,
    rating: 4.9,
    reviews: 267,
    image: "🛏️",
    inStock: true,
    description: "Comfortable memory foam dog bed for joint support.",
    brand: "ComfortPet",
  },
  {
    id: 7,
    name: "Rope Tug Toy for Dogs",
    category: "toys",
    price: 8.99,
    rating: 4.5,
    reviews: 78,
    image: "🪢",
    inStock: true,
    description: "Durable cotton rope toy perfect for interactive play.",
    brand: "PlayPaws",
  },
  {
    id: 8,
    name: "Wet Cat Food Variety Pack",
    category: "food",
    price: 32.99,
    rating: 4.7,
    reviews: 143,
    image: "🥫",
    inStock: false,
    description: "12-pack of gourmet wet cat food with variety flavors.",
    brand: "FelineFeast",
  },
];

const categoryLabels = {
  food: "Food & Treats",
  toys: "Toys & Chews",
  grooming: "Grooming",
  accessories: "Accessories",
};

export default function Store() {
  const [cart, setCart] = useState<number[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    "all" | "food" | "toys" | "grooming" | "accessories"
  >("all");
  const [sortBy, setSortBy] = useState<"price-low" | "price-high" | "rating">(
    "rating"
  );

  const filteredProducts = products
    .filter((product) => {
      const matchesSearch =
        !searchTerm ||
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;
      return b.rating - a.rating;
    });

  const handleAddToCart = (id: number) => {
    if (!cart.includes(id)) {
      setCart([...cart, id]);
    }
  };

  const handleRemoveFromCart = (id: number) => {
    setCart(cart.filter((item) => item !== id));
  };

  const handleFavorite = (id: number) => {
    if (favorites.includes(id)) {
      setFavorites(favorites.filter((f) => f !== id));
    } else {
      setFavorites([...favorites, id]);
    }
  };

  const totalPrice = products
    .filter((p) => cart.includes(p.id))
    .reduce((sum, p) => sum + p.price, 0);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-emerald-50 via-white to-green-50 py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Pet Store
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl">
            Shop quality pet food, toys, grooming products, and accessories for
            your beloved pets.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search & Filter */}
        <div className="mb-8 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex-1 w-full sm:max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(
                    e.target.value as "price-low" | "price-high" | "rating"
                  )
                }
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="rating">Top Rated</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCategory("all")}
              className={cn(
                "px-4 py-2 rounded-full font-semibold transition-all",
                selectedCategory === "all"
                  ? "bg-green-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              All Products
            </button>
            {(["food", "toys", "grooming", "accessories"] as const).map(
              (cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "px-4 py-2 rounded-full font-semibold transition-all",
                    selectedCategory === cat
                      ? "bg-green-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  )}
                >
                  {categoryLabels[cat]}
                </button>
              )
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar Cart */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm sticky top-24">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Shopping Cart
              </h3>

              {cart.length === 0 ? (
                <p className="text-gray-600 text-center py-8">
                  Your cart is empty
                </p>
              ) : (
                <>
                  <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                    {products
                      .filter((p) => cart.includes(p.id))
                      .map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900">
                              {product.name.substring(0, 20)}...
                            </p>
                            <p className="text-sm text-green-600 font-bold">
                              ${product.price}
                            </p>
                          </div>
                          <button
                            onClick={() => handleRemoveFromCart(product.id)}
                            className="text-red-600 hover:text-red-700 font-bold"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                  </div>

                  <div className="border-t border-gray-200 pt-4 mb-4">
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-semibold text-gray-900">Total:</span>
                      <span className="text-xl font-bold text-green-600">
                        ${totalPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <button className="w-full px-4 py-2 rounded-lg bg-green-500 text-white font-semibold hover:bg-green-600 transition-colors">
                    Checkout
                  </button>
                </>
              )}
            </div>

            {/* Info Box */}
            <div className="bg-green-50 rounded-2xl p-6 border border-green-200 mt-6">
              <div className="space-y-4 text-sm">
                <div className="flex gap-3">
                  <Truck className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900">
                      Free Shipping
                    </p>
                    <p className="text-gray-600">On orders over $50</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <RotateCcw className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900">Easy Returns</p>
                    <p className="text-gray-600">30-day return policy</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            {filteredProducts.length === 0 ? (
              <div className="bg-green-50 rounded-2xl p-12 text-center border-2 border-dashed border-green-200">
                <div className="text-5xl mb-4">🛒</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  No Products Found
                </h3>
                <p className="text-gray-600">
                  Try adjusting your filters or search terms.
                </p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-6">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className={cn(
                      "rounded-2xl overflow-hidden shadow-lg border transition-all hover:shadow-xl",
                      !product.inStock
                        ? "opacity-75 border-gray-200"
                        : "border-gray-100"
                    )}
                  >
                    {/* Image Area */}
                    <div className="relative w-full h-48 bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center text-8xl">
                      {product.image}
                      {!product.inStock && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="bg-white text-gray-900 px-4 py-2 rounded-lg font-bold">
                            Out of Stock
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 mb-1">
                            {product.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {product.brand}
                          </p>
                        </div>
                        <button
                          onClick={() => handleFavorite(product.id)}
                          className={cn(
                            "p-2 rounded-full transition-colors flex-shrink-0",
                            favorites.includes(product.id)
                              ? "bg-red-100 text-red-500"
                              : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                          )}
                        >
                          <Heart className="w-5 h-5 fill-current" />
                        </button>
                      </div>

                      {/* Rating */}
                      <div className="flex items-center gap-2 text-sm text-yellow-600 font-semibold mb-4">
                        <Star className="w-4 h-4 fill-yellow-400" />
                        {product.rating} ({product.reviews})
                      </div>

                      <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                        {product.description}
                      </p>

                      {/* Price & Action */}
                      <div className="flex items-center justify-between gap-4">
                        <div className="text-2xl font-bold text-gray-900">
                          ${product.price}
                        </div>
                        {product.inStock ? (
                          <button
                            onClick={() => handleAddToCart(product.id)}
                            disabled={cart.includes(product.id)}
                            className={cn(
                              "py-2 px-4 rounded-lg font-semibold transition-colors",
                              cart.includes(product.id)
                                ? "bg-green-100 text-green-700 cursor-not-allowed flex items-center gap-2"
                                : "bg-green-500 text-white hover:bg-green-600"
                            )}
                          >
                            {cart.includes(product.id) ? (
                              <>
                                <Check className="w-4 h-4" />
                                Added
                              </>
                            ) : (
                              <ShoppingCart className="w-4 h-4" />
                            )}
                          </button>
                        ) : (
                          <button
                            disabled
                            className="py-2 px-4 rounded-lg font-semibold bg-gray-200 text-gray-500 cursor-not-allowed"
                          >
                            Unavailable
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
