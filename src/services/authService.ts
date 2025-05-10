
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

// Function to ensure user profile exists with direct database operations
export const ensureUserProfile = async (userId: string, userType: 'customer' | 'restaurant'): Promise<boolean> => {
  try {
    console.log("Ensuring user profile exists for:", userId, "with type:", userType);
    
    // First check if the profile already exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('id, user_type')
      .eq('id', userId)
      .maybeSingle();
    
    if (fetchError) {
      console.error('Error checking for existing profile:', fetchError);
      return false;
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
        return false;
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
      return false;
    }
    
    console.log('Profile created successfully');
    
    // If restaurant, create default restaurant details if they don't exist
    if (userType === 'restaurant') {
      // First check if restaurant details already exist
      const { data: existingDetails, error: detailsCheckError } = await supabase
        .from('restaurant_details')
        .select('id')
        .eq('restaurant_id', userId)
        .maybeSingle();
      
      if (detailsCheckError) {
        console.error('Error checking for existing restaurant details:', detailsCheckError);
      }
      
      // If restaurant details don't exist, create them
      if (!existingDetails) {
        console.log('Creating default restaurant details');
        const { error: detailsError } = await supabase
          .from('restaurant_details')
          .insert({
            restaurant_id: userId,
            name: 'New Restaurant',
            cuisine: 'Not specified',
            price_range: '$'
          });
        
        if (detailsError) {
          console.error('Error creating restaurant details:', detailsError);
        } else {
          console.log('Restaurant details created successfully');
        }
      } else {
        console.log('Restaurant details already exist');
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error in ensureUserProfile:', error);
    return false;
  }
};
