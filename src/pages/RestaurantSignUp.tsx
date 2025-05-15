
import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { useToast } from "@/hooks/use-toast";
import { useFormValidation } from "@/hooks/useFormValidation";
import { supabase } from "@/integrations/supabase/client";

import SignUpForm from "@/components/auth/SignUpForm";
import EmailPasswordFields from "@/components/auth/EmailPasswordFields";
import FoodTypeSelector from "@/components/auth/FoodTypeSelector";
import ImageUploader from "@/components/auth/ImageUploader";
import LocationSelector from "@/components/auth/LocationSelector";
import RestaurantNameField from "@/components/restaurant/signup/RestaurantNameField";

const RestaurantSignUp = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { session, user, userType, signUp } = useAuth();
  const { toast } = useToast();
  const { errors, validateEmailAndPassword, validateLocationData, resetErrors } = useFormValidation();
  
  // Form state
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
  
  // Track form submission
  const isSubmittingRef = useRef(false);
  const redirectCheckedRef = useRef(false);
  
  // Check if we should redirect user if already logged in
  useEffect(() => {
    // Skip redirect if explicitly in new signup flow
    if (redirectCheckedRef.current || 
        searchParams.get('new') === 'true' || 
        sessionStorage.getItem('is_new_signup') === 'true') {
      return;
    }

    // Redirect if user is already logged in as restaurant
    if (session?.user && userType === 'restaurant') {
      redirectCheckedRef.current = true;
      navigate("/restaurant-dashboard", { replace: true });
    }
  }, [session, userType, navigate, searchParams]);
  
  // Handle image upload
  const handleImageChange = (file: File) => {
    setImageFile(file);
  };
  
  // Validate form before submission
  const validateForm = () => {
    // Validate form fields
    const isFormValid = validateEmailAndPassword(email, password, confirmPassword, {
      foodType: {
        value: foodType,
        required: true,
        validator: (value: string) => !!value,
        errorMessage: "Food type is required"
      },
      restaurantName: {
        value: restaurantName,
        required: true,
        validator: (value: string) => value.length > 2,
        errorMessage: "Restaurant name is required and must be at least 3 characters"
      }
    });

    // Validate location data with coordinates
    const isLocationValid = validateLocationData(address, latitude, longitude);
    
    if (!isFormValid || !isLocationValid) {
      console.error("Form validation failed:", errors);
      toast({
        title: "Validation Error",
        description: "Please check the form for errors and try again.",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  // Handle form submission - using the pattern from CustomerSignUp
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent duplicate submissions
    if (isSubmittingRef.current || isLoading) {
      return;
    }
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    try {
      isSubmittingRef.current = true;
      setIsLoading(true);
      
      // Prepare restaurant data
      const restaurantData = {
        user_type: "restaurant",
        display_name: restaurantName,
        food_type: foodType,
        address: address,
        latitude: latitude,
        longitude: longitude
      };
      
      console.log("Submitting restaurant signup:", { email, restaurantData });
      
      // Use the same signUp method as CustomerSignUp, just with additional metadata
      const result = await signUp(email, password, "restaurant", restaurantData);
      
      if (result.error) {
        throw new Error(result.error.message || "Failed to create restaurant account");
      }
      
      // Handle image upload if an image was provided
      if (imageFile && result.data?.user?.id) {
        try {
          // Upload profile image using supabase storage
          const filePath = `restaurant_profile/${result.data.user.id}`;
          const { error: uploadError } = await supabase.storage
            .from('profiles')
            .upload(filePath, imageFile, {
              cacheControl: '3600',
              upsert: true
            });
            
          if (uploadError) {
            console.warn("Failed to upload profile image:", uploadError);
          }
        } catch (imageError) {
          console.warn("Error uploading image:", imageError);
        }
      }
      
      // Success! Show toast and redirect
      toast({
        title: "Restaurant account created!",
        description: "Your restaurant account has been created successfully.",
      });
      
      // Set signup flag right before navigation
      sessionStorage.setItem('is_new_signup', 'true');
      
      // Navigate to success page
      navigate("/signup-success", { replace: true });
    } catch (error: any) {
      console.error("Restaurant signup error:", error);
      
      toast({
        title: "Sign Up Failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      isSubmittingRef.current = false;
    }
  };

  return (
    <SignUpForm
      title="Create Restaurant Account"
      subtitle="Sign up to start receiving orders"
      onSubmit={handleSignUp}
      isLoading={isLoading}
    >
      <EmailPasswordFields
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        confirmPassword={confirmPassword}
        setConfirmPassword={setConfirmPassword}
        errors={errors}
        isLoading={isLoading}
      />
      
      <RestaurantNameField
        restaurantName={restaurantName}
        setRestaurantName={setRestaurantName}
        error={errors.restaurantName}
        isLoading={isLoading}
      />
      
      <FoodTypeSelector
        foodType={foodType}
        setFoodType={setFoodType}
        error={errors.foodType}
        isLoading={isLoading}
      />
      
      <LocationSelector
        address={address}
        setAddress={setAddress}
        error={errors.address}
        isLoading={isLoading}
        latitude={latitude}
        setLatitude={setLatitude}
        longitude={longitude}
        setLongitude={setLongitude}
      />
      
      <ImageUploader
        onImageChange={handleImageChange}
        isLoading={isLoading}
      />
    </SignUpForm>
  );
};

export default RestaurantSignUp;
