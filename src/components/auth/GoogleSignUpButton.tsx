
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
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            user_type: userType
          }
        }
      });
    } catch (err: any) {
      toast({
        title: "Error with Google Sign Up",
        description: err.message || "Could not sign up with Google",
        variant: "destructive",
      });
    } finally {
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
