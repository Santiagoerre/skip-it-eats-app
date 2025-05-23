
import { useState } from "react";

interface ValidationErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  foodType?: string;
  address?: string;
  restaurantName?: string;
  [key: string]: string | undefined;
}

export const useFormValidation = () => {
  const [errors, setErrors] = useState<ValidationErrors>({});

  const validateEmailAndPassword = (
    email: string,
    password: string,
    confirmPassword: string,
    additionalFields: Record<string, any> = {}
  ) => {
    const newErrors: ValidationErrors = {};
    
    // Email validation
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
    }
    
    // Password validation
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    
    // Confirm password validation
    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    // Validate additional fields
    Object.entries(additionalFields).forEach(([key, validators]) => {
      const { value, required, validator, errorMessage } = validators;
      
      if (required && !value) {
        newErrors[key] = `${key} is required`;
      } else if (validator && !validator(value)) {
        newErrors[key] = errorMessage || `Invalid ${key}`;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate address fields
  const validateLocationData = (address: string, latitude = 0, longitude = 0) => {
    const newErrors: ValidationErrors = {};
    
    if (!address || address.trim() === '') {
      newErrors.address = "Address is required";
    } else if (address.trim().length < 5) {
      newErrors.address = "Please enter a complete address";
    }
    
    if (latitude === 0 && longitude === 0) {
      newErrors.address = "Please validate your address to get coordinates";
    }
    
    setErrors(prevErrors => ({
      ...prevErrors,
      ...newErrors
    }));
    
    return Object.keys(newErrors).length === 0;
  };

  // Reset all errors
  const resetErrors = () => {
    setErrors({});
  };

  return {
    errors,
    setErrors,
    validateEmailAndPassword,
    validateLocationData,
    resetErrors,
  };
};
