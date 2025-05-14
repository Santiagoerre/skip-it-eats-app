
import { useState } from "react";

/**
 * Hook to manage restaurant signup form state
 */
export const useSignUpState = () => {
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
  
  return {
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    foodType,
    setFoodType,
    restaurantName,
    setRestaurantName,
    address,
    setAddress,
    latitude,
    setLatitude,
    longitude,
    setLongitude,
    imageFile,
    setImageFile,
    isLoading,
    setIsLoading,
    handleImageChange: (file: File) => setImageFile(file)
  };
};
