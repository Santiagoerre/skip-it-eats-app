import { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import BottomNav from "@/components/navigation/BottomNav";
import Header from "@/components/navigation/Header";
import { useAuth } from "@/contexts/auth";

const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { session, userType } = useAuth();
  const [showBottomNav, setShowBottomNav] = useState(true);

  useEffect(() => {
    // Redirect if not authenticated
    if (!session) {
      navigate("/signin");
    }

    // Hide bottom navigation on the restaurant profile page
    setShowBottomNav(location.pathname !== "/restaurant/:id");
  }, [session, location, navigate]);

  // Conditionally render the bottom navigation
  if (!session) {
    return null; // Don't render anything if not authenticated
  }

  // Redirect restaurant users
  if (userType === "restaurant") {
    navigate("/restaurant-dashboard");
    return null;
  }

  return (
    <div className="mobile-container app-height flex flex-col bg-background">
      <Header />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
      {showBottomNav && <BottomNav />}
    </div>
  );
};

export default MainLayout;
