
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  const { session } = useAuth();
  const { toast } = useToast();
  const { errors, validateEmailAndPassword, validateLocationData, resetErrors } = useFormValidation();
  
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

  // Redirect if already logged in
  useEffect(() => {
    if (session) {
      console.log("RestaurantSignUp - User already has session, redirecting to dashboard");
      navigate("/restaurant-dashboard");
    }
  }, [session, navigate]);
  
  // Reset errors when component unmounts
  useEffect(() => {
    console.log("RestaurantSignUp component mounted");
    return () => {
      console.log("RestaurantSignUp component unmounting, resetting errors");
      resetErrors();
    };
  }, [resetErrors]);

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
