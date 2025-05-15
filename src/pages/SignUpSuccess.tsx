
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Check } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { clearAllSignupFlags } from "@/utils/authStateHelpers";

const SignUpSuccess = () => {
  const navigate = useNavigate();
  const { userType, isLoading } = useAuth();
  const [redirecting, setRedirecting] = useState(false);
  
  useEffect(() => {
    let redirectTimeout: number;
    
    const handleRedirect = () => {
      // Don't redirect if already in progress
      if (redirecting) return;
      
      setRedirecting(true);
      console.log("Preparing to redirect based on user type:", userType);
      
      // Clear all signup flags to prevent redirect loops
      clearAllSignupFlags();
      
      // Short delay to allow authentication state to settle
      redirectTimeout = window.setTimeout(() => {
        if (userType === "restaurant") {
          navigate("/restaurant-dashboard", { replace: true });
        } else if (userType === "customer") {
          navigate("/app", { replace: true });
        } else {
          // If user type is unknown, redirect to home
          navigate("/", { replace: true });
        }
      }, 2000);
    };
    
    // If auth is loaded and we have a user type, redirect
    if (!isLoading && userType) {
      handleRedirect();
    }
    
    // Always redirect after a maximum timeout (5 seconds)
    const maxTimeout = window.setTimeout(() => {
      if (!redirecting) {
        console.log("Maximum wait time exceeded, redirecting to default page");
        handleRedirect();
      }
    }, 5000);
    
    return () => {
      clearTimeout(redirectTimeout);
      clearTimeout(maxTimeout);
    };
  }, [navigate, userType, isLoading, redirecting]);
  
  return (
    <div className="mobile-container flex flex-col items-center justify-center pt-12 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-6">
        {redirecting ? (
          <Loader2 className="h-8 w-8 text-green-600 animate-spin" />
        ) : (
          <Check className="h-8 w-8 text-green-600" />
        )}
      </div>
      
      <h1 className="text-2xl font-bold mb-2">Account Created!</h1>
      <p className="text-gray-600 mb-8">
        Your account has been created successfully.
      </p>
      
      <div className="text-sm text-gray-500">
        {redirecting ? "Redirecting you to your dashboard..." : "Please wait..."}
      </div>
    </div>
  );
};

export default SignUpSuccess;
