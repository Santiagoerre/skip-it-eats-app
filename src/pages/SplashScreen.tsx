import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth";

const SplashScreen = () => {
  const navigate = useNavigate();
  const { isLoading, session, userType } = useAuth();

  useEffect(() => {
    // If user is already authenticated, redirect to appropriate dashboard
    if (!isLoading && session) {
      if (userType === "restaurant") {
        navigate("/restaurant-dashboard");
      } else if (userType === "customer") {
        navigate("/app");
      }
    }
  }, [isLoading, session, userType, navigate]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-skipit-light">
        <div className="animate-pulse">
          <h1 className="text-4xl font-bold text-skipit-primary">Skip It</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen p-6 bg-skipit-light">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-skipit-primary mb-2">Skip It</h1>
        <p className="text-xl text-gray-700">Order ahead, skip the line</p>
      </div>
      
      <div className="w-full max-w-md space-y-4">
        <Button 
          className="w-full py-6 text-lg" 
          onClick={() => navigate("/signin")}
        >
          Sign In
        </Button>
        
        <Button 
          variant="outline" 
          className="w-full py-6 text-lg"
          onClick={() => navigate("/signup")}
        >
          Create Account
        </Button>
      </div>
    </div>
  );
};

export default SplashScreen;
