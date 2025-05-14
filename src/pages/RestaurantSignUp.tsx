
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast"; // Updated import path
import { useAuth } from "@/contexts/auth";
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
      
      // Store credentials temporarily for auto-signin after signup
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('temp_email', email);
        sessionStorage.setItem('temp_password', password);
      }
      
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
      const { data, error } = await signUp(email, password, "restaurant", metadata);
      
      if (error) {
        console.error("Signup failed with error:", error);
        throw new Error(error.message || "Failed to create user account");
      }
      
      if (!data?.user) {
        throw new Error("User account could not be created");
      }
      
      // User has been created successfully
      const userId = data.user.id;
      console.log("User created with ID:", userId);
      
      // Ensure profile exists
      const profileCreated = await ensureUserProfile(userId, "restaurant");
      if (!profileCreated) {
        console.warn("Could not create or update profile. Attempting to continue anyway.");
      }
      
      // Create restaurant location directly (not relying on the trigger)
      if (address && latitude !== 0 && longitude !== 0) {
        try {
          console.log("Creating restaurant location with address:", address);
          const { error: locationError } = await supabase
            .from('restaurant_locations')
            .insert({
              restaurant_id: userId,
              address: address,
              latitude: latitude,
              longitude: longitude
            });
            
          if (locationError) {
            console.error("Error creating restaurant location:", locationError);
            toast({
              title: "Location Error",
              description: "Your account was created, but we couldn't save your location.",
              variant: "destructive",
            });
          } else {
            console.log("Restaurant location created successfully");
          }
        } catch (locationError) {
          console.error("Exception creating location:", locationError);
        }
      }
      
      // Create or update restaurant details
      try {
        console.log("Creating/updating restaurant details");
        const { error: detailsError } = await supabase
          .from('restaurant_details')
          .upsert({
            restaurant_id: userId,
            name: restaurantName,
            cuisine: foodType,
            price_range: '$'
          });
          
        if (detailsError) {
          console.error("Error updating restaurant details:", detailsError);
          toast({
            title: "Details Error",
            description: "Your account was created, but we couldn't save all your restaurant details.",
            variant: "destructive",
          });
        } else {
          console.log("Restaurant details created/updated successfully");
        }
      } catch (detailsError) {
        console.error("Exception updating details:", detailsError);
      }
      
      // If we have an image file, upload it
      if (imageFile) {
        const fileName = `${userId}/profile`;
        
        console.log("Uploading image for user:", userId);
        
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
          console.log("Image uploaded successfully");
          // Get the public URL for the uploaded image
          const { data: publicUrlData } = supabase
            .storage
            .from('restaurant-images')
            .getPublicUrl(fileName);
            
          // Update restaurant details with the image URL
          if (publicUrlData?.publicUrl) {
            try {
              const { error: detailsError } = await supabase
                .from('restaurant_details')
                .update({ image_url: publicUrlData.publicUrl })
                .eq('restaurant_id', userId);
                
              if (detailsError) {
                console.error("Error updating restaurant image URL:", detailsError);
              } else {
                console.log("Restaurant image URL updated successfully");
              }
            } catch (updateError) {
              console.error("Error updating image URL:", updateError);
            }
          }
        }
      }
      
      toast({
        title: "Restaurant account created!",
        description: "Your restaurant account has been created successfully.",
      });
      
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
