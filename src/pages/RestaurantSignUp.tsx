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

  // Check if we're in a new signup flow (prevent redirect for new signups)
  const isNewSignupFlow = location.search.includes('new=true') || sessionStorage.getItem('is_new_signup') === 'true';

  // Redirect if already logged in with a completed profile
  useEffect(() => {
    // Skip redirect check if explicitly in signup flow or still loading
    if (isNewSignupFlow || isLoading) {
      return;
    }

    // Delay the redirect check to avoid rapid mount/unmount cycles
    const redirectTimer = setTimeout(() => {
      if (session && userType === 'restaurant' && !redirectChecked) {
        console.log("RestaurantSignUp - User already has restaurant profile, redirecting to dashboard");
        navigate("/restaurant-dashboard");
      }
      setRedirectChecked(true);
    }, 1000);

    return () => clearTimeout(redirectTimer);
  }, [session, userType, navigate, redirectChecked, isNewSignupFlow, isLoading]);
  
  // Reset errors when component unmounts
  useEffect(() => {
    console.log("RestaurantSignUp component mounted");
    
    // Mark as new signup flow in session storage
    if (!sessionStorage.getItem('is_new_signup')) {
      sessionStorage.setItem('is_new_signup', 'true');
    }
    
    return () => {
      console.log("RestaurantSignUp component unmounting, resetting errors");
      resetErrors();
      // Clear the new signup flag when component unmounts after successful signup
      if (location.pathname !== '/signup/restaurant') {
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
