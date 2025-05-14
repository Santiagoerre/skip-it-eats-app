
import { supabase } from "@/integrations/supabase/client";
import { UserType } from "./types";

export const signIn = async (email: string, password: string) => {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return { error: null };
};

export const signUp = async (
  email: string, 
  password: string, 
  userType: UserType, 
  metadata: any = {}
) => {
  try {
    // Store credentials temporarily for auto-signin after signup
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('temp_email', email);
      sessionStorage.setItem('temp_password', password);
    }
    
    console.log("Starting signup with metadata:", { userType, ...metadata });
    
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
    
    if (error) {
      console.error("Signup error:", error);
      return { error };
    }
    
    console.log("Signup success, user data:", data);
    
    // Check if the user was actually created
    if (data?.user) {
      console.log("User created with ID:", data.user.id);
      
      // Return the data with user's ID for access in the calling component
      return { data };
    }
    
    return { data }; 
  } catch (error: any) {
    console.error("Error in signUp function:", error);
    return { error }; 
  }
};

export const signOut = async () => {
  await supabase.auth.signOut();
};

export const resetPassword = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  
  if (error) throw error;
};

// Retry function with exponential backoff
const retry = async (fn: () => Promise<any>, maxRetries = 3, delay = 500) => {
  let retries = 0;
  let lastError;
  
  while (retries < maxRetries) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      retries++;
      console.log(`Retry attempt ${retries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
      // Exponential backoff
      delay *= 2;
    }
  }
  
  throw lastError;
};
