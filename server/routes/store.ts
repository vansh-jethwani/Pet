import { Router, RequestHandler } from "express";
import { Product } from "../models/Product.js";
import { Order } from "../models/Order.js";

const router = Router();

function formatProduct(doc: any) {
  return {
    id:          doc._id.toString(),
    name:        doc.name,
    description: doc.description,
    category:    doc.category,
    petType:     doc.petType,
    price:       doc.price,
    stock:       doc.stock,
    image:       doc.image || "",
    brand:       doc.brand,
    sellerId:    doc.sellerId,
    sellerName:  doc.sellerName,
    sellerEmail: doc.sellerEmail,
    rating:      doc.rating,
    reviews:     doc.reviews,
    approved:    doc.approved,
    createdAt:   doc.createdAt instanceof Date ? doc.createdAt.toISOString() : doc.createdAt,
  };
}

function formatOrder(doc: any) {
  return {
    id:          doc._id.toString(),
    buyerId:     doc.buyerId,
    buyerName:   doc.buyerName,
    buyerEmail:  doc.buyerEmail,
    items:       doc.items,
    totalAmount: doc.totalAmount,
    status:      doc.status,
    address:     doc.address,
    phone:       doc.phone,
    createdAt:   doc.createdAt instanceof Date ? doc.createdAt.toISOString() : doc.createdAt,
  };
}

// GET /api/store/products
router.get("/products", (async (req, res) => {
  try {
    const { petType, category, search, sellerId, sortBy } = req.query as Record<string, string>;

    const query: Record<string, any> = {};

    // If filtering by sellerId (seller viewing their own products), skip the approved filter
    // so they can see all their listings including unapproved ones.
    if (sellerId) {
      query.sellerId = sellerId;
    } else {
      // Public shop view — only show approved products
      query.approved = true;
    }

    if (petType && petType !== "all") query.petType = petType;
    if (category && category !== "all") query.category = category;
    if (search?.trim()) {
      const regex = { $regex: search.trim(), $options: "i" };
      query.$or = [{ name: regex }, { description: regex }, { brand: regex }];
    }

    let sort: Record<string, 1 | -1> = { createdAt: -1 };
    if (sortBy === "price-asc")  sort = { price: 1 };
    if (sortBy === "price-desc") sort = { price: -1 };
    if (sortBy === "rating")     sort = { rating: -1, reviews: -1 };
    if (sortBy === "popular")    sort = { reviews: -1, rating: -1 };

    const products = await Product.find(query).sort(sort).lean();
    res.json(products.map(formatProduct));
  } catch (err) {
    console.error("[store] GET /products error:", err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
}) as RequestHandler);

// GET /api/store/products/:id
router.get("/products/:id", (async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(formatProduct(product));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch product" });
  }
}) as RequestHandler);

// POST /api/store/products — seller lists a product
router.post("/products", (async (req, res) => {
  try {
    const {
      name, description, category, petType, price, stock,
      image, brand, sellerId, sellerName, sellerEmail,
    } = req.body;

    if (!name?.trim())        return res.status(400).json({ error: "name is required" });
    if (!description?.trim()) return res.status(400).json({ error: "description is required" });
    if (!category)            return res.status(400).json({ error: "category is required" });
    if (!petType)             return res.status(400).json({ error: "petType is required" });
    if (!price || Number(price) < 0) return res.status(400).json({ error: "valid price is required" });
    if (!brand?.trim())       return res.status(400).json({ error: "brand is required" });
    if (!sellerId?.trim())    return res.status(400).json({ error: "sellerId is required" });
    if (!sellerName?.trim())  return res.status(400).json({ error: "sellerName is required" });
    if (!sellerEmail?.trim()) return res.status(400).json({ error: "sellerEmail is required" });

    const product = await Product.create({
      name: name.trim(),
      description: description.trim(),
      category,
      petType,
      price: parseFloat(price),
      stock: parseInt(stock) || 0,
      image: image || "",
      brand: brand.trim(),
      sellerId: sellerId.trim(),
      sellerName: sellerName.trim(),
      sellerEmail: sellerEmail.trim(),
      approved: true, // auto-approve; set to false if you want manual review
    });

    console.log(`[store] New product listed: ${product.name} by ${product.sellerName}`);
    res.status(201).json(formatProduct(product));
  } catch (err) {
    console.error("[store] POST /products error:", err);
    res.status(500).json({ error: "Failed to create product" });
  }
}) as RequestHandler);

// PATCH /api/store/products/:id — seller updates their product
router.patch("/products/:id", (async (req, res) => {
  try {
    const { sellerId, ...updates } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    if (product.sellerId !== sellerId) return res.status(403).json({ error: "Not authorized" });

    const allowed = ["name", "description", "price", "stock", "image", "brand", "category", "petType"];
    allowed.forEach(k => { if (updates[k] !== undefined) (product as any)[k] = updates[k]; });
    await product.save();
    res.json(formatProduct(product));
  } catch (err) {
    res.status(500).json({ error: "Failed to update product" });
  }
}) as RequestHandler);

// DELETE /api/store/products/:id — seller removes their product
router.delete("/products/:id", (async (req, res) => {
  try {
    const { sellerId } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    if (product.sellerId !== sellerId) return res.status(403).json({ error: "Not authorized" });
    await product.deleteOne();
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete product" });
  }
}) as RequestHandler);

// POST /api/store/products/:id/review
router.post("/products/:id/review", (async (req, res) => {
  try {
    const { rating } = req.body;
    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "rating must be 1–5" });
    }
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Not found" });

    const newCount = product.reviews + 1;
    product.rating  = Math.round(((product.rating * product.reviews + rating) / newCount) * 10) / 10;
    product.reviews = newCount;
    await product.save();
    res.json({ rating: product.rating, reviews: product.reviews });
  } catch (err) {
    res.status(500).json({ error: "Failed to submit review" });
  }
}) as RequestHandler);

// POST /api/store/orders — buyer places an order
router.post("/orders", (async (req, res) => {
  try {
    const { buyerId, buyerName, buyerEmail, items, address, phone } = req.body;
    if (!buyerId) return res.status(400).json({ error: "buyerId is required" });
    if (!items?.length) return res.status(400).json({ error: "items are required" });

    // Verify stock and calculate total
    let totalAmount = 0;
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) return res.status(404).json({ error: `Product ${item.productId} not found` });
      if (product.stock < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for ${product.name}` });
      }
      totalAmount += product.price * item.quantity;
      product.stock -= item.quantity;
      await product.save();
    }

    const order = await Order.create({
      buyerId,
      buyerName:  buyerName  || "Customer",
      buyerEmail: buyerEmail || "",
      items,
      totalAmount,
      address: address || "",
      phone:   phone   || "",
    });

    console.log(`[store] Order placed: ${order._id} by ${buyerName} — ₹${totalAmount}`);
    res.status(201).json(formatOrder(order));
  } catch (err) {
    console.error("[store] POST /orders error:", err);
    res.status(500).json({ error: "Failed to place order" });
  }
}) as RequestHandler);

// GET /api/store/orders?buyerId=xxx  OR  ?sellerId=xxx
router.get("/orders", (async (req, res) => {
  try {
    const { buyerId, sellerId } = req.query as Record<string, string>;
    if (!buyerId && !sellerId) return res.status(400).json({ error: "buyerId or sellerId required" });

    let orders;
    if (buyerId) {
      orders = await Order.find({ buyerId }).sort({ createdAt: -1 }).lean();
    } else {
      // For sellers — find orders containing their products
      const sellerProducts = await Product.find({ sellerId }).lean();
      const productIds = sellerProducts.map((p: any) => p._id.toString());
      orders = await Order.find({
        "items.productId": { $in: productIds },
      }).sort({ createdAt: -1 }).lean();
    }
    res.json(orders.map(formatOrder));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
}) as RequestHandler);

// PATCH /api/store/orders/:id/status
router.patch("/orders/:id/status", (async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
    if (!valid.includes(status)) return res.status(400).json({ error: "Invalid status" });
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true }).lean();
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(formatOrder(order));
  } catch (err) {
    res.status(500).json({ error: "Failed to update order status" });
  }
}) as RequestHandler);

export default router;
