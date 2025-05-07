
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const UserTypeSelection = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<"customer" | "merchant" | null>(null);

  const handleUserTypeSelection = async (type: "customer" | "merchant") => {
    setSelectedType(type);
    setIsLoading(true);
    
    try {
      // In a real app with Supabase, we would update the user metadata here
      // const { error } = await supabase.auth.updateUser({
      //   data: { user_type: type }
      // });
      
      // if (error) throw error;
      
      // For now, just navigate to the appropriate signup page
      console.log("Selected user type:", type);
      
      setTimeout(() => {
        if (type === "customer") {
          navigate("/signup/customer");
        } else {
          navigate("/signup/restaurant");
        }
        setIsLoading(false);
      }, 500); // Small delay to show the selection state
    } catch (error) {
      console.error("Error setting user type:", error);
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
              selectedType === "merchant" 
                ? "border-skipit-primary bg-skipit-light" 
                : "hover:bg-skipit-light"
            }`}
            onClick={() => handleUserTypeSelection("merchant")}
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
