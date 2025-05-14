
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2 } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth";
import { ensureUserProfile } from "@/services/authService";
import { supabase } from "@/integrations/supabase/client";
import { clearAllSignupFlags, getTemporaryCredentials, getNewUserId } from "@/utils/authStateHelpers";

const SignUpSuccess = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userType, session, user, signIn } = useAuth();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [password, setPassword] = useState<string | null>(null);
  const [redirectAttempted, setRedirectAttempted] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [authTimeout, setAuthTimeout] = useState<NodeJS.Timeout | null>(null);
  const hasToastShown = useRef(false);
  const signInAttempted = useRef(false);
  
  useEffect(() => {
    // Avoid duplicate initialization
    if (signInAttempted.current) return;
    signInAttempted.current = true;
    
    // Clear the redirect flags to prevent navigation loops
    sessionStorage.removeItem('restaurant_redirect_attempted');
    
    // Check for credentials or new user ID in sessionStorage
    const { email: storedEmail, password: storedPassword } = getTemporaryCredentials();
    const newUserId = getNewUserId();
    
    if (storedEmail && storedPassword) {
      setEmail(storedEmail);
      setPassword(storedPassword);
      
      // Try to sign in with stored credentials
      const attemptSignIn = async () => {
        try {
          console.log("Attempting auto sign-in with stored credentials");
          await signIn(storedEmail, storedPassword);
          
          // Don't clear credentials yet - we'll do it after successful profile verification
          console.log("Auto sign-in successful");
        } catch (error) {
          console.error("Failed to auto sign-in:", error);
          
          // Set a timeout to try again if login fails
          const timeout = setTimeout(async () => {
            try {
              console.log("Retrying auto sign-in after delay");
              await signIn(storedEmail, storedPassword);
              console.log("Delayed auto sign-in successful");
            } catch (retryError) {
              console.error("Failed to auto sign-in after retry:", retryError);
              setIsCheckingAuth(false);
            }
          }, 3000);
          
          setAuthTimeout(timeout);
        } finally {
          setIsCheckingAuth(false);
        }
      };
      
      attemptSignIn();
    } else if (newUserId) {
      console.log("New user ID found in session storage:", newUserId);
      setIsCheckingAuth(false);
    } else {
      console.log("No credentials or user ID found in session storage");
      setIsCheckingAuth(false);
    }
    
    // Clean up the timeout if component unmounts
    return () => {
      if (authTimeout) {
        clearTimeout(authTimeout);
      }
    };
  }, [signIn]);
  
  // Effect to ensure profile is created after login - only run once when user and userType are available
  useEffect(() => {
    // Do not retry if we have already hit the retry limit
    if (retryCount >= 5) return;
    
    // Only run this effect if user is logged in and user type is known
    if (!user || !userType || isCreatingProfile) return;
    
    const createUserProfile = async () => {
      setIsCreatingProfile(true);
      try {
        console.log("Ensuring user profile exists for:", user.id, "with type:", userType);
        
        // First check if profile exists
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, user_type')
          .eq('id', user.id)
          .maybeSingle();
          
        if (profileError) {
          console.error("Error checking profile:", profileError);
        }
        
        if (!profileData) {
          console.log("No profile found, creating one");
          
          // Force profile creation
          const success = await ensureUserProfile(user.id, userType);
          console.log("Profile creation result:", success);
          
          if (!success) {
            // Increment retry count if failed
            setRetryCount(prev => prev + 1);
            // Wait a bit longer before trying again
            setTimeout(() => setIsCreatingProfile(false), 2000);
            return;
          }
        } else {
          console.log("Profile already exists:", profileData);
        }
        
        // Since we're at this point, we can safely clear temporary credentials
        if (email && password) {
          console.log("Profile verified, clearing temporary credentials");
          setTimeout(() => {
            sessionStorage.removeItem('temp_email');
            sessionStorage.removeItem('temp_password');
          }, 1000);
        }
        
        // Check for restaurant details if user is a restaurant
        if (userType === 'restaurant') {
          console.log("Checking restaurant details");
          
          const { data: detailsData, error: detailsError } = await supabase
            .from('restaurant_details')
            .select('id, name')
            .eq('restaurant_id', user.id)
            .maybeSingle();
            
          if (detailsError) {
            console.error("Error checking restaurant details:", detailsError);
          }
          
          if (!detailsData) {
            console.log("No restaurant details found, creating default");
            
            const { error: createError } = await supabase
              .from('restaurant_details')
              .insert({
                restaurant_id: user.id,
                name: user.user_metadata?.display_name || 'New Restaurant',
                cuisine: user.user_metadata?.food_type || 'Not specified',
                price_range: '$',
                description: 'Restaurant created on ' + new Date().toISOString()
              });
              
            if (createError) {
              console.error("Error creating restaurant details:", createError);
              setRetryCount(prev => prev + 1);
              setTimeout(() => setIsCreatingProfile(false), 2000);
              return;
            }
            
            console.log("Restaurant details created successfully");
          } else {
            console.log("Restaurant details found:", detailsData);
          }
        }
        
        // We're all set, mark profile creation as complete
        setIsCreatingProfile(false);
        
        // Now we can safely remove the is_new_signup flag since profile is verified
        sessionStorage.removeItem('is_new_signup');
        
      } catch (error) {
        console.error("Error ensuring profile:", error);
        setRetryCount(prev => prev + 1);
        setTimeout(() => setIsCreatingProfile(false), 2000);
      }
    };
    
    createUserProfile();
  }, [user, userType, isCreatingProfile, retryCount, email, password]);
  
  // Show welcome toast and handle redirects
  useEffect(() => {
    // Only show welcome toast once
    if (!hasToastShown.current) {
      toast({
        title: "Welcome to Skip It!",
        description: "Your account has been created successfully.",
      });
      sessionStorage.setItem('shown_welcome_toast', 'true');
      hasToastShown.current = true;
    }
    
    // Handle redirect logic - don't redirect while still checking auth or creating profile
    if (session && userType && !redirectAttempted && !isCheckingAuth && !isCreatingProfile) {
      setRedirectAttempted(true);
      
      // Give extra time for everything to settle
      const timer = setTimeout(() => {
        if (userType === 'restaurant') {
          console.log("Redirecting to restaurant dashboard");
          navigate("/restaurant-dashboard", { replace: true });
        } else if (userType === 'customer') {
          console.log("Redirecting to customer app");
          navigate("/app", { replace: true });
        }
        
        // Clear all signup flags after successful redirect
        setTimeout(clearAllSignupFlags, 1000);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [toast, session, userType, navigate, redirectAttempted, isCheckingAuth, isCreatingProfile]);

  // Handle continue button click
  const handleContinue = async () => {
    if (session) {
      // Navigate based on user type
      if (userType === 'restaurant') {
        navigate("/restaurant-dashboard", { replace: true });
      } else {
        navigate("/app", { replace: true });
      }
      
      // Clean up session storage
      setTimeout(clearAllSignupFlags, 1000);
    } else if (email && password) {
      // Try to sign in if we have credentials but no session yet
      try {
        setIsLoading(true);
        await signIn(email, password);
        
        // Wait a moment for auth to process
        setTimeout(() => {
          setIsLoading(false);
          if (userType === 'restaurant') {
            navigate("/restaurant-dashboard", { replace: true });
          } else {
            navigate("/app", { replace: true });
          }
          
          // Clean up session storage
          setTimeout(clearAllSignupFlags, 1000);
        }, 2000);
      } catch (error) {
        setIsLoading(false);
        console.error("Failed to sign in:", error);
        toast({
          title: "Sign In Failed",
          description: "Could not sign you in automatically. Please try signing in manually.",
          variant: "destructive",
        });
        navigate("/signin", { replace: true });
      }
    } else {
      // If not logged in, go to signin
      navigate("/signin", { replace: true });
    }
  };

  const [isLoading, setIsLoading] = useState(false);

  // Show loading state while checking auth
  if (isCheckingAuth || isCreatingProfile || isLoading) {
    return (
      <div className="mobile-container app-height flex flex-col items-center justify-center p-6 bg-white">
        <div className="text-center space-y-6">
          <Loader2 className="h-20 w-20 text-skipit-primary animate-spin mx-auto" />
          <p className="text-muted-foreground">
            {isCheckingAuth ? "Checking your account..." : 
             isCreatingProfile ? "Setting up your profile..." : 
             "Signing you in..."}
          </p>
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
