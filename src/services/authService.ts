
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
    
    // Get user type from the profile
    const { data, error } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', session.user.id)
      .maybeSingle();
    
    if (error) {
      console.error('Error getting user type:', error);
      return null;
    }
    
    if (!data) {
      console.log("No profile found for user:", session.user.id);
      return null;
    }
    
    console.log("Found user type:", data.user_type);
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
