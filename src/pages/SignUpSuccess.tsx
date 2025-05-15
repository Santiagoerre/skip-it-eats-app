
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Check } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { clearAllSignupFlags } from "@/utils/authStateHelpers";

const SignUpSuccess = () => {
  const navigate = useNavigate();
  const { userType, isLoading, user } = useAuth();
  const [redirecting, setRedirecting] = useState(false);
  const redirectAttemptedRef = useRef(false);
  const maxTimeoutRef = useRef<number | null>(null);
  const redirectTimeoutRef = useRef<number | null>(null);
  
  useEffect(() => {
    const isOAuthRedirect = window.location.hash.includes("access_token") || 
                           window.location.search.includes("access_token") ||
                           window.location.search.includes("error=");
    
    console.log("SignUpSuccess mounted:", { 
      userType, 
      isLoading,
      isOAuthRedirect,
      hash: window.location.hash,
      search: window.location.search,
      hasUser: !!user
    });
    
    const handleRedirect = () => {
      // Don't redirect if already in progress or previously attempted
      if (redirecting || redirectAttemptedRef.current) return;
      
      setRedirecting(true);
      redirectAttemptedRef.current = true;
      console.log("Preparing to redirect based on user type:", userType);
      
      // Clear all signup flags to prevent redirect loops
      clearAllSignupFlags();
      
      // Force a longer delay to allow authentication state to fully settle
      redirectTimeoutRef.current = window.setTimeout(() => {
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
      }, 3500); // Increased delay to 3.5 seconds for OAuth to fully process
    };
    
    // If auth is loaded and we have a user type, redirect
    if (!isLoading && userType) {
      console.log("Auth loaded and user type available:", userType);
      handleRedirect();
    }
    
    // Always redirect after a maximum timeout (8 seconds)
    maxTimeoutRef.current = window.setTimeout(() => {
      if (!redirectAttemptedRef.current) {
        console.log("Maximum wait time exceeded, redirecting to default page");
        
        // If we still have a user but no userType, try to use the user's metadata
        if (user && !userType) {
          const metadataUserType = user.user_metadata?.user_type as "restaurant" | "customer" | null;
          console.log("Trying to get user type from metadata:", metadataUserType);
          
          if (metadataUserType === "restaurant") {
            console.log("Found restaurant type in metadata, redirecting to restaurant dashboard");
            navigate("/restaurant-dashboard", { replace: true });
            return;
          } else if (metadataUserType === "customer") {
            console.log("Found customer type in metadata, redirecting to customer app");
            navigate("/app", { replace: true });
            return;
          }
        }
        
        handleRedirect();
      }
    }, 8000); // Increased from 7000 to 8000ms for OAuth flows
    
    return () => {
      if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current);
      if (maxTimeoutRef.current) clearTimeout(maxTimeoutRef.current);
    };
  }, [navigate, userType, isLoading, redirecting, user]);
  
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
