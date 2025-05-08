
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import SignUpForm from "@/components/auth/SignUpForm";
import EmailPasswordFields from "@/components/auth/EmailPasswordFields";
import FoodTypeSelector from "@/components/auth/FoodTypeSelector";
import ImageUploader from "@/components/auth/ImageUploader";
import LocationSelector from "@/components/auth/LocationSelector";
import { useFormValidation } from "@/hooks/useFormValidation";

const RestaurantSignUp = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signUp } = useAuth();
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
  const { errors, validateEmailAndPassword } = useFormValidation();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmailAndPassword(email, password, confirmPassword, {
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
      },
      address: {
        value: address,
        required: true,
        validator: (value: string) => value.length > 5,
        errorMessage: "Please enter a valid address"
      }
    })) {
      return;
    }

    setIsLoading(true);
    
    try {
      // Register with Supabase with additional metadata
      await signUp(email, password, "restaurant", { 
        display_name: restaurantName,
        food_type: foodType,
        address: address,
        latitude: latitude,
        longitude: longitude
      });
      
      // If we have a session and image file, upload it
      if (imageFile) {
        // Get the newly created user
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const { error: uploadError } = await supabase.storage
            .from('restaurant-images')
            .upload(`${session.user.id}/profile`, imageFile);
          
          if (uploadError) {
            console.error("Error uploading image:", uploadError);
            // Non-blocking error - we'll still proceed with account creation
            toast({
              title: "Image upload failed",
              description: "Your account was created, but we couldn't upload your image. You can add it later.",
              variant: "destructive",
            });
          }
        }
      }
      
      toast({
        title: "Restaurant account created!",
        description: "Your restaurant account has been created successfully.",
      });
      
      navigate("/signup-success");
    } catch (error) {
      // Error is handled in the signUp function
      console.error(error);
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
