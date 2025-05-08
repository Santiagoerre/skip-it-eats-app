
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList, User, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";

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
    // In the future, we'll handle navigation between restaurant dashboard tabs
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="mobile-container app-height flex flex-col bg-background">
      <header className="p-4 border-b bg-white flex justify-between items-center">
        <h1 className="text-xl font-bold text-skipit-primary">Restaurant Dashboard</h1>
        <Button variant="outline" size="sm" onClick={handleSignOut}>
          Sign Out
        </Button>
      </header>

      <main className="flex-1 overflow-y-auto pb-16 p-4">
        {activeTab === "menu" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Menu Management</h2>
            <p className="text-muted-foreground">
              This is where you'll manage your restaurant menu items. This feature will be fully implemented soon.
            </p>
            <Button className="w-full" onClick={() => toast({ title: "Coming Soon", description: "Menu management will be available in the next update." })}>
              Add Menu Item
            </Button>
          </div>
        )}

        {activeTab === "orders" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Orders</h2>
            <p className="text-muted-foreground">
              View and manage customer orders here. This feature will be fully implemented soon.
            </p>
          </div>
        )}

        {activeTab === "account" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Account Settings</h2>
            <p className="text-muted-foreground">
              Manage your restaurant profile and settings. This feature will be fully implemented soon.
            </p>
          </div>
        )}
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
