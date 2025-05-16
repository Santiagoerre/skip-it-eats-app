
import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2, Check } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";
import { clearAllSignupFlags, preserveRedirectState, restoreRedirectState } from "@/utils/authStateHelpers";

const SignUpSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userType, isLoading, user } = useAuth();
  const [redirecting, setRedirecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Please wait...");
  const redirectAttemptedRef = useRef(false);
  const maxTimeoutRef = useRef<number | null>(null);
  const redirectTimeoutRef = useRef<number | null>(null);
  const progressiveTimeoutRef = useRef<number | null>(null);
  const redirectProcessStartedRef = useRef(false);
  
  useEffect(() => {
    // Check if we're in a callback URL by looking for tokens or errors in URL
    const isOAuthRedirect = window.location.hash.includes("access_token") || 
                           window.location.search.includes("access_token") ||
                           window.location.search.includes("error=");
    
    // Parse URL to check for redirect-specific parameters
    const urlParams = new URLSearchParams(window.location.search);
    const isNewSignup = urlParams.get('new') === 'true' || localStorage.getItem('skipit_new_signup') === 'true';
    
    console.log("SignUpSuccess mounted:", { 
      userType, 
      isLoading,
      isOAuthRedirect,
      pathname: location.pathname,
      hash: window.location.hash,
      search: window.location.search,
      hasUser: !!user,
      isNewSignup
    });
    
    // Prevent duplicate initialization of the redirect process
    if (redirectProcessStartedRef.current) {
      console.log("Redirect process already started, skipping initialization");
      return;
    }
    
    redirectProcessStartedRef.current = true;
    
    // Store critical state information in localStorage for persistence across redirects
    if (user?.id && userType) {
      preserveRedirectState(user.id, userType);
    }
    
    const getUserTypeFromMetadata = () => {
      if (!user) return null;
      
      // Try to get user_type from metadata
      const metadataUserType = user.user_metadata?.user_type as "restaurant" | "customer" | null;
      console.log("Retrieved user type from metadata:", metadataUserType);
      return metadataUserType;
    };
    
    const getUserTypeFromDatabase = async () => {
      if (!user || !user.id) return null;
      
      try {
        console.log("Fetching user type from database for user:", user.id);
        const { data, error } = await supabase
          .from("profiles")
          .select("user_type")
          .eq("id", user.id)
          .maybeSingle();
          
        if (error) {
          console.error("Error fetching user type from database:", error);
          return null;
        }
        
        if (data && data.user_type) {
          console.log("Retrieved user type from database:", data.user_type);
          return data.user_type as "restaurant" | "customer";
        }
        
        return null;
      } catch (err) {
        console.error("Failed to fetch user type from database:", err);
        return null;
      }
    };
    
    const executeRedirect = (detectedUserType: "restaurant" | "customer" | null) => {
      if (redirectAttemptedRef.current) {
        console.log("Redirect already attempted, skipping");
        return;
      }
      
      setRedirecting(true);
      redirectAttemptedRef.current = true;
      
      console.log("Executing redirect based on detected user type:", detectedUserType);
      
      try {
        if (detectedUserType === "restaurant") {
          console.log("Redirecting to restaurant dashboard");
          // Clear flags right before redirect
          clearAllSignupFlags();
          // Use replace to prevent back button from returning to this page
          navigate("/restaurant-dashboard", { replace: true });
        } else if (detectedUserType === "customer") {
          console.log("Redirecting to customer app");
          // Clear flags right before redirect
          clearAllSignupFlags();
          // Use replace to prevent back button from returning to this page
          navigate("/app", { replace: true });
        } else {
          // If no user type detected and we've tried everything, fall back to default
          console.log("No user type detected, redirecting to home page");
          clearAllSignupFlags();
          navigate("/", { replace: true });
        }
      } catch (error) {
        console.error("Error during redirect:", error);
        // Safety fallback
        clearAllSignupFlags();
        navigate("/", { replace: true });
      }
    };
    
    const handleRedirect = async () => {
      // Don't redirect if already in progress or previously attempted
      if (redirecting || redirectAttemptedRef.current) {
        console.log("Redirect already in progress or attempted, skipping");
        return;
      }
      
      setStatusMessage("Preparing to redirect...");
      console.log("Preparing to redirect based on user type:", userType);
      
      // 1. First try with the userType from context (fastest)
      if (userType) {
        console.log("User type available from context:", userType);
        setStatusMessage(`User type found: ${userType}. Redirecting...`);
        executeRedirect(userType);
        return;
      }
      
      // 2. Try to get from user metadata (second fastest)
      const metadataUserType = getUserTypeFromMetadata();
      if (metadataUserType) {
        console.log("User type found in metadata:", metadataUserType);
        setStatusMessage(`User type found in profile: ${metadataUserType}. Redirecting...`);
        executeRedirect(metadataUserType);
        return;
      }
      
      // 3. Try to get from localStorage (for persistence across redirects)
      const storedUserType = restoreRedirectState();
      if (storedUserType) {
        console.log("User type found in stored state:", storedUserType);
        setStatusMessage(`Restored user type: ${storedUserType}. Redirecting...`);
        executeRedirect(storedUserType);
        return;
      }
      
      // 4. Last resort - try to get from database directly
      if (user && !redirectAttemptedRef.current) {
        setStatusMessage("Checking your profile...");
        try {
          const dbUserType = await getUserTypeFromDatabase();
          if (dbUserType) {
            console.log("User type found in database:", dbUserType);
            setStatusMessage(`User type verified: ${dbUserType}. Redirecting...`);
            executeRedirect(dbUserType);
            return;
          }
        } catch (error) {
          console.error("Error getting user type from database:", error);
        }
      }
      
      // If we reached here and there's a user but no redirect yet,
      // update status to reflect we're still working
      if (user && !redirectAttemptedRef.current) {
        setStatusMessage("Almost there, finalizing your account...");
        
        // Single delayed attempt instead of multiple progressive ones
        redirectTimeoutRef.current = window.setTimeout(async () => {
          if (redirectAttemptedRef.current) return;
          
          try {
            // Final attempt to get user type
            const finalUserType = userType || 
                                getUserTypeFromMetadata() || 
                                restoreRedirectState() || 
                                (await getUserTypeFromDatabase());
            
            setStatusMessage("Taking longer than expected, redirecting now...");
            executeRedirect(finalUserType);
          } catch (error) {
            console.error("Error in delayed redirect:", error);
            // Safety fallback
            executeRedirect(null);
          }
        }, 2000);
      }
    };
    
    // If auth is loaded, try redirect
    if (!isLoading) {
      if (user) {
        console.log("Auth loaded and user available, attempting redirect");
        handleRedirect();
      } else if (!isOAuthRedirect && !isNewSignup) {
        // No user and not in OAuth flow - redirect to sign in
        console.log("No user detected and not in OAuth flow, redirecting to sign in");
        navigate("/signin", { replace: true });
      }
    }
    
    // Always redirect after a maximum timeout (10 seconds)
    maxTimeoutRef.current = window.setTimeout(() => {
      if (!redirectAttemptedRef.current) {
        console.log("Maximum wait time exceeded, using fallback redirect");
        setStatusMessage("Finalizing your account setup...");
        
        // Final attempt to get user type
        const finalUserType = userType || 
                            getUserTypeFromMetadata() || 
                            restoreRedirectState() || 
                            (user?.user_metadata?.user_type as "restaurant" | "customer" | null);
        
        executeRedirect(finalUserType);
      }
    }, 10000);
    
    return () => {
      // Clear all timeouts on unmount
      if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current);
      if (maxTimeoutRef.current) clearTimeout(maxTimeoutRef.current);
      if (progressiveTimeoutRef.current) clearTimeout(progressiveTimeoutRef.current);
    };
  }, [navigate, userType, isLoading, user]); // Remove redirecting from dependencies
  
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
        {statusMessage}
      </div>
    </div>
  );
};

export default SignUpSuccess;
