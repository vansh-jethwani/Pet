# PetMatch 🐾

PetMatch is a full-stack pet care and community platform that connects pet owners, veterinarians, pet sellers, and shop owners in one ecosystem. The platform provides services like pet adoption, pet hosting, vet consultation, pet marketplace, messaging, and community interaction with secure role-based authentication.

---

## 🚀 Features

- 🔐 Secure Authentication & Authorization using Clerk
- 👤 Role-Based Signup/Login System
- 🐶 Pet Adoption & Pet Companion Matching
- 🏠 Pet Hosting Services
- 💬 Real-Time Messaging & Notifications
- 🩺 Vet Consultation Booking
- 🛒 Pet Food & Accessories Marketplace
- 👥 Community Interaction & Discussions
- 📱 Fully Responsive Modern UI

---

## 🛠️ Tech Stack

### Frontend
- React.js
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui

### Backend
- Node.js
- Express.js

### Database
- MongoDB

### Authentication
- Clerk Authentication

### Deployment & Tools
- REST APIs
- Responsive UI Design
- Role-Based Access Control

---

## 📂 Project Structure

```bash
Pet/
├── client/             # Frontend application
├── server/             # Backend APIs and database logic
├── shared/             # Shared API utilities
├── public/             # Static assets
├── netlify/            # Netlify serverless functions
├── components.json
├── package.json
└── README.md
```

---

## 📄 Frontend Overview

### Client Pages
- Home
- Adoption
- Breeding
- Hosting
- Marketplace
- Community
- Chat
- Insurance
- Store
- Dashboard
- Sign In / Sign Up

### Key Frontend Features
- Responsive UI using Tailwind CSS
- Reusable UI components with shadcn/ui
- Real-time chat interface
- Notification system
- Role-based signup pages
- Custom React hooks for state management

---

## ⚙️ Backend Overview

### Backend Features
- RESTful API architecture
- MongoDB database integration
- CRUD operations for pets, products, chats, and users
- Notification management
- Community post handling
- Marketplace & store management

### Database Models
- Pet
- AdoptionListing
- BreedingMatch
- HostListing
- Product
- Order
- Chat
- Notification
- Vet
- PetSeller
- ShopOwner

---

## 🔑 Core Modules

### 🐾 Pet Owner
- Find pet companions
- Adopt pets
- Book vet consultations
- Join community discussions

### 🩺 Veterinarian
- Offer online consultations
- Manage appointments
- Maintain verified profiles

### 🐕 Pet Seller
- Create marketplace listings
- Connect with buyers
- Manage pet sales

### 🛒 Shop Owner
- Sell pet products
- Manage inventory & orders
- Access analytics dashboard

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/your-username/petmatch.git
cd petmatch
```

### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Setup Environment Variables

Create a `.env` file in the root directory and add:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
MONGODB_URI=your_mongodb_connection_string
```

### 4️⃣ Run the Development Server

```bash
npm run dev
```

---

## 📦 Available Scripts

```bash
npm run dev       # Run development server
npm run build     # Build project
npm run preview   # Preview production build
```

---

## 🎯 Future Enhancements

- AI-based pet recommendation system
- Online payment gateway integration
- Live video consultations
- Mobile application support
- Push notification system

---

## 👨‍💻 Author

**Vansh Jethwani**

- GitHub: https://github.com/vansh-jethwani
- LinkedIn: https://www.linkedin.com/in/vansh-jethwani-641154334/

---

## 📄 License

This project is licensed under the MIT License.
