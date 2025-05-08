
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

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

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            user_type: userType
          }
        }
      });
      
      if (error) throw error;
      
      // The user will be redirected to Google and then back to our app
      // The auth callback will handle creating the profile with the correct user_type
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
        className="w-full py-6 text-base" 
        onClick={handleGoogleSignUp}
        disabled={isLoading}
      >
        {isLoading ? "Processing..." : "Sign Up with Google"}
      </Button>
    </>
  );
};

export default GoogleSignUpButton;
