
import { createContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AuthContextType, UserType } from "./types";
import { useUserType } from "./useUserType";
import { signIn, signUp, signOut, resetPassword } from "./authFunctions";

// Export the context so it can be imported by useAuth.ts
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { userType, getUserTypeFromSession } = useUserType();

  useEffect(() => {
    console.log("Auth state changed:", session?.user?.id, userType);
  }, [session, userType]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (event === 'SIGNED_OUT' || !currentSession) {
          setSession(null);
          setUser(null);
          getUserTypeFromSession(null);
          return;
        }

        if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          setSession(currentSession);
          setUser(currentSession.user);
          
          await getUserTypeFromSession(currentSession);
        }
      }
    );

    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (currentSession) {
          setSession(currentSession);
          setUser(currentSession.user);
          await getUserTypeFromSession(currentSession);
        }
      } catch (error) {
        console.error("Error checking auth session:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
    return () => subscription.unsubscribe();
  }, [getUserTypeFromSession]);

  const handleSignIn = async (email: string, password: string) => {
    try {
      await signIn(email, password);
    } catch (error: any) {
      toast({
        title: "Error signing in",
        description: error.message || "Please check your credentials and try again",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleSignUp = async (email: string, password: string, userType: UserType, metadata: any = {}) => {
    console.log(`Starting ${userType} signup with:`, { email, userType, metadata });
    try {
      // Standardize all signups to go through the authFunctions.signUp
      const result = await signUp(email, password, userType, metadata);
      
      if (result.error) {
        console.error("Signup error:", result.error);
        toast({
          title: "Error creating account",
          description: result.error.message || "Something went wrong during signup. Please try again.",
          variant: "destructive",
        });
        throw result.error;
      }
      
      // Success path - consistent for both customer and restaurant
      console.log("Signup successful:", result.data);
      return result;
    } catch (error: any) {
      console.error("Error in handleSignUp:", error);
      toast({
        title: "Signup Failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error: any) {
      toast({
        title: "Error signing out",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleResetPassword = async (email: string) => {
    try {
      await resetPassword(email);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset email. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const value = {
    session,
    user,
    userType,
    isLoading,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut,
    resetPassword: handleResetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
