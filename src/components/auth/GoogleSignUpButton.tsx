
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { markAsNewSignupFlow } from "@/utils/authStateHelpers";

interface GoogleSignUpButtonProps {
  userType: "customer" | "restaurant";
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const GoogleSignUpButton = ({ 
  userType, 
  isLoading, 
  setIsLoading 
}: GoogleSignUpButtonProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    
    try {
      // Mark this as a new signup flow so our success page will know
      markAsNewSignupFlow();
      
      console.log(`Starting Google OAuth signup flow for user type: ${userType}`);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            // Pass the user type as a query parameter to be stored in the user's metadata
            user_type: userType,
            // Add access_type=offline to get a refresh token
            access_type: "offline",
            // Add prompt=consent to make sure the user sees the consent screen
            prompt: "consent"
          },
          // Make sure to redirect back to the signup success page
          redirectTo: `${window.location.origin}/signup-success?new=true`
        }
      });
      
      if (error) throw error;
      
      console.log("Google OAuth started successfully, user will be redirected");
      
      // The user will be redirected to Google and then back to our signup success page
      // No need to navigate here as the OAuth flow handles redirection
    } catch (err: any) {
      toast({
        title: "Error with Google Sign Up",
        description: err.message || "Could not sign up with Google",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="relative flex items-center py-2">
        <div className="flex-grow border-t border-gray-300"></div>
        <span className="flex-shrink mx-4 text-gray-400 text-sm">or</span>
        <div className="flex-grow border-t border-gray-300"></div>
      </div>
      
      <Button 
        type="button" 
        variant="outline" 
        className="w-full py-6 text-base flex items-center justify-center gap-2" 
        onClick={handleGoogleSignUp}
        disabled={isLoading}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          <path fill="none" d="M1 1h22v22H1z" />
        </svg>
        {isLoading ? "Processing..." : "Sign Up with Google"}
      </Button>
    </>
  );
};

export default GoogleSignUpButton;
