
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const UserTypeSelection = () => {
  const navigate = useNavigate();

  const handleUserTypeSelection = (type: "customer" | "merchant") => {
    // In a real app, we would save this preference in the user's profile
    console.log("Selected user type:", type);
    if (type === "customer") {
      navigate("/app");
    } else {
      navigate("/restaurant-dashboard");
    }
  };

  return (
    <div className="mobile-container app-height flex flex-col p-6">
      <button 
        onClick={() => navigate("/signup")}
        className="flex items-center text-muted-foreground mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </button>
      
      <div className="flex-1 flex flex-col justify-center">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-skipit-primary">I am a...</h1>
          <p className="text-muted-foreground mt-2">
            Choose how you'll use Skip It
          </p>
        </div>
        
        <div className="space-y-6">
          <Button 
            variant="outline" 
            className="w-full py-8 flex flex-col items-center justify-center border-2 hover:bg-skipit-light"
            onClick={() => handleUserTypeSelection("customer")}
          >
            <span className="text-xl font-semibold mb-2">Customer</span>
            <span className="text-sm text-muted-foreground">
              I want to order food and skip the line
            </span>
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full py-8 flex flex-col items-center justify-center border-2 hover:bg-skipit-light"
            onClick={() => handleUserTypeSelection("merchant")}
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
