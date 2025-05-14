
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  const { session, user, userType } = useAuth();
  const { toast } = useToast();
  const { errors, validateEmailAndPassword, validateLocationData, resetErrors } = useFormValidation();
  const [redirectChecked, setRedirectChecked] = useState(false);
  const [isNewSignupFlow, setIsNewSignupFlow] = useState(
    location.search.includes('new=true') || sessionStorage.getItem('is_new_signup') === 'true'
  );
  
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

  // Check redirection only once to prevent infinite loop
  useEffect(() => {
    // Skip redirect check if explicitly in signup flow or still loading
    if (isNewSignupFlow || isLoading) {
      console.log("RestaurantSignUp - Skipping redirect check (new signup flow or loading)");
      return;
    }

    // Only check once to avoid infinite loop
    if (!redirectChecked) {
      console.log("RestaurantSignUp - Checking if redirect is needed", {
        session: !!session,
        userType,
        redirectChecked
      });
      
      // If user has a complete restaurant profile, redirect to dashboard
      if (session && userType === 'restaurant') {
        console.log("RestaurantSignUp - User already has restaurant profile, redirecting to dashboard");
        navigate("/restaurant-dashboard");
      }
      
      setRedirectChecked(true);
    }
  }, [session, userType, navigate, redirectChecked, isNewSignupFlow, isLoading]);
  
  // Reset errors when component unmounts
  useEffect(() => {
    console.log("RestaurantSignUp component mounted, isNewSignupFlow:", isNewSignupFlow);
    
    return () => {
      console.log("RestaurantSignUp component unmounting, resetting errors");
      resetErrors();
      
      // Only clear the new signup flag when navigating away from the restaurant signup page
      // and not to the success page (which is the expected flow)
      if (location.pathname === '/signup/restaurant' && !window.location.pathname.includes('signup-success')) {
        console.log("Clearing is_new_signup flag on unmount");
        sessionStorage.removeItem('is_new_signup');
      }
    };
  }, [resetErrors, location.pathname]);

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
    if (validateForm()) {
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
