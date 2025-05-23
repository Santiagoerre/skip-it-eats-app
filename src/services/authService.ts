
import { supabase } from "@/integrations/supabase/client";

// Function to get the current session
export const getCurrentSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

// Function to get the current user
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Function to sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Error signing out:", error);
  }
}

// Helper function to retry operations with exponential backoff
async function retryOperation(operation: () => Promise<any>, maxRetries = 5): Promise<any> {
  let lastError;
  let delay = 500; // start with 500ms delay
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.log(`Attempt ${attempt + 1}/${maxRetries} failed:`, error);
      lastError = error;
      
      // Wait before trying again
      await new Promise(resolve => setTimeout(resolve, delay));
      // Exponential backoff with some randomness
      delay = delay * 1.5 + Math.random() * 300;
    }
  }
  
  throw lastError;
}

// Function to ensure user profile exists with direct database operations
export const ensureUserProfile = async (userId: string, userType: 'customer' | 'restaurant'): Promise<boolean> => {
  try {
    console.log("Ensuring user profile exists for:", userId, "with type:", userType);
    
    // First check if the profile already exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('id, user_type, created_at, updated_at')
      .eq('id', userId)
      .maybeSingle();
    
    if (fetchError) {
      console.error('Error checking for existing profile:', fetchError);
      return false;
    }
    
    // If profile exists with the correct user type, return true
    if (existingProfile && existingProfile.user_type === userType) {
      console.log('Profile already exists with correct user type:', existingProfile);
      return true;
    }
    
    // If profile exists but with wrong user type, update it
    if (existingProfile) {
      console.log('Profile exists but with wrong user type, updating...', {
        current: existingProfile.user_type,
        desired: userType
      });
      
      const updateProfile = async () => {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            user_type: userType,
            updated_at: new Date().toISOString() 
          })
          .eq('id', userId);
        
        if (updateError) {
          console.error('Error updating profile:', updateError);
          throw updateError;
        }
      };
      
      // Use retry for profile update
      await retryOperation(updateProfile);
      console.log('Profile type updated successfully for user:', userId);
      return true;
    }
    
    // If profile doesn't exist, create it
    console.log('Profile does not exist, creating new profile for user:', userId);
    
    const createProfile = async () => {
      const now = new Date().toISOString();
      
      const { data, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          user_type: userType,
          created_at: now,
          updated_at: now
        })
        .select();
      
      if (insertError) {
        console.error('Error creating profile:', insertError);
        throw insertError;
      }
      
      console.log('Profile created with data:', data);
    };
    
    // Use retry for profile creation
    await retryOperation(createProfile);
    console.log('Profile created successfully for user:', userId);
    
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
        console.log('Creating default restaurant details for user:', userId);
        
        const createRestaurantDetails = async () => {
          const { error: detailsError } = await supabase
            .from('restaurant_details')
            .insert({
              restaurant_id: userId,
              name: 'New Restaurant',
              cuisine: 'Not specified',
              price_range: '$',
              description: 'Default restaurant details created on ' + new Date().toISOString()
            });
          
          if (detailsError) {
            console.error('Error creating restaurant details:', detailsError);
            throw detailsError;
          }
        };
        
        // Use retry for restaurant details creation
        await retryOperation(createRestaurantDetails);
        console.log('Restaurant details created successfully for user:', userId);
      } else {
        console.log('Restaurant details already exist for user:', userId);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error in ensureUserProfile:', error);
    return false;
  }
};
