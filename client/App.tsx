import Dashboard        from "./pages/Dashboard";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home             from "./pages/Home";
import Breeding         from "./pages/Breeding";
import Adoption         from "./pages/Adoption";
import Hosting          from "./pages/Hosting";
import Marketplace      from "./pages/Marketplace";
import Vets             from "./pages/Vets";
import Insurance        from "./pages/Insurance";
import Store            from "./pages/Store";
import Community        from "./pages/Community";
import Chat             from "./pages/Chat";
import SignIn           from "./pages/SignIn";
import SignUp           from "./pages/SignUp";
import SignUpChoice     from "./pages/SignUpChoice";
import VetSignUp        from "./pages/VetSignUp";
import PetSellerSignUp  from "./pages/PetSellerSignUp";
import ShopOwnerSignUp  from "./pages/ShopOwnerSignUp";
import NotFound         from "./pages/NotFound";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/dashboard"        element={<Dashboard />} />
        <Route path="/"                 element={<Home />} />
        <Route path="/signin"           element={<SignIn />} />

        {/* ── Signup flows ── */}
        <Route path="/signup"           element={<SignUpChoice />} />
        <Route path="/signup/owner"     element={<SignUp />} />
        <Route path="/vet-signup"       element={<VetSignUp />} />
        <Route path="/seller-signup"    element={<PetSellerSignUp />} />
        <Route path="/shop-signup"      element={<ShopOwnerSignUp />} />

        <Route path="/chat"             element={<Chat />} />
        <Route path="/breeding"         element={<Breeding />} />
        <Route path="/adoption"         element={<Adoption />} />
        <Route path="/hosting"          element={<Hosting />} />
        <Route path="/marketplace"      element={<Marketplace />} />
        <Route path="/vets"             element={<Vets />} />
        <Route path="/insurance"        element={<Insurance />} />
        <Route path="/store"            element={<Store />} />
        <Route path="/community"        element={<Community />} />
        <Route path="*"                 element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
