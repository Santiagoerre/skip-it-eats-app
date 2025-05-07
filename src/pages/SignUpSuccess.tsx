
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";

const SignUpSuccess = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  useEffect(() => {
    // Show a welcome toast when the component mounts
    toast({
      title: "Welcome to Skip It!",
      description: "Your account has been created successfully.",
    });
  }, [toast]);

  return (
    <div className="mobile-container app-height flex flex-col items-center justify-center p-6 bg-white">
      <div className="text-center space-y-6">
        <CheckCircle className="h-20 w-20 text-green-500 mx-auto animate-pulse" />
        
        <h1 className="text-3xl font-bold text-skipit-primary">Sign up successful!</h1>
        
        <p className="text-muted-foreground">
          Your account has been created successfully. You can now sign in to start using Skip It.
        </p>
        
        <Button 
          className="w-full py-6 text-base mt-8"
          onClick={() => navigate("/signin")}
        >
          Go to Login
        </Button>
      </div>
    </div>
  );
};

export default SignUpSuccess;
