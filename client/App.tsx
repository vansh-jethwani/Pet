import Dashboard from "./pages/Dashboard";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Breeding from "./pages/Breeding";
import Adoption from "./pages/Adoption";
import Hosting from "./pages/Hosting";
import Marketplace from "./pages/Marketplace";
import Vets from "./pages/Vets";
import Insurance from "./pages/Insurance";
import Store from "./pages/Store";
import Community from "./pages/Community";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import PetProfile from "./pages/PetProfile";
import DogsCategory from "./pages/categories/DogsCategory";
import CatsCategory from "./pages/categories/CatsCategory";
import FishCategory from "./pages/categories/FishCategory";
import BirdsCategory from "./pages/categories/BirdsCategory";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/" element={<Home />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/pet-profile" element={<PetProfile />} />
        <Route path="/category/dogs" element={<DogsCategory />} />
        <Route path="/category/cats" element={<CatsCategory />} />
        <Route path="/category/fish" element={<FishCategory />} />
        <Route path="/category/birds" element={<BirdsCategory />} />
        <Route path="/breeding" element={<Breeding />} />
        <Route path="/adoption" element={<Adoption />} />
        <Route path="/hosting" element={<Hosting />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/vets" element={<Vets />} />
        <Route path="/insurance" element={<Insurance />} />
        <Route path="/store" element={<Store />} />
        <Route path="/community" element={<Community />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
