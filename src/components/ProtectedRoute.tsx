
import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { Loader2 } from "lucide-react";
import { ensureUserProfile } from "@/services/authService";
import { clearAllSignupFlags, isNewSignupFlow } from "@/utils/authStateHelpers";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredUserType?: 'customer' | 'restaurant' | null; // null means any type is allowed
}

const ProtectedRoute = ({ children, requiredUserType }: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoading, session, user, userType } = useAuth();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const authCheckCompletedRef = useRef(false);
  const pathCheckedRef = useRef(false);

  // Parse the URL to better detect special routes
  const isCallbackUrl = location.pathname.includes("/auth/callback");
  const isSignupRoute = location.pathname.includes("/signup");
  const isSignupSuccess = location.pathname.includes("/signup-success");
  const isAuthCallback = location.pathname.includes("/auth/callback");
  const hasAuthTokens = location.hash.includes("access_token") || 
                       location.search.includes("access_token") ||
                       location.search.includes("refresh_token");
  const isNewSignup = isNewSignupFlow();

  useEffect(() => {
    // Skip checks for specific paths on initial render
    if (!pathCheckedRef.current) {
      pathCheckedRef.current = true;
      
      // Log all information about current route and state
      console.log("ProtectedRoute initializing for:", location.pathname, {
        isCallbackUrl,
        isSignupRoute,
        isSignupSuccess,
        isAuthCallback,
        hasAuthTokens,
        isNewSignup,
        userType,
        requiredUserType,
        hasUser: !!user,
        hasSession: !!session
      });
      
      // IMPORTANT: Skip ALL checks for these special routes
      if (isSignupRoute || isAuthCallback || isSignupSuccess || hasAuthTokens || isNewSignup) {
        console.log("ProtectedRoute - allowing access without checks for special route:", location.pathname);
        setIsCheckingAuth(false);
        return;
      }
    }
    
    const verifyAuth = async () => {
      // Prevent multiple simultaneous auth checks
      if (authCheckCompletedRef.current) {
        return;
      }
      
      // Wait for the auth context to initialize
      if (isLoading) {
        console.log("Auth is still loading, waiting...");
        return;
      }

      console.log("ProtectedRoute - verifying auth:", { 
        isLoading, 
        hasSession: !!session, 
        currentUserType: userType, 
        requiredUserType,
        pathname: location.pathname
      });
      
      // Skip again for special routes (belt and suspenders)
      if (isSignupRoute || isAuthCallback || isSignupSuccess || hasAuthTokens || isNewSignup) {
        console.log("ProtectedRoute - allowing access to special route without checks:", location.pathname);
        setIsCheckingAuth(false);
        return;
      }
      
      setIsCheckingAuth(true);
      authCheckCompletedRef.current = true;
      
      try {
        // If no session, redirect to sign in
        if (!session) {
          console.log("No session, redirecting to signin from", location.pathname);
          // Clear any lingering signup flags
          clearAllSignupFlags();
          navigate("/signin", { state: { from: location.pathname } });
          return;
        }
        
        // If user has no type but should have one, try to ensure profile and get type
        if (session && user && !userType) {
          console.log("User has no type, trying to ensure profile");
          // Check user metadata for user_type
          const metadataUserType = user.user_metadata?.user_type as 'customer' | 'restaurant' | null;
          
          if (metadataUserType) {
            console.log(`Found user type in metadata: ${metadataUserType}, ensuring profile exists`);
            // This will create a profile if one doesn't exist
            await ensureUserProfile(user.id, metadataUserType);
            
            // Handle redirection based on user type from metadata
            if (requiredUserType && metadataUserType !== requiredUserType) {
              console.log("Type mismatch from metadata:", metadataUserType, "vs required:", requiredUserType);
              redirectBasedOnUserType(metadataUserType);
              return;
            }
          } else {
            console.log("No user type found, redirecting to signup for type selection");
            navigate("/signup");
            return;
          }
        }
        
        // If requiredUserType is specified and the user has a type, check if it matches
        if (requiredUserType && userType && userType !== requiredUserType) {
          console.log("User type mismatch, redirecting", { userType, requiredUserType });
          redirectBasedOnUserType(userType);
          return;
        }
        
        // If we get here, auth is verified
        setIsCheckingAuth(false);
      } catch (error) {
        console.error('Auth verification error:', error);
        navigate("/signin");
      } finally {
        setIsCheckingAuth(false);
      }
    };

    // Use a small delay to ensure auth state is fully loaded
    const timeoutId = setTimeout(() => {
      verifyAuth();
    }, 50);
    
    return () => {
      clearTimeout(timeoutId);
      // Reset the auth check ref when component unmounts
      authCheckCompletedRef.current = false;
    };
  }, [isLoading, session, userType, navigate, location.pathname, requiredUserType, user, isSignupRoute, isNewSignup, isSignupSuccess, isAuthCallback, hasAuthTokens]);

  // Helper function to redirect based on user type
  const redirectBasedOnUserType = (type: 'customer' | 'restaurant') => {
    if (type === 'customer') {
      navigate("/app");
    } else if (type === 'restaurant') {
      navigate("/restaurant-dashboard");
    } else {
      navigate("/signin");
    }
  };

  // For auth callback and signup success pages, just render without checks
  if (isAuthCallback || isSignupSuccess || hasAuthTokens) {
    console.log("ProtectedRoute - rendering special page without auth checks");
    return <>{children}</>;
  }

  // Show loading indicator while checking authentication
  if (isLoading || isCheckingAuth) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-skipit-primary" />
      </div>
    );
  }

  // If we've reached this point, the user is authenticated and has the correct type
  return <>{children}</>;
};

export default ProtectedRoute;
