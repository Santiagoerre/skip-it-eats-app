
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";
import { 
  clearTemporaryCredentials, 
  markAsNewSignupFlow 
} from "@/utils/authStateHelpers";

export const useRestaurantSignUp = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [foodType, setFoodType] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState(0);
  const [longitude, setLongitude] = useState(0);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Mark this as a new signup flow
  markAsNewSignupFlow();

  // Verify restaurant profile creation with improved error handling and exponential backoff
  const verifyRestaurantProfileCreation = async (userId: string): Promise<boolean> => {
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
      if (address) {
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
      }
      
      return true;
    } catch (error) {
      console.error("Error during restaurant profile verification:", error);
      return false;
    }
  };

  // Handle image upload with improved error handling
  const handleImageUpload = async (userId: string): Promise<string | null> => {
    if (!imageFile) return null;
    
    try {
      console.log("Uploading restaurant image");
      const fileExt = imageFile.name.split('.').pop();
      const filePath = `${userId}/restaurant-image.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('restaurant-images')
        .upload(filePath, imageFile);
        
      if (uploadError) {
        console.error("Error uploading image:", uploadError);
        toast({
          title: "Image Upload Warning",
          description: "Your account was created, but there was an issue uploading your image.",
          variant: "default",
        });
        return null;
      } 
      
      console.log("Image uploaded successfully");
      
      // Get the public URL for the uploaded image
      const { data: urlData } = supabase.storage
        .from('restaurant-images')
        .getPublicUrl(filePath);
        
      if (urlData?.publicUrl) {
        console.log("Image public URL:", urlData.publicUrl);
        
        // Update restaurant details with the image URL
        const { error: updateError } = await supabase
          .from('restaurant_details')
          .update({ image_url: urlData.publicUrl })
          .eq('restaurant_id', userId);
          
        if (updateError) {
          console.error("Error updating restaurant image URL:", updateError);
          return null;
        }
        
        return urlData.publicUrl;
      }
      
      return null;
    } catch (error) {
      console.error("Image upload exception:", error);
      return null;
    }
  };

  // Sign up process with improved error handling and verification
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Restaurant signup form submitted with:", { 
      email, restaurantName, foodType, address, latitude, longitude 
    });
    
    try {
      setIsLoading(true);
      
      // Store current signup state in sessionStorage to persist across redirects
      sessionStorage.setItem('temp_email', email);
      sessionStorage.setItem('temp_password', password);
      
      // Prepare metadata for profile creation
      const metadata = { 
        user_type: "restaurant",
        display_name: restaurantName,
        food_type: foodType,
        address: address,
        latitude: latitude,
        longitude: longitude
      };
      
      console.log("Signing up with metadata:", metadata);
      
      // Register with Supabase with additional metadata
      const { data, error } = await signUp(email, password, "restaurant", metadata);
      
      if (error) {
        console.error("Signup failed with error:", error);
        throw new Error(error.message || "Failed to create user account");
      }
      
      if (!data?.user) {
        console.error("No user data returned from signup");
        throw new Error("User account could not be created");
      }
      
      console.log("Restaurant account created successfully:", data.user.id);
      
      // Store new user ID in session storage for the success page
      sessionStorage.setItem('new_user_id', data.user.id);
      
      // Verify that restaurant profile was created successfully with exponential backoff
      const verifyWithBackoff = async (attempts = 5, initialDelay = 1000): Promise<boolean> => {
        let delay = initialDelay;
        
        for (let i = 0; i < attempts; i++) {
          console.log(`Verification attempt ${i + 1}/${attempts} with delay ${delay}ms`);
          const isProfileCreated = await verifyRestaurantProfileCreation(data.user.id);
          
          if (isProfileCreated) {
            console.log("Restaurant profile verified successfully");
            return true;
          }
          
          console.log(`Verification attempt ${i + 1} failed, waiting ${delay}ms before retrying`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay = Math.min(delay * 2, 10000); // Cap at 10 seconds
        }
        
        console.error("All verification attempts failed");
        return false;
      };
      
      const profileVerified = await verifyWithBackoff();
      
      if (!profileVerified) {
        console.warn("Could not verify restaurant profile creation, but continuing...");
        toast({
          title: "Warning",
          description: "Your account was created, but there might be an issue with your restaurant profile. We will try to fix it.",
          variant: "default",
        });
      }
      
      // Handle image upload if an image was provided
      if (imageFile && data.user.id) {
        await handleImageUpload(data.user.id);
      }
      
      toast({
        title: "Restaurant account created!",
        description: "Your restaurant account has been created successfully.",
      });
      
      // Navigate to success page, user will be handled by SignUpSuccess component
      navigate("/signup-success");
      
    } catch (error: any) {
      console.error("Restaurant signup error:", error);
      
      // Clear temporary credentials on error
      clearTemporaryCredentials();
      
      toast({
        title: "Sign Up Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    // State
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    foodType,
    setFoodType,
    restaurantName,
    setRestaurantName,
    address,
    setAddress,
    latitude,
    setLatitude,
    longitude,
    setLongitude,
    imageFile,
    setImageFile,
    isLoading,
    
    // Methods
    handleSignUp,
    handleImageChange: (file: File) => setImageFile(file)
  };
};
