
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth";
import SignUpForm from "@/components/auth/SignUpForm";
import EmailPasswordFields from "@/components/auth/EmailPasswordFields";
import FoodTypeSelector from "@/components/auth/FoodTypeSelector";
import ImageUploader from "@/components/auth/ImageUploader";
import LocationSelector from "@/components/auth/LocationSelector";
import { useFormValidation } from "@/hooks/useFormValidation";

const RestaurantSignUp = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signUp, session } = useAuth();
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
  const { errors, validateEmailAndPassword, validateLocationData, resetErrors } = useFormValidation();

  // Redirect if already logged in
  useEffect(() => {
    if (session) {
      navigate("/restaurant-dashboard");
    }
  }, [session, navigate]);
  
  // Reset errors when component unmounts
  useEffect(() => {
    return () => {
      resetErrors();
    };
  }, [resetErrors]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
        errorMessage: "Restaurant name is required"
      }
    });

    // Validate location data with coordinates
    const isLocationValid = validateLocationData(address, latitude, longitude);
    
    if (!isFormValid || !isLocationValid) {
      toast({
        title: "Validation Error",
        description: "Please check the form for errors and try again.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      console.log("Starting restaurant signup process with coordinates:", { latitude, longitude });
      
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
      const { data, error, userId } = await signUp(email, password, "restaurant", metadata);
      
      if (error) {
        console.error("Signup failed with error:", error);
        throw new Error(error.message || "Failed to create user account");
      }
      
      if (!data?.user) {
        throw new Error("User account could not be created");
      }
      
      toast({
        title: "Restaurant account created!",
        description: "Your restaurant account has been created successfully.",
      });
      
      // Store the user ID in session storage for the success page to use
      if (userId) {
        sessionStorage.setItem('new_user_id', userId);
      }
      
      // Navigate to success page, user will be handled by SignUpSuccess component
      navigate("/signup-success");
      
    } catch (error: any) {
      console.error("Restaurant signup error:", error);
      
      // Clear temporary credentials on error
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('temp_email');
        sessionStorage.removeItem('temp_password');
      }
      
      toast({
        title: "Sign Up Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (file: File) => {
    setImageFile(file);
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
      
      <div className="space-y-2">
        <label htmlFor="restaurantName" className="block text-sm font-medium">
          Restaurant Name (Required)
        </label>
        <input
          id="restaurantName"
          type="text"
          value={restaurantName}
          onChange={(e) => setRestaurantName(e.target.value)}
          className={`w-full p-2 border rounded-md ${errors.restaurantName ? "border-red-500" : ""}`}
          disabled={isLoading}
        />
        {errors.restaurantName && <p className="text-red-500 text-sm">{errors.restaurantName}</p>}
      </div>
      
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
