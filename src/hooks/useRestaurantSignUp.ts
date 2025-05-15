
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth";
import { useSignUpState } from "@/hooks/restaurant/useSignUpState";
import { useRestaurantImageUpload } from "@/hooks/restaurant/useRestaurantImageUpload";
import { verifyWithBackoff } from "@/hooks/restaurant/useRestaurantProfileVerification";
import { 
  clearTemporaryCredentials, 
  storeTemporaryCredentials,
  recordNewUserId
} from "@/utils/authStateHelpers";
import { useRef } from "react";

/**
 * Hook to manage the restaurant signup process
 */
export const useRestaurantSignUp = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signUp } = useAuth();
  const { handleImageUpload } = useRestaurantImageUpload();
  
  // Get all the state variables and setters from useSignUpState
  const signUpState = useSignUpState();
  
  // Add a ref to track if the signup process has already been initiated
  // This prevents multiple signup attempts and state updates during unmounting
  const isSigningUpRef = useRef(false);
  
  const {
    email,
    password,
    restaurantName,
    foodType,
    address,
    latitude,
    longitude,
    imageFile,
    setIsLoading,
    isLoading,
  } = signUpState;
  
  // Sign up process with improved error handling and verification
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent multiple simultaneous signups or executing during unmount
    if (isSigningUpRef.current || isLoading) {
      console.log("Signup already in progress, ignoring duplicate request");
      return;
    }
    
    console.log("Restaurant signup form submitted with:", { 
      email, restaurantName, foodType, address, latitude, longitude 
    });
    
    try {
      isSigningUpRef.current = true;
      setIsLoading(true);
      
      // Store current signup state in sessionStorage to persist across redirects
      storeTemporaryCredentials(email, password);
      
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
      
      // Store new user ID (using the utility function)
      recordNewUserId(data.user.id);
      
      // Verify that restaurant profile was created successfully with exponential backoff
      const profileVerified = await verifyWithBackoff(
        data.user.id,
        restaurantName,
        foodType,
        address, 
        latitude,
        longitude
      );
      
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
        try {
          await handleImageUpload(data.user.id, imageFile);
        } catch (uploadError) {
          console.error("Image upload failed, but continuing with signup:", uploadError);
          toast({
            title: "Image Upload Failed",
            description: "We couldn't upload your restaurant image, but your account was created successfully. You can add an image later.",
            variant: "default",
          });
        }
      }
      
      // Only set is_new_signup right before navigation to prevent loops
      sessionStorage.setItem('is_new_signup', 'true');
      
      // Queue the toast to appear after navigation to avoid state issues
      setTimeout(() => {
        toast({
          title: "Restaurant account created!",
          description: "Your restaurant account has been created successfully.",
        });
      }, 100);
      
      // Navigate to success page with replace to prevent back navigation to signup
      navigate("/signup-success", { replace: true });
      
    } catch (error: any) {
      console.error("Restaurant signup error:", error);
      
      // Clear temporary credentials on error
      clearTemporaryCredentials();
      
      // Clear is_new_signup flag on error to prevent state conflicts
      sessionStorage.removeItem('is_new_signup');
      
      // Use setTimeout to prevent state update during potential unmount
      setTimeout(() => {
        toast({
          title: "Sign Up Failed",
          description: error instanceof Error ? error.message : "An unexpected error occurred",
          variant: "destructive",
        });
      }, 0);
    } finally {
      setIsLoading(false);
      // Allow new signup attempts after this one is complete
      isSigningUpRef.current = false;
    }
  };

  // Return all state variables and methods
  return {
    ...signUpState,
    handleSignUp,
    isSigningUp: isSigningUpRef.current
  };
};
