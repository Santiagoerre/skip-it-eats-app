
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth";
import { useSignUpState } from "@/hooks/restaurant/useSignUpState";
import { useRestaurantImageUpload } from "@/hooks/restaurant/useRestaurantImageUpload";
import { verifyWithBackoff } from "@/hooks/restaurant/useRestaurantProfileVerification";
import { 
  clearTemporaryCredentials, 
  markAsNewSignupFlow,
  storeTemporaryCredentials
} from "@/utils/authStateHelpers";

export const useRestaurantSignUp = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signUp } = useAuth();
  const { handleImageUpload } = useRestaurantImageUpload();
  
  // Get all the state variables and setters from useSignUpState
  const signUpState = useSignUpState();
  
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
  
  // Mark this as a new signup flow
  markAsNewSignupFlow();

  // Sign up process with improved error handling and verification
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Restaurant signup form submitted with:", { 
      email, restaurantName, foodType, address, latitude, longitude 
    });
    
    try {
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
      
      // Store new user ID in session storage for the success page
      sessionStorage.setItem('new_user_id', data.user.id);
      
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
        await handleImageUpload(data.user.id, imageFile);
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

  // Return all state variables and methods
  return {
    ...signUpState,
    handleSignUp
  };
};
