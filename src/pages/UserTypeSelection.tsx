
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth";
import { UserType } from "@/contexts/auth/types";

const UserTypeSelection = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<UserType | null>(null);
  const { session, userType, isLoading: authLoading } = useAuth();
  
  // Redirect if user is already logged in and has a type
  useEffect(() => {
    // Only run this check after auth has fully loaded and we're not in a signup flow
    if (!authLoading && session && userType) {
      console.log("UserTypeSelection - Logged in user with type detected:", userType);
      // User already has a type, redirect them to the appropriate page
      if (userType === "restaurant") {
        navigate("/restaurant-dashboard");
      } else if (userType === "customer") {
        navigate("/app");
      }
    }
  }, [session, userType, navigate, authLoading]);

  const handleUserTypeSelection = (type: UserType) => {
    console.log("UserTypeSelection - Selected type:", type);
    setSelectedType(type);
    setIsLoading(true);
    
    try {
      // Navigate to the appropriate signup page
      if (type === "customer") {
        console.log("UserTypeSelection - Navigating to customer signup");
        navigate("/signup/customer");
      } else if (type === "restaurant") {
        console.log("UserTypeSelection - Navigating to restaurant signup");
        navigate("/signup/restaurant");
      } else {
        console.error("UserTypeSelection - Invalid user type selected:", type);
      }
    } catch (error) {
      console.error("UserTypeSelection - Navigation error:", error);
    } finally {
      // Always make sure to clear loading state
      setIsLoading(false);
    }
  };

  return (
    <div className="mobile-container app-height flex flex-col p-6 bg-white">
      <button 
        onClick={() => navigate("/")}
        className="flex items-center text-muted-foreground mb-6"
        disabled={isLoading}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </button>
      
      <div className="flex-1 flex flex-col justify-center items-center">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-skipit-primary">I am a...</h1>
          <p className="text-muted-foreground mt-2">
            Choose how you'll use Skip It
          </p>
        </div>
        
        <div className="space-y-6 w-full">
          <Button 
            variant="outline" 
            className={`w-full py-8 flex flex-col items-center justify-center border-2 transition-all duration-200 ${
              selectedType === "customer" 
                ? "border-skipit-primary bg-skipit-light" 
                : "hover:bg-skipit-light"
            }`}
            onClick={() => handleUserTypeSelection("customer")}
            disabled={isLoading}
          >
            <span className="text-xl font-semibold mb-2">Customer</span>
            <span className="text-sm text-muted-foreground">
              I want to order food and skip the line
            </span>
          </Button>
          
          <Button 
            variant="outline" 
            className={`w-full py-8 flex flex-col items-center justify-center border-2 transition-all duration-200 ${
              selectedType === "restaurant" 
                ? "border-skipit-primary bg-skipit-light" 
                : "hover:bg-skipit-light"
            }`}
            onClick={() => handleUserTypeSelection("restaurant")}
            disabled={isLoading}
          >
            <span className="text-xl font-semibold mb-2">Restaurant / Food Truck</span>
            <span className="text-sm text-muted-foreground">
              I want to receive orders from customers
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UserTypeSelection;
