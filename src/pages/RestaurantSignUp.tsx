
import { useState, useEffect } from "react";
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
import { ensureUserProfile } from "@/services/authService";

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
  const { errors, validateEmailAndPassword, validateLocationData, resetErrors } = useFormValidation();

  // Reset errors when component unmounts
  useEffect(() => {
    return () => {
      resetErrors();
    };
  }, []);

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
      
      // Register with Supabase with additional metadata
      await signUp(email, password, "restaurant", { 
        display_name: restaurantName,
        food_type: foodType,
        address: address,
        latitude: latitude,
        longitude: longitude
      });
      
      // Check if the user was actually created
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        console.log("User created with ID:", user.id);
        
        // Explicitly ensure profile exists
        await ensureUserProfile(user.id, "restaurant");
        
        // If we have a user and image file, upload it
        if (imageFile) {
          const fileName = `${user.id}/profile`;
          const { error: uploadError } = await supabase.storage
            .from('restaurant-images')
            .upload(fileName, imageFile, {
              upsert: true
            });
          
          if (uploadError) {
            console.error("Error uploading image:", uploadError);
            // Non-blocking error - we'll still proceed with account creation
            toast({
              title: "Image upload failed",
              description: "Your account was created, but we couldn't upload your image. You can add it later.",
              variant: "destructive",
            });
          } else {
            // Get the public URL for the uploaded image
            const { data: publicUrlData } = supabase
              .storage
              .from('restaurant-images')
              .getPublicUrl(fileName);
              
            // Update restaurant details with the image URL
            if (publicUrlData?.publicUrl) {
              const { error: detailsError } = await supabase
                .from('restaurant_details')
                .update({ image_url: publicUrlData.publicUrl })
                .eq('restaurant_id', user.id);
                
              if (detailsError) {
                console.error("Error updating restaurant image URL:", detailsError);
              }
            }
          }
        }
        
        toast({
          title: "Restaurant account created!",
          description: "Your restaurant account has been created successfully.",
        });
        
        navigate("/signup-success");
      } else {
        throw new Error("Failed to create user account");
      }
    } catch (error: any) {
      console.error("Restaurant signup error:", error);
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
