
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";

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

  // Verify restaurant profile creation
  const verifyRestaurantProfileCreation = async (userId: string): Promise<boolean> => {
    console.log("Verifying restaurant profile creation for:", userId);
    
    try {
      // Check if profile exists
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
        
      if (profileError || !profileData) {
        console.error("Profile verification failed:", profileError || "No profile found");
        return false;
      }
      
      // Check if restaurant details exist
      const { data: detailsData, error: detailsError } = await supabase
        .from('restaurant_details')
        .select('*')
        .eq('restaurant_id', userId)
        .maybeSingle();
        
      if (detailsError || !detailsData) {
        console.error("Restaurant details verification failed:", detailsError || "No details found");
        return false;
      }
      
      // Check if location exists if address was provided
      if (address) {
        const { data: locationData, error: locationError } = await supabase
          .from('restaurant_locations')
          .select('*')
          .eq('restaurant_id', userId)
          .maybeSingle();
          
        if (locationError || !locationData) {
          console.error("Restaurant location verification failed:", locationError || "No location found");
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error("Error during restaurant profile verification:", error);
      return false;
    }
  };

  // Handle image upload
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

  // Sign up process
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Restaurant signup form submitted with:", { 
      email, restaurantName, foodType, address, latitude, longitude 
    });
    
    try {
      setIsLoading(true);
      
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
      
      // Verify that restaurant profile was created successfully
      const retryVerification = async (attempts = 3, delay = 1000): Promise<boolean> => {
        for (let i = 0; i < attempts; i++) {
          console.log(`Verification attempt ${i + 1}/${attempts}`);
          const isProfileCreated = await verifyRestaurantProfileCreation(data.user.id);
          
          if (isProfileCreated) {
            console.log("Restaurant profile verified successfully");
            return true;
          }
          
          console.log(`Verification attempt ${i + 1} failed, waiting ${delay}ms before retrying`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 1.5; // Increase delay with each attempt
        }
        
        console.error("All verification attempts failed");
        return false;
      };
      
      const profileVerified = await retryVerification();
      
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
      
      // Store the user ID in session storage for the success page to use
      if (data.user.id) {
        sessionStorage.setItem('new_user_id', data.user.id);
      }
      
      // Navigate to success page, user will be handled by SignUpSuccess component
      navigate("/signup-success");
      
    } catch (error: any) {
      console.error("Restaurant signup error:", error);
      
      // Clear temporary credentials on error
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('temp_email');
        sessionStorage.removeItem('temp_password');
      }
      
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
