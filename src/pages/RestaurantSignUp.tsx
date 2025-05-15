
import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { useToast } from "@/hooks/use-toast";
import { useFormValidation } from "@/hooks/useFormValidation";
import { useRestaurantSignUp } from "@/hooks/useRestaurantSignUp";

import SignUpForm from "@/components/auth/SignUpForm";
import EmailPasswordFields from "@/components/auth/EmailPasswordFields";
import FoodTypeSelector from "@/components/auth/FoodTypeSelector";
import ImageUploader from "@/components/auth/ImageUploader";
import LocationSelector from "@/components/auth/LocationSelector";
import RestaurantNameField from "@/components/restaurant/signup/RestaurantNameField";

const RestaurantSignUp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { session, user, userType } = useAuth();
  const { toast } = useToast();
  const { errors, validateEmailAndPassword, validateLocationData, resetErrors } = useFormValidation();
  
  // Track if redirect check has been performed
  const redirectCheckedRef = useRef(false);
  const formSubmittedRef = useRef(false);
  
  // Use URL search params directly and memoize the result with useState initialization
  // This prevents re-setting the state on component re-renders
  const [isNewSignupFlow] = useState(() => {
    return searchParams.get('new') === 'true' || sessionStorage.getItem('is_new_signup') === 'true';
  });
  
  // Get all restaurant signup functionality
  const {
    email, setEmail,
    password, setPassword,
    confirmPassword, setConfirmPassword,
    foodType, setFoodType,
    restaurantName, setRestaurantName,
    address, setAddress,
    latitude, setLatitude,
    longitude, setLongitude,
    isLoading,
    handleSignUp,
    handleImageChange
  } = useRestaurantSignUp();

  // Check redirection once with improved state management
  useEffect(() => {
    // Skip if already verified, in new signup flow, or loading
    if (redirectCheckedRef.current || isNewSignupFlow || isLoading || formSubmittedRef.current) {
      return;
    }
    
    // Mark check as performed to prevent repeated checks
    redirectCheckedRef.current = true;
    
    console.log("RestaurantSignUp - Checking redirect conditions:", {
      isNewSignupFlow,
      session: !!session,
      userType
    });
    
    // If user has a complete restaurant profile, redirect to dashboard
    if (session && userType === 'restaurant') {
      console.log("RestaurantSignUp - User already has restaurant profile, redirecting to dashboard");
      navigate("/restaurant-dashboard", { replace: true });
    }
  }, [session, userType, navigate, isNewSignupFlow, isLoading]);
  
  // Only reset errors on mount, not on every render
  useEffect(() => {
    console.log("RestaurantSignUp component mounted, isNewSignupFlow:", isNewSignupFlow);
    resetErrors();
    
    // Clean up function to prevent state modification on unmount
    return () => {
      console.log("RestaurantSignUp component unmounted");
      // DO NOT manipulate sessionStorage here to prevent loops
    };
  }, [resetErrors, isNewSignupFlow]);

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

  // Wrap the handleSignUp with validation
  const onSubmit = async (e: React.FormEvent) => {
    if (formSubmittedRef.current) {
      console.log("Form already submitted, preventing duplicate submission");
      e.preventDefault();
      return;
    }
    
    if (validateForm()) {
      formSubmittedRef.current = true;
      await handleSignUp(e);
    } else {
      e.preventDefault();
    }
  };

  return (
    <SignUpForm
      title="Create Restaurant Account"
      subtitle="Sign up to start receiving orders"
      onSubmit={onSubmit}
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
