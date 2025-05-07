
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const SplashScreen = () => {
  const navigate = useNavigate();

  return (
    <div className="mobile-container app-height flex flex-col justify-center items-center p-6 bg-white">
      <div className="animate-fade-in flex flex-col items-center space-y-8 w-full">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-skipit-primary mb-2">Skip It</h1>
          <p className="text-lg text-muted-foreground italic">
            Order now, save time later
          </p>
        </div>
        
        <div className="flex flex-col w-full space-y-4 mt-10">
          <Button
            className="w-full py-6 text-lg font-semibold"
            onClick={() => navigate("/signin")}
          >
            Sign In
          </Button>
          
          <Button
            variant="outline"
            className="w-full py-6 text-lg font-semibold"
            onClick={() => navigate("/signup")}
          >
            Sign Up
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
