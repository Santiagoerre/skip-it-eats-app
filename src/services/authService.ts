
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
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating user profile:', error);
    return false;
  }
};

// Ensure profile exists and create if it doesn't
export const ensureUserProfile = async (userId: string, userType: 'customer' | 'restaurant'): Promise<boolean> => {
  try {
    console.log(`Ensuring profile exists for user ${userId} with type ${userType}`);
    
    // Check if profile exists
    const { data, error } = await supabase
      .from('profiles')
      .select('id, user_type')
      .eq('id', userId)
      .maybeSingle();
      
    if (error) {
      console.error('Error checking profile:', error);
      return false;
    }
    
    // If profile doesn't exist, create it
    if (!data) {
      console.log(`No profile found, creating new profile for user ${userId}`);
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
      
      console.log("Successfully created new profile for user:", userId);
      
      // For restaurant users, ensure restaurant_details exists
      if (userType === 'restaurant') {
        await ensureRestaurantDetails(userId);
      }
    } else {
      console.log(`Profile already exists for user ${userId}, current type: ${data.user_type}`);
      
      // If profile exists but user_type is different, update it
      if (data.user_type !== userType) {
        console.log(`Updating user type from ${data.user_type} to ${userType}`);
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ user_type: userType, updated_at: new Date().toISOString() })
          .eq('id', userId);
          
        if (updateError) {
          console.error('Error updating user type:', updateError);
          return false;
        }
        
        // If updated to restaurant, ensure restaurant details exist
        if (userType === 'restaurant') {
          await ensureRestaurantDetails(userId);
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error in ensureUserProfile:', error);
    return false;
  }
};

// Helper function to ensure restaurant details exist
const ensureRestaurantDetails = async (restaurantId: string): Promise<boolean> => {
  try {
    console.log(`Checking restaurant details for restaurant ID: ${restaurantId}`);
    
    const { data: existingDetails, error: checkError } = await supabase
      .from('restaurant_details')
      .select('id')
      .eq('restaurant_id', restaurantId)
      .maybeSingle();
      
    if (checkError) {
      console.error('Error checking restaurant details:', checkError);
      return false;
    }
    
    if (!existingDetails) {
      console.log(`No restaurant details found, creating for restaurant ID: ${restaurantId}`);
      
      const { error: detailsError } = await supabase
        .from('restaurant_details')
        .insert({
          restaurant_id: restaurantId,
          name: 'New Restaurant',
          price_range: '$',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
      if (detailsError) {
        console.error('Error creating restaurant details:', detailsError);
        return false;
      }
      
      console.log(`Successfully created restaurant details for ID: ${restaurantId}`);
      
      // Also check for restaurant location
      const { data: existingLocation } = await supabase
        .from('restaurant_locations')
        .select('id')
        .eq('restaurant_id', restaurantId)
        .maybeSingle();
        
      if (!existingLocation) {
        const { error: locationError } = await supabase
          .from('restaurant_locations')
          .insert({
            restaurant_id: restaurantId,
            address: 'Address not specified',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
        if (locationError) {
          console.error('Error creating restaurant location:', locationError);
        } else {
          console.log(`Successfully created restaurant location for ID: ${restaurantId}`);
        }
      }
    } else {
      console.log(`Restaurant details already exist for ID: ${restaurantId}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error in ensureRestaurantDetails:', error);
    return false;
  }
};
