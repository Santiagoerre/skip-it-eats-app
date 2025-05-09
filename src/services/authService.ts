import { supabase } from "@/integrations/supabase/client";

// Function to get the current session
export const getCurrentSession = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return session;
}

// Function to get the current user
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user;
}

// Function to sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error("Error signing out:", error);
  }
}

// Function to ensure user profile exists
export const ensureUserProfile = async (userId: string, userType: 'customer' | 'restaurant'): Promise<boolean> => {
  try {
    // First check if the profile already exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('id, user_type')
      .eq('id', userId)
      .maybeSingle();
    
    console.log("ensureUserProfile check:", { existingProfile, fetchError, userId, userType });
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error checking for existing profile:', fetchError);
      throw fetchError;
    }
    
    // If profile exists with the correct user type, return true
    if (existingProfile && existingProfile.user_type === userType) {
      console.log('Profile already exists with correct user type');
      return true;
    }
    
    // If profile exists but with wrong user type, update it
    if (existingProfile) {
      console.log('Profile exists but with wrong user type, updating...');
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ user_type: userType })
        .eq('id', userId);
      
      if (updateError) {
        console.error('Error updating profile:', updateError);
        throw updateError;
      }
      
      return true;
    }
    
    // If profile doesn't exist, create it
    console.log('Profile does not exist, creating new profile');
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        user_type: userType
      });
    
    if (insertError) {
      console.error('Error creating profile:', insertError);
      throw insertError;
    }
    
    console.log('Profile created successfully');
    return true;
  } catch (error) {
    console.error('Error in ensureUserProfile:', error);
    return false;
  }
};
