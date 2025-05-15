
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Check } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { clearAllSignupFlags } from "@/utils/authStateHelpers";

const SignUpSuccess = () => {
  const navigate = useNavigate();
  const { userType, isLoading } = useAuth();
  const [redirecting, setRedirecting] = useState(false);
  const redirectAttemptedRef = useRef(false);
  
  useEffect(() => {
    let redirectTimeout: number;
    let maxTimeout: number;
    
    const handleRedirect = () => {
      // Don't redirect if already in progress or previously attempted
      if (redirecting || redirectAttemptedRef.current) return;
      
      setRedirecting(true);
      redirectAttemptedRef.current = true;
      console.log("Preparing to redirect based on user type:", userType);
      
      // Clear all signup flags to prevent redirect loops
      clearAllSignupFlags();
      
      // Force a longer delay to allow authentication state to fully settle
      redirectTimeout = window.setTimeout(() => {
        console.log("Executing delayed redirect for user type:", userType);
        
        if (userType === "restaurant") {
          console.log("Redirecting to restaurant dashboard");
          navigate("/restaurant-dashboard", { replace: true });
        } else if (userType === "customer") {
          console.log("Redirecting to customer app");
          navigate("/app", { replace: true });
        } else {
          // If user type is unknown, redirect to home
          console.log("No user type found, redirecting to home");
          navigate("/", { replace: true });
        }
      }, 3000); // Increased delay to 3 seconds to ensure auth state is fully processed
    };
    
    // If auth is loaded and we have a user type, redirect
    if (!isLoading && userType) {
      console.log("Auth loaded and user type available:", userType);
      handleRedirect();
    }
    
    // Always redirect after a maximum timeout (7 seconds)
    maxTimeout = window.setTimeout(() => {
      if (!redirectAttemptedRef.current) {
        console.log("Maximum wait time exceeded, redirecting to default page");
        handleRedirect();
      }
    }, 7000); // Increased from 6000 to 7000ms for extra safety
    
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
