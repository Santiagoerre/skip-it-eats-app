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

  const handleSignUp = async (email: string, password: string, restaurantData: any) => {
    console.log("AuthProvider - Starting signup for:", email);
    console.log("llegamos hasta aqui")
    const { user, error } = await supabase.auth.signUp({
        email: email,
        password: password,
    });

    if (error) {
        console.error('Error signing up:', error);
        return { error };
    }

    // Ensure user is defined before accessing user.id
    if (!user) {
        console.error('User object is undefined');
        return { error: 'User object is undefined' };
    }

    // Proceed with creating the restaurant profile
    console.log('Inserting restaurant profile with data:', {
        user_id: user.id,
        ...restaurantData
    });

    const { data, profileError } = await supabase
        .from('profiles')
        .insert([{
            user_id: user.id,
            ...restaurantData
        }]);

    if (profileError) {
        console.error('Error creating restaurant profile:', profileError.message);
        return { error: profileError.message };
    } else {
        console.log('Restaurant profile created:', data);
    }

    return { data };
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
