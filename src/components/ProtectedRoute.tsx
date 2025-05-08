
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredUserType?: 'customer' | 'restaurant' | null; // null means any type is allowed
}

const ProtectedRoute = ({ children, requiredUserType }: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoading, session, userType } = useAuth();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        // Wait for the auth context to initialize
        if (isLoading) {
          return;
        }

        console.log("ProtectedRoute - verifying auth:", { session, userType, requiredUserType });
        setIsCheckingAuth(true);
        
        // If no session, redirect to sign in
        if (!session) {
          console.log("No session, redirecting to signin");
          navigate("/signin", { state: { from: location.pathname } });
          return;
        }
        
        // If requiredUserType is specified, check if the user has the correct type
        if (requiredUserType && userType !== requiredUserType) {
          console.log("User type mismatch, redirecting", { userType, requiredUserType });
          
          // Redirect to appropriate home page based on the user's actual type
          if (userType === 'customer') {
            navigate("/app");
          } else if (userType === 'restaurant') {
            navigate("/restaurant-dashboard");
          } else {
            // Only redirect to sign up if user has no type at all
            navigate("/signin");
          }
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
  }, [isLoading, session, userType, navigate, location.pathname, requiredUserType]);

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
