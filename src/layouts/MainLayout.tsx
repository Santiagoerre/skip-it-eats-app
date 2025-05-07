
import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { MapPin, ClipboardList, User } from "lucide-react";

const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(getActiveTab(location.pathname));

  function getActiveTab(path: string) {
    if (path === "/app") return "map";
    if (path === "/app/orders") return "orders";
    if (path === "/app/account") return "account";
    return "map";
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    switch (tab) {
      case "map":
        navigate("/app");
        break;
      case "orders":
        navigate("/app/orders");
        break;
      case "account":
        navigate("/app/account");
        break;
      default:
        navigate("/app");
    }
  };

  return (
    <div className="mobile-container app-height flex flex-col bg-background">
      <main className="flex-1 overflow-y-auto pb-16">
        <Outlet />
      </main>
      
      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 border-t bg-white py-2">
        <div className="mobile-container flex justify-around items-center">
          <button
            onClick={() => handleTabChange("map")}
            className={`bottom-tab ${
              activeTab === "map" ? "bottom-tab-active" : "bottom-tab-inactive"
            }`}
          >
            <MapPin className="h-6 w-6 mb-1" />
            <span>Explore</span>
          </button>
          
          <button
            onClick={() => handleTabChange("orders")}
            className={`bottom-tab ${
              activeTab === "orders" ? "bottom-tab-active" : "bottom-tab-inactive"
            }`}
          >
            <ClipboardList className="h-6 w-6 mb-1" />
            <span>Orders</span>
          </button>
          
          <button
            onClick={() => handleTabChange("account")}
            className={`bottom-tab ${
              activeTab === "account" ? "bottom-tab-active" : "bottom-tab-inactive"
            }`}
          >
            <User className="h-6 w-6 mb-1" />
            <span>Account</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default MainLayout;
