
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
  const [redirectAttempted, setRedirectAttempted] = useState(false);
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

  // Check redirection only once with improved state management
  useEffect(() => {
    console.log("RestaurantSignUp - Checking redirect conditions:", {
      isNewSignupFlow,
      redirectAttempted,
      session: !!session,
      userType,
      isLoading
    });
    
    // Skip redirect check for new signup flow, loading state, or if already attempted
    if (isNewSignupFlow || isLoading || redirectAttempted) {
      return;
    }

    // Only attempt redirect once
    setRedirectAttempted(true);
    
    // Store redirect attempt in session storage to prevent repeated redirects
    if (!sessionStorage.getItem('restaurant_redirect_attempted')) {
      sessionStorage.setItem('restaurant_redirect_attempted', 'true');
      
      // If user has a complete restaurant profile, redirect to dashboard
      if (session && userType === 'restaurant') {
        console.log("RestaurantSignUp - User already has restaurant profile, redirecting to dashboard");
        navigate("/restaurant-dashboard");
      }
    }
  }, [session, userType, navigate, redirectAttempted, isNewSignupFlow, isLoading]);
  
  // Clear redirect flags when component unmounts
  useEffect(() => {
    console.log("RestaurantSignUp component mounted, isNewSignupFlow:", isNewSignupFlow);
    
    return () => {
      console.log("RestaurantSignUp component unmounting");
      resetErrors();
      
      // Only clear the new signup flag when navigating away from the restaurant signup page
      // and not to the success page (which is the expected flow)
      if (location.pathname === '/signup/restaurant' && !window.location.pathname.includes('signup-success')) {
        console.log("Clearing is_new_signup flag on unmount");
        sessionStorage.removeItem('is_new_signup');
      }
      
      // Clear redirect flag only when navigating to dashboard or success page
      if (window.location.pathname.includes('restaurant-dashboard') || 
          window.location.pathname.includes('signup-success')) {
        sessionStorage.removeItem('restaurant_redirect_attempted');
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
