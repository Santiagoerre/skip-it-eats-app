import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

type UserType = "customer" | "restaurant" | null;

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userType: UserType;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userType: UserType, metadata?: any) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<UserType>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener FIRST to avoid missing events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log("Auth state changed:", event, currentSession?.user?.id);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        // Fetch user type from metadata if session exists
        if (currentSession?.user) {
          // Using setTimeout to avoid any potential Supabase deadlocks
          setTimeout(async () => {
            try {
              const { data, error } = await supabase
                .from("profiles")
                .select("user_type")
                .eq("id", currentSession.user.id)
                .single();
              
              if (!error && data) {
                console.log("User type from profile:", data.user_type);
                setUserType(data.user_type as UserType);
              } else {
                console.error("Error fetching user type:", error);
              }
            } catch (err) {
              console.error("Failed to fetch user type:", err);
            }
          }, 0);
        } else {
          setUserType(null);
        }
      }
    );

    // Then check for existing session
    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          try {
            const { data, error } = await supabase
              .from("profiles")
              .select("user_type")
              .eq("id", currentSession.user.id)
              .single();
            
            if (!error && data) {
              console.log("Initial user type:", data.user_type);
              setUserType(data.user_type as UserType);
            } else {
              console.error("Error fetching initial user type:", error);
            }
          } catch (err) {
            console.error("Failed to fetch initial user type:", err);
          }
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
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Error signing in",
        description: error.message || "Please check your credentials and try again",
        variant: "destructive",
      });
      throw error;
    }
  };

  const signUp = async (email: string, password: string, userType: UserType, metadata: any = {}) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            user_type: userType,
            ...metadata
          }
        }
      });
      
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Error signing up",
        description: error.message || "Please check your information and try again",
        variant: "destructive",
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error: any) {
      toast({
        title: "Error signing out",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
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
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
