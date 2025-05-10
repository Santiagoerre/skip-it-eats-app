
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const SignUpSuccess = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userType, session } = useAuth();
  
  useEffect(() => {
    // Show a welcome toast when the component mounts
    toast({
      title: "Welcome to Skip It!",
      description: "Your account has been created successfully.",
    });
    
    // If user is already logged in, redirect to the appropriate dashboard
    if (session) {
      const timer = setTimeout(() => {
        if (userType === 'restaurant') {
          navigate("/restaurant-dashboard");
        } else if (userType === 'customer') {
          navigate("/app");
        }
      }, 1500); // Brief delay to show the success message
      
      return () => clearTimeout(timer);
    }
  }, [toast, session, userType, navigate]);

  const handleContinue = () => {
    if (session) {
      // Navigate based on user type
      if (userType === 'restaurant') {
        navigate("/restaurant-dashboard");
      } else {
        navigate("/app");
      }
    } else {
      // If not logged in, go to signin
      navigate("/signin");
    }
  };

  return (
    <div className="mobile-container app-height flex flex-col items-center justify-center p-6 bg-white">
      <div className="text-center space-y-6">
        <CheckCircle className="h-20 w-20 text-green-500 mx-auto animate-pulse" />
        
        <h1 className="text-3xl font-bold text-skipit-primary">Sign up successful!</h1>
        
        <p className="text-muted-foreground">
          Your {userType === 'restaurant' ? 'restaurant' : 'customer'} account has been created successfully. You can now sign in to start using Skip It.
        </p>
        
        <Button 
          className="w-full py-6 text-base mt-8"
          onClick={handleContinue}
        >
          {session ? 'Continue to Dashboard' : 'Go to Login'}
        </Button>
      </div>
    </div>
  );
};

export default SignUpSuccess;
