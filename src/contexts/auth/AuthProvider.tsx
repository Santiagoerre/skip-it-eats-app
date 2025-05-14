
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
    // Set up auth state listener FIRST to avoid missing events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log("Auth state changed:", event, currentSession?.user?.id);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        // For signup or login events, ensure we have a profile
        if (currentSession && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
          // Delay profile check slightly to avoid race conditions with triggers
          setTimeout(async () => {
            console.log("Checking user type after auth event:", event);
            await getUserTypeFromSession(currentSession);
          }, 500);
        } else if (!currentSession || event === 'SIGNED_OUT') {
          // Clear userType if logged out
          getUserTypeFromSession(null);
        }
      }
    );

    // Then check for existing session
    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        console.log("Initial session check:", currentSession?.user?.id);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession) {
          await getUserTypeFromSession(currentSession);
        }
      } catch (error) {
        console.error("Error checking auth session:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    return () => {
      subscription.unsubscribe();
    };
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
    try {
      console.log("AuthProvider - Starting signup for:", email, "with type:", userType);
      const result = await signUp(email, password, userType, metadata);
      if (result.error) {
        toast({
          title: "Error signing up",
          description: result.error.message || "Please check your information and try again",
          variant: "destructive",
        });
      }
      return result;
    } catch (error: any) {
      toast({
        title: "Error signing up",
        description: error.message || "Please check your information and try again",
        variant: "destructive",
      });
      return { error }; 
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
