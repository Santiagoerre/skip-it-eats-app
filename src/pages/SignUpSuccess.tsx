
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

const SignUpSuccess = () => {
  const navigate = useNavigate();

  return (
    <div className="mobile-container app-height flex flex-col items-center justify-center p-6 bg-white">
      <div className="text-center space-y-6">
        <CheckCircle className="h-20 w-20 text-green-500 mx-auto" />
        
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
