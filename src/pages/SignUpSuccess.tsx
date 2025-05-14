
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast"; // Updated import path
import { useAuth } from "@/contexts/auth";

const SignUpSuccess = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userType, session, signIn } = useAuth();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [password, setPassword] = useState<string | null>(null);
  const [redirectAttempted, setRedirectAttempted] = useState(false);
  const hasToastShown = useRef(false);
  
  useEffect(() => {
    // First check if we have credentials in sessionStorage (from redirect)
    const storedEmail = sessionStorage.getItem('temp_email');
    const storedPassword = sessionStorage.getItem('temp_password');
    
    if (storedEmail && storedPassword) {
      setEmail(storedEmail);
      setPassword(storedPassword);
      
      // Try to sign in with stored credentials
      const attemptSignIn = async () => {
        try {
          await signIn(storedEmail, storedPassword);
          // Clear credentials after use
          sessionStorage.removeItem('temp_email');
          sessionStorage.removeItem('temp_password');
        } catch (error) {
          console.error("Failed to auto sign-in:", error);
        } finally {
          setIsCheckingAuth(false);
        }
      };
      
      attemptSignIn();
    } else {
      setIsCheckingAuth(false);
    }
  }, [signIn]);
  
  useEffect(() => {
    // Only show welcome toast once and only if not already shown
    if (!hasToastShown.current) {
      const hasShownWelcome = sessionStorage.getItem('shown_welcome_toast');
      if (!hasShownWelcome) {
        toast({
          title: "Welcome to Skip It!",
          description: "Your account has been created successfully.",
        });
        sessionStorage.setItem('shown_welcome_toast', 'true');
        hasToastShown.current = true;
      }
    }
    
    // If user is already logged in, redirect to the appropriate dashboard
    // But only attempt the redirect once to avoid infinite loops
    if (session && userType && !redirectAttempted) {
      setRedirectAttempted(true);
      const timer = setTimeout(() => {
        if (userType === 'restaurant') {
          navigate("/restaurant-dashboard");
        } else if (userType === 'customer') {
          navigate("/app");
        }
      }, 1500); // Brief delay to show the success message
      
      return () => clearTimeout(timer);
    }
  }, [toast, session, userType, navigate, redirectAttempted]);

  const handleContinue = async () => {
    if (session) {
      // Navigate based on user type
      if (userType === 'restaurant') {
        navigate("/restaurant-dashboard");
      } else {
        navigate("/app");
      }
    } else if (email && password) {
      // Try to sign in if we have credentials but no session yet
      try {
        await signIn(email, password);
      } catch (error) {
        console.error("Failed to sign in:", error);
        navigate("/signin");
      }
    } else {
      // If not logged in, go to signin
      navigate("/signin");
    }
  };

  // Show loading state while checking auth
  if (isCheckingAuth) {
    return (
      <div className="mobile-container app-height flex flex-col items-center justify-center p-6 bg-white">
        <div className="text-center space-y-6">
          <CheckCircle className="h-20 w-20 text-skipit-primary animate-pulse mx-auto" />
          <p className="text-muted-foreground">Checking your account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-container app-height flex flex-col items-center justify-center p-6 bg-white">
      <div className="text-center space-y-6">
        <CheckCircle className="h-20 w-20 text-green-500 mx-auto" />
        
        <h1 className="text-3xl font-bold text-skipit-primary">Sign up successful!</h1>
        
        <p className="text-muted-foreground">
          Your {userType === 'restaurant' ? 'restaurant' : 'customer'} account has been created successfully. You can now sign in to start using Skip It.
        </p>
        
        <Button 
          className="w-full py-6 text-base mt-8"
          onClick={handleContinue}
        >
          {session ? 'Continue to Dashboard' : 'Go to Login'}
        </Button>
      </div>
    </div>
  );
};

export default SignUpSuccess;
