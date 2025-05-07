
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Upload } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const foodTypes = [
  "American", "Chinese", "Italian", "Mexican", "Japanese", 
  "Indian", "Thai", "Mediterranean", "Fast Food", "Breakfast",
  "Vegetarian", "Vegan", "Seafood", "BBQ", "Dessert", "Other"
];

const RestaurantSignUp = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [foodType, setFoodType] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
    foodType?: string;
  }>({});

  const validateForm = () => {
    const newErrors: {
      email?: string;
      password?: string;
      confirmPassword?: string;
      foodType?: string;
    } = {};
    
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
    
    // Food type validation
    if (!foodType) {
      newErrors.foodType = "Food type is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      // This is where we would register with Supabase and upload the image
      // First register the user
      // const { data, error } = await supabase.auth.signUp({ 
      //   email, 
      //   password,
      //   options: {
      //     data: {
      //       user_type: 'restaurant',
      //       food_type: foodType
      //     }
      //   }
      // });
      
      // If error, show error message
      // if (error) throw error;
      
      // Then, if we have an image file, upload it to Supabase storage
      // if (imageFile && data?.user) {
      //   const { error: uploadError } = await supabase.storage
      //     .from('restaurant-images')
      //     .upload(`${data.user.id}/profile`, imageFile);
      //
      //   if (uploadError) throw uploadError;
      // }
      
      // For now, we'll simulate successful registration
      console.log("Signing up restaurant with:", email, password, foodType, imageFile);
      
      toast({
        title: "Restaurant account created!",
        description: "Your restaurant account has been created successfully.",
      });
      
      navigate("/signup-success");
    } catch (err: any) {
      toast({
        title: "Error signing up",
        description: err.message || "Please check your information and try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mobile-container app-height flex flex-col p-6 bg-white">
      <button 
        onClick={() => navigate("/user-type")}
        className="flex items-center text-muted-foreground mb-6"
        disabled={isLoading}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </button>
      
      <div className="flex-1 flex flex-col">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-skipit-primary">Create Restaurant Account</h1>
          <p className="text-muted-foreground mt-2">Sign up to start receiving orders</p>
        </div>
        
        <form onSubmit={handleSignUp} className="space-y-6 pb-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="restaurant@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={errors.email ? "border-red-500" : ""}
              disabled={isLoading}
            />
            {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={errors.password ? "border-red-500" : ""}
              disabled={isLoading}
            />
            {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={errors.confirmPassword ? "border-red-500" : ""}
              disabled={isLoading}
            />
            {errors.confirmPassword && <p className="text-red-500 text-sm">{errors.confirmPassword}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="foodType">Food Type (Required)</Label>
            <Select 
              value={foodType} 
              onValueChange={setFoodType}
              disabled={isLoading}
            >
              <SelectTrigger className={errors.foodType ? "border-red-500" : ""}>
                <SelectValue placeholder="Select food type" />
              </SelectTrigger>
              <SelectContent>
                {foodTypes.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.foodType && <p className="text-red-500 text-sm">{errors.foodType}</p>}
          </div>
          
          <div className="space-y-2">
            <Label>Background Image (Optional)</Label>
            <div 
              className="border-2 border-dashed rounded-md p-4 text-center cursor-pointer hover:bg-gray-50" 
              onClick={() => !isLoading && document.getElementById("image-upload")?.click()}
              style={{ opacity: isLoading ? 0.7 : 1 }}
            >
              {imagePreview ? (
                <div className="flex flex-col items-center">
                  <img src={imagePreview} alt="Preview" className="max-h-40 mb-2 rounded-md" />
                  <p className="text-sm text-muted-foreground">Click to change image</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Click to upload restaurant image</p>
                </div>
              )}
              <input 
                id="image-upload" 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleImageChange}
                disabled={isLoading}
              />
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full py-6 text-base"
            disabled={isLoading}
          >
            {isLoading ? "Signing Up..." : "Sign Up"}
          </Button>
          
          <div className="text-center mt-6">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Button
                variant="link"
                className="p-0 h-auto"
                onClick={() => navigate("/signin")}
                disabled={isLoading}
              >
                Sign In
              </Button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RestaurantSignUp;
