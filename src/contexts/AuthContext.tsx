
import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { ensureUserProfile } from "@/services/authService";

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

  // Helper function to safely get user type
  const getUserTypeFromSession = async (currentSession: Session | null) => {
    if (!currentSession?.user) {
      setUserType(null);
      return;
    }
    
    try {
      // First check user metadata
      const metadataUserType = currentSession.user.user_metadata?.user_type as UserType;
      
      if (metadataUserType) {
        console.log("Found user type in metadata:", metadataUserType);
        setUserType(metadataUserType);
        
        // Ensure profile exists
        setTimeout(async () => {
          await ensureUserProfile(currentSession.user.id, metadataUserType);
        }, 0);
        
        return;
      }
      
      // Then check profiles table
      const { data, error } = await supabase
        .from("profiles")
        .select("user_type")
        .eq("id", currentSession.user.id)
        .single();
      
      if (error) {
        console.error("Error fetching user type:", error);
        setUserType(null);
        return;
      }
      
      if (data) {
        console.log("Found user type in profile:", data.user_type);
        setUserType(data.user_type as UserType);
      } else {
        console.log("No profile found for user:", currentSession.user.id);
        setUserType(null);
      }
    } catch (err) {
      console.error("Failed to get user type:", err);
      setUserType(null);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST to avoid missing events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log("Auth state changed:", event, currentSession?.user?.id);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        // Use setTimeout to avoid any potential Supabase deadlocks
        setTimeout(() => {
          getUserTypeFromSession(currentSession);
        }, 0);
      }
    );

    // Then check for existing session
    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        await getUserTypeFromSession(currentSession);
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
      // Create the user with metadata including user_type
      const { data, error } = await supabase.auth.signUp({
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
      
      // Manually create profile if sign-up was successful and we have user data
      if (data?.user) {
        const userId = data.user.id;
        
        // Use setTimeout to avoid potential deadlocks
        setTimeout(async () => {
          try {
            // First check if profile already exists
            const { data: existingProfile } = await supabase
              .from('profiles')
              .select('id')
              .eq('id', userId)
              .single();
              
            if (!existingProfile) {
              const { error: profileError } = await supabase
                .from('profiles')
                .insert({
                  id: userId,
                  user_type: userType,
                  display_name: metadata.display_name || null,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                });
              
              if (profileError) {
                console.error("Error creating profile:", profileError);
              } else {
                console.log("Created new profile with user type:", userType);
              }
            } else {
              console.log("Profile already exists for user:", userId);
            }
          } catch (err) {
            console.error("Error in profile creation:", err);
          }
        }, 0);
        
        // For restaurant users, create restaurant details
        if (userType === 'restaurant') {
          setTimeout(async () => {
            try {
              const { error: detailsError } = await supabase
                .from('restaurant_details')
                .insert({
                  restaurant_id: userId,
                  name: metadata.display_name || 'New Restaurant',
                  cuisine: metadata.food_type || 'Not specified',
                  price_range: '$'
                });
                
              if (detailsError) {
                console.error("Error creating restaurant details:", detailsError);
              }
              
              // Create restaurant location if address data exists
              if (metadata.address) {
                const { error: locationError } = await supabase
                  .from('restaurant_locations')
                  .insert({
                    restaurant_id: userId,
                    address: metadata.address,
                    latitude: metadata.latitude || 0,
                    longitude: metadata.longitude || 0
                  });
                  
                if (locationError) {
                  console.error("Error creating restaurant location:", locationError);
                }
              }
            } catch (err) {
              console.error("Error in restaurant details creation:", err);
            }
          }, 0);
        }
      }
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
