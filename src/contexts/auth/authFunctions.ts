
import { supabase } from "@/integrations/supabase/client";
import { UserType } from "./types";

export const signIn = async (email: string, password: string) => {
  console.log("Attempting sign in for email:", email);
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    console.error("Sign in failed:", error.message);
    throw error;
  }
  console.log("Sign in successful");
  return { error: null };
};

export const signUp = async (
  email: string, 
  password: string, 
  userType: UserType, 
  metadata: any = {}
) => {
  try {
    console.log(`Starting ${userType} signup process for email:`, email);
    
    // Store credentials temporarily for auto-signin after signup
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('temp_email', email);
      sessionStorage.setItem('temp_password', password);
    }
    
    // Ensure user_type is included in metadata
    const combinedMetadata = {
      user_type: userType,
      ...metadata
    };
    
    console.log("Signup metadata:", combinedMetadata);
    
    // Create the user with metadata including user_type
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: combinedMetadata
      }
    });
    
    if (error) {
      console.error("Signup error:", error);
      return { error };
    }
    
    console.log("Signup API response:", data);
    
    // Check if the user was actually created
    if (data?.user) {
      console.log("User created with ID:", data.user.id);
      
      // Add a delay to allow database triggers to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verify that profile was created
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
          
        if (profileError) {
          console.warn("Error checking for user profile:", profileError);
        } else if (!profileData) {
          console.warn("Profile was not automatically created, attempting manual creation");
          
          // Attempt to manually create the profile if it doesn't exist
          const { error: insertError } = await supabase
            .from('profiles')
            .insert([{
              id: data.user.id,
              user_type: userType,
              display_name: metadata.display_name || null,
              food_type: metadata.food_type || null
            }]);
            
          if (insertError) {
            console.error("Failed to manually create profile:", insertError);
          } else {
            console.log("Profile manually created successfully");
          }
        } else {
          console.log("Profile was automatically created:", profileData);
        }
      } catch (profileCheckError) {
        console.error("Error during profile verification:", profileCheckError);
      }
      
      // Additional verification for restaurant profiles
      if (userType === 'restaurant') {
        try {
          console.log("Verifying restaurant details creation");
          const { data: restaurantData, error: restaurantError } = await supabase
            .from('restaurant_details')
            .select('*')
            .eq('restaurant_id', data.user.id)
            .maybeSingle();
            
          if (restaurantError) {
            console.warn("Error checking restaurant details:", restaurantError);
          } else if (!restaurantData) {
            console.warn("Restaurant details not found, attempting manual creation");
            
            // Manually create restaurant details if they don't exist
            const { error: detailsError } = await supabase
              .from('restaurant_details')
              .insert([{
                restaurant_id: data.user.id,
                name: metadata.display_name || 'New Restaurant',
                cuisine: metadata.food_type || 'Not specified',
                price_range: '$',
                description: 'Restaurant created manually on ' + new Date().toISOString()
              }]);
              
            if (detailsError) {
              console.error("Failed to manually create restaurant details:", detailsError);
            } else {
              console.log("Restaurant details manually created");
            }
          } else {
            console.log("Restaurant details found:", restaurantData);
          }
          
          // Check for restaurant location
          if (metadata.address) {
            const { data: locationData, error: locationError } = await supabase
              .from('restaurant_locations')
              .select('*')
              .eq('restaurant_id', data.user.id)
              .maybeSingle();
              
            if (locationError) {
              console.warn("Error checking restaurant location:", locationError);
            } else if (!locationData) {
              console.warn("Restaurant location not found, attempting manual creation");
              
              // Manually create restaurant location if it doesn't exist
              const { error: locationInsertError } = await supabase
                .from('restaurant_locations')
                .insert([{
                  restaurant_id: data.user.id,
                  address: metadata.address,
                  latitude: metadata.latitude || 0,
                  longitude: metadata.longitude || 0
                }]);
                
              if (locationInsertError) {
                console.error("Failed to manually create restaurant location:", locationInsertError);
              } else {
                console.log("Restaurant location manually created");
              }
            } else {
              console.log("Restaurant location found:", locationData);
            }
          }
        } catch (restaurantVerifyError) {
          console.error("Error during restaurant verification:", restaurantVerifyError);
        }
      }
      
      // Return the data with user's ID for access in the calling component
      return { data };
    }
    
    console.warn("User object not found in signup response");
    return { data }; 
  } catch (error: any) {
    console.error("Error in signUp function:", error);
    return { error }; 
  }
};

export const signOut = async () => {
  console.log("Signing out user");
  await supabase.auth.signOut();
  console.log("Sign out complete");
};

export const resetPassword = async (email: string) => {
  console.log("Requesting password reset for:", email);
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  
  if (error) {
    console.error("Password reset request failed:", error);
    throw error;
  }
  console.log("Password reset email sent successfully");
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
