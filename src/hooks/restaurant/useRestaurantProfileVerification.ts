
import { supabase } from "@/integrations/supabase/client";

/**
 * Verify restaurant profile creation with improved error handling and exponential backoff
 */
export const verifyRestaurantProfileCreation = async (
  userId: string,
  restaurantName: string,
  foodType: string
): Promise<boolean> => {
  console.log("Verifying restaurant profile creation for:", userId);
  
  try {
    // First verify that the base profile exists
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, user_type')
      .eq('id', userId)
      .maybeSingle();
      
    if (profileError) {
      console.error("Profile verification failed:", profileError);
      return false;
    }
    
    if (!profileData) {
      console.error("No profile found for user:", userId);
      
      // Attempt to manually create the base profile if it doesn't exist
      try {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert([{
            id: userId,
            user_type: 'restaurant',
            display_name: restaurantName,
            food_type: foodType,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);
          
        if (insertError) {
          console.error("Manual profile creation failed:", insertError);
          return false;
        }
        
        // Wait a moment for the database to process
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log("Manually created profile for user:", userId);
      } catch (createError) {
        console.error("Error during manual profile creation:", createError);
        return false;
      }
    } else if (profileData.user_type !== 'restaurant') {
      console.error("User profile exists but with wrong type:", profileData.user_type);
      
      // Update the profile type if it exists but with wrong type
      try {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            user_type: 'restaurant',
            display_name: restaurantName,
            food_type: foodType,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);
          
        if (updateError) {
          console.error("Profile type update failed:", updateError);
          return false;
        }
        
        console.log("Updated user profile type to restaurant");
      } catch (updateError) {
        console.error("Error updating profile type:", updateError);
        return false;
      }
    } else {
      console.log("Profile exists and has correct type:", profileData);
    }
    
    // Wait after profile operation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if restaurant details exist
    const { data: detailsData, error: detailsError } = await supabase
      .from('restaurant_details')
      .select('*')
      .eq('restaurant_id', userId)
      .maybeSingle();
      
    if (detailsError) {
      console.error("Restaurant details verification failed:", detailsError);
      return false;
    }
    
    if (!detailsData) {
      console.error("No restaurant details found, attempting to create them");
      
      // Create restaurant details if they don't exist
      try {
        const { error: createDetailsError } = await supabase
          .from('restaurant_details')
          .insert([{
            restaurant_id: userId,
            name: restaurantName,
            cuisine: foodType,
            price_range: '$',
            description: 'Restaurant created on ' + new Date().toISOString()
          }]);
          
        if (createDetailsError) {
          console.error("Manual restaurant details creation failed:", createDetailsError);
          return false;
        }
        
        console.log("Manually created restaurant details");
      } catch (createDetailsError) {
        console.error("Error creating restaurant details:", createDetailsError);
        return false;
      }
    } else {
      console.log("Restaurant details found:", detailsData);
    }
    
    // Wait after details operation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if location exists if address was provided
    return true;
  } catch (error) {
    console.error("Error during restaurant profile verification:", error);
    return false;
  }
};

/**
 * Verify and create restaurant location
 */
export const verifyRestaurantLocation = async (
  userId: string,
  address: string,
  latitude: number,
  longitude: number
): Promise<boolean> => {
  if (!address) return true;
  
  try {
    const { data: locationData, error: locationError } = await supabase
      .from('restaurant_locations')
      .select('*')
      .eq('restaurant_id', userId)
      .maybeSingle();
      
    if (locationError) {
      console.error("Restaurant location verification failed:", locationError);
      return false;
    }
    
    if (!locationData) {
      console.error("No restaurant location found, attempting to create it");
      
      // Create location if it doesn't exist
      try {
        const { error: createLocationError } = await supabase
          .from('restaurant_locations')
          .insert([{
            restaurant_id: userId,
            address: address,
            latitude: latitude,
            longitude: longitude
          }]);
          
        if (createLocationError) {
          console.error("Manual restaurant location creation failed:", createLocationError);
          return false;
        }
        
        console.log("Manually created restaurant location");
      } catch (createLocationError) {
        console.error("Error creating restaurant location:", createLocationError);
        return false;
      }
    } else {
      console.log("Restaurant location found:", locationData);
    }
    
    return true;
  } catch (error) {
    console.error("Error verifying restaurant location:", error);
    return false;
  }
};

/**
 * Verify restaurant profile with exponential backoff
 */
export const verifyWithBackoff = async (
  userId: string,
  restaurantName: string,
  foodType: string,
  address: string,
  latitude: number,
  longitude: number,
  attempts = 5,
  initialDelay = 1000
): Promise<boolean> => {
  let delay = initialDelay;
  
  for (let i = 0; i < attempts; i++) {
    console.log(`Verification attempt ${i + 1}/${attempts} with delay ${delay}ms`);
    const isProfileCreated = await verifyRestaurantProfileCreation(userId, restaurantName, foodType);
    
    if (isProfileCreated) {
      console.log("Restaurant profile verified successfully");
      
      // Verify location separately
      if (address) {
        const isLocationCreated = await verifyRestaurantLocation(userId, address, latitude, longitude);
        if (!isLocationCreated) {
          console.warn("Location verification failed, but continuing");
        }
      }
      
      return true;
    }
    
    console.log(`Verification attempt ${i + 1} failed, waiting ${delay}ms before retrying`);
    await new Promise(resolve => setTimeout(resolve, delay));
    delay = Math.min(delay * 2, 10000); // Cap at 10 seconds
  }
  
  console.error("All verification attempts failed");
  return false;
};
