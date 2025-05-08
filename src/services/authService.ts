
import { supabase } from "@/integrations/supabase/client";

export const checkAuth = async (): Promise<boolean> => {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
};

export const getCurrentUserId = async (): Promise<string | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id || null;
};

export const getCurrentUserType = async (): Promise<'customer' | 'restaurant' | null> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return null;
    }
    
    console.log("Getting user type for ID:", session.user.id);
    
    // First try to get user type from the user's metadata
    const userType = session.user.user_metadata?.user_type as 'customer' | 'restaurant' | null;
    
    if (userType) {
      console.log("Found user type in metadata:", userType);
      return userType;
    }
    
    // If not found in metadata, try getting it from the profile
    const { data, error } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', session.user.id)
      .maybeSingle();
    
    if (error) {
      console.error('Error getting user type from profiles:', error);
      return null;
    }
    
    if (!data) {
      console.log("No profile found for user:", session.user.id);
      
      // As a fallback, try to create a profile with the user type from metadata
      if (userType) {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: session.user.id,
            user_type: userType,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
        if (insertError) {
          console.error('Error creating profile:', insertError);
        } else {
          console.log("Created new profile with user type:", userType);
          return userType;
        }
      }
      
      return null;
    }
    
    console.log("Found user type in profile:", data.user_type);
    return data.user_type as 'customer' | 'restaurant';
  } catch (error) {
    console.error('Error in getCurrentUserType:', error);
    return null;
  }
};

export const updateUserProfile = async (
  userId: string, 
  updates: { [key: string]: any }
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating user profile:', error);
    return false;
  }
};

// Add a function to ensure profile exists
export const ensureUserProfile = async (userId: string, userType: 'customer' | 'restaurant'): Promise<boolean> => {
  try {
    // Check if profile exists
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
      
    if (error) {
      console.error('Error checking profile:', error);
      return false;
    }
    
    // If profile doesn't exist, create it
    if (!data) {
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          user_type: userType,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
      if (insertError) {
        console.error('Error creating profile:', insertError);
        return false;
      }
      
      console.log("Created new profile for user:", userId);
    }
    
    return true;
  } catch (error) {
    console.error('Error in ensureUserProfile:', error);
    return false;
  }
};
