
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
      const userId = data.user.id;
      console.log("User created with ID:", userId);
      
      // Wait for the auth session to be established before continuing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      try {
        // Create profile for the new user
        console.log("Creating profile for user:", userId);
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
          console.log("Created profile successfully");
        }
        
        // For restaurant users, create restaurant details
        if (userType === 'restaurant') {
          console.log("Creating restaurant details for:", userId);
          
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
          } else {
            console.log("Restaurant details created successfully");
          }
          
          // Create restaurant location if address data exists
          if (metadata.address) {
            console.log("Creating restaurant location with address:", metadata.address);
            
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
            } else {
              console.log("Restaurant location created successfully");
            }
          }
        }
      } catch (err) {
        console.error("Error in profile/details creation:", err);
      }
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
