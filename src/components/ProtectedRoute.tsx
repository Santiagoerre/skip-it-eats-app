
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { checkAuth, getCurrentUserType } from "@/services/authService";
import { useAuth } from "@/contexts/AuthContext";

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

        setIsCheckingAuth(true);
        
        // If no session, redirect to sign in
        if (!session) {
          navigate("/signin", { state: { from: location.pathname } });
          return;
        }
        
        // If requiredUserType is specified, check if the user has the correct type
        if (requiredUserType && userType !== requiredUserType) {
          // Redirect to appropriate home page
          if (userType === 'customer') {
            navigate("/app");
          } else if (userType === 'restaurant') {
            navigate("/restaurant-dashboard");
          } else {
            navigate("/signup"); // If user type is not set, redirect to signup
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

  // Show nothing while checking authentication
  if (isLoading || isCheckingAuth) {
    return null;
  }

  // If we've reached this point, the user is authenticated and has the correct type
  return <>{children}</>;
};

export default ProtectedRoute;
