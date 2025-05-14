
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { Loader2 } from "lucide-react";
import { ensureUserProfile } from "@/services/authService";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredUserType?: 'customer' | 'restaurant' | null; // null means any type is allowed
}

const ProtectedRoute = ({ children, requiredUserType }: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoading, session, user, userType } = useAuth();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      // Wait for the auth context to initialize
      if (isLoading) {
        return;
      }

      console.log("ProtectedRoute - verifying auth:", { 
        isLoading, 
        hasSession: !!session, 
        currentUserType: userType, 
        requiredUserType,
        pathname: location.pathname 
      });
      
      setIsCheckingAuth(true);
      
      try {
        // If no session, redirect to sign in
        if (!session) {
          console.log("No session, redirecting to signin from", location.pathname);
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
      } catch (error) {
        console.error('Auth verification error:', error);
        navigate("/signin");
      } finally {
        setIsCheckingAuth(false);
      }
    };

    verifyAuth();
  }, [isLoading, session, userType, navigate, location.pathname, requiredUserType, user]);

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
