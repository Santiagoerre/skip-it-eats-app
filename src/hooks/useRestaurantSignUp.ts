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
import { useRef, useCallback } from "react";

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
  const signupAttemptedRef = useRef(false);
  
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
  const handleSignUp = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent multiple simultaneous signups or executing during unmount
    if (isSigningUpRef.current || isLoading) {
      console.log("Signup already in progress, ignoring duplicate request");
      return;
    }
    
    if (signupAttemptedRef.current) {
      console.log("Signup already attempted, preventing duplicate submission");
      return;
    }
    
    console.log("Restaurant signup form submitted with:", { 
      email, restaurantName, foodType, address, latitude, longitude 
    });
    
    try {
      isSigningUpRef.current = true;
      signupAttemptedRef.current = true;
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
      const response = await signUp(email, password, "restaurant", metadata);
      
      if (response.error) {
        console.error("Signup failed with error:", response.error);
        throw new Error(response.error.message || "Failed to create user account");
      }
      
      if (!response.data?.user) {
        console.error("No user data returned from signup");
        throw new Error("User account could not be created");
      }
      
      console.log("Restaurant account created successfully:", response.data.user.id);
      
      // Store new user ID (using the utility function)
      recordNewUserId(response.data.user.id);
      
      // Verify that restaurant profile was created successfully with exponential backoff
      const profileVerified = await verifyWithBackoff(
        response.data.user.id,
        restaurantName,
        foodType,
        address, 
        latitude,
        longitude
      );
      
      if (!profileVerified) {
        console.warn("Could not verify restaurant profile creation, but continuing...");
        // Don't show toast here as it can interfere with navigation
      }
      
      // Handle image upload if an image was provided
      if (imageFile && response.data.user.id) {
        try {
          await handleImageUpload(response.data.user.id, imageFile);
          console.log("Image uploaded successfully for user:", response.data.user.id);
        } catch (uploadError) {
          console.error("Image upload failed, but continuing with signup:", uploadError);
          // Don't show toast here as it can interfere with navigation
        }
      }
      
      // CRITICAL FIX: Only set is_new_signup right before navigation
      // and ONLY if we're about to redirect to signup-success
      sessionStorage.setItem('is_new_signup', 'true');
      
      console.log("Navigation to signup-success page now...");
      
      // CRITICAL FIX: Use replace:true to prevent back navigation
      // The navigation MUST happen, so don't wrap in try/catch
      navigate("/signup-success", { replace: true });
      
      // Use setTimeout to ensure the navigation happens before showing toast
      setTimeout(() => {
        toast({
          title: "Restaurant account created!",
          description: "Your restaurant account has been created successfully.",
        });
      }, 500);
      
    } catch (error: any) {
      console.error("Restaurant signup error:", error);
      
      // Clear temporary credentials on error
      clearTemporaryCredentials();
      
      // Clear is_new_signup flag on error to prevent state conflicts
      sessionStorage.removeItem('is_new_signup');
      
      // Reset signup flags
      signupAttemptedRef.current = false;
      
      // Show error toast immediately
      toast({
        title: "Sign Up Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      // Allow new signup attempts after this one is complete
      isSigningUpRef.current = false;
    }
  }, [email, password, restaurantName, foodType, address, latitude, longitude, imageFile, 
      navigate, toast, signUp, handleImageUpload, setIsLoading, isLoading]);

  // Return all state variables and methods
  return {
    ...signUpState,
    handleSignUp,
    isSigningUp: isSigningUpRef.current
  };
};
