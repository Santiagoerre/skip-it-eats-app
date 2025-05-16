
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
  
  useEffect(() => {
    // Check if we're in a callback URL by looking for tokens or errors in URL
    const isOAuthRedirect = window.location.hash.includes("access_token") || 
                           window.location.search.includes("access_token") ||
                           window.location.search.includes("error=");
    
    // Parse URL to check for redirect-specific parameters
    const urlParams = new URLSearchParams(window.location.search);
    const isNewSignup = urlParams.get('new') === 'true' || sessionStorage.getItem('is_new_signup') === 'true';
    
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
    
    // Store critical state information in localStorage for persistence across redirects
    preserveRedirectState(user?.id, userType);
    
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
      if (redirectAttemptedRef.current) return;
      
      setRedirecting(true);
      redirectAttemptedRef.current = true;
      
      console.log("Executing redirect based on detected user type:", detectedUserType);
      
      try {
        // Only clear flags right before redirect
        if (detectedUserType === "restaurant") {
          console.log("Redirecting to restaurant dashboard");
          // Don't clear flags until right before redirect
          clearAllSignupFlags();
          navigate("/restaurant-dashboard", { replace: true });
        } else if (detectedUserType === "customer") {
          console.log("Redirecting to customer app");
          // Don't clear flags until right before redirect
          clearAllSignupFlags();
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
      if (redirecting || redirectAttemptedRef.current) return;
      
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
        const dbUserType = await getUserTypeFromDatabase();
        if (dbUserType) {
          console.log("User type found in database:", dbUserType);
          setStatusMessage(`User type verified: ${dbUserType}. Redirecting...`);
          executeRedirect(dbUserType);
          return;
        }
      }
      
      // If we reached here and there's a user but no redirect yet,
      // update status to reflect we're still working
      if (user && !redirectAttemptedRef.current) {
        setStatusMessage("Almost there, finalizing your account...");
        
        // Set up progressive timeouts - try with increasing delays
        const delays = [1000, 2000, 3000];
        
        delays.forEach((delay, index) => {
          progressiveTimeoutRef.current = window.setTimeout(async () => {
            if (redirectAttemptedRef.current) return;
            
            // Try to get user type again with each attempt
            const attemptUserType = getUserTypeFromMetadata() || 
                                   (await getUserTypeFromDatabase()) || 
                                   restoreRedirectState();
            
            if (attemptUserType) {
              executeRedirect(attemptUserType);
            } else if (index === delays.length - 1) {
              // Last attempt, use whatever we have
              const finalUserType = userType || getUserTypeFromMetadata() || null;
              setStatusMessage("Taking longer than expected, redirecting now...");
              executeRedirect(finalUserType);
            }
          }, delay);
        });
      }
    };
    
    // If auth is loaded and we have a user, try redirect
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
    }, 10000); // Increased from 8000 to 10000ms for more time
    
    return () => {
      if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current);
      if (maxTimeoutRef.current) clearTimeout(maxTimeoutRef.current);
      if (progressiveTimeoutRef.current) clearTimeout(progressiveTimeoutRef.current);
    };
  }, [navigate, userType, isLoading, redirecting, user, location]);
  
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
