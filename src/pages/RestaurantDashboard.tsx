
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, ClipboardList, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import MenuManagement from "@/components/restaurant/MenuManagement";
import OrdersManagement from "@/components/restaurant/OrdersManagement";
import AccountManagement from "@/components/restaurant/AccountManagement";

const RestaurantDashboard = () => {
  const navigate = useNavigate();
  const { user, userType, signOut } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("menu");

  useEffect(() => {
    // If user is a customer, redirect to customer dashboard
    if (userType === "customer") {
      navigate("/app");
    }
  }, [userType, navigate]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="mobile-container app-height flex flex-col bg-background">
      <header className="p-4 border-b bg-white flex justify-between items-center">
        <h1 className="text-xl font-bold text-skipit-primary">Restaurant Dashboard</h1>
      </header>

      <main className="flex-1 overflow-y-auto pb-16 p-4">
        {activeTab === "menu" && <MenuManagement />}
        {activeTab === "orders" && <OrdersManagement />}
        {activeTab === "account" && <AccountManagement />}
      </main>
      
      {/* Bottom Navigation for Restaurant */}
      <nav className="fixed bottom-0 left-0 right-0 border-t bg-white py-2">
        <div className="mobile-container flex justify-around items-center">
          <button
            onClick={() => handleTabChange("menu")}
            className={`bottom-tab ${
              activeTab === "menu" ? "bottom-tab-active" : "bottom-tab-inactive"
            }`}
          >
            <Menu className="h-6 w-6 mb-1" />
            <span>Menu</span>
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

export default RestaurantDashboard;
