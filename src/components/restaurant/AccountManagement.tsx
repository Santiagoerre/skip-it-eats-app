
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth";
import { useToast } from "@/components/ui/use-toast";
import { 
  Restaurant, 
  RestaurantLocation, 
  fetchRestaurantById, 
  fetchRestaurantLocation,
  updateRestaurantDetails,
  updateRestaurantLocation
} from "@/services/restaurantService";
import ProfileForm from "./account/ProfileForm";
import LocationForm from "./account/LocationForm";
import AccountActions from "./account/AccountActions";

const AccountManagement = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [location, setLocation] = useState<RestaurantLocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [name, setName] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState(0);
  const [longitude, setLongitude] = useState(0);
  
  useEffect(() => {
    if (user) {
      loadRestaurantData();
    }
  }, [user]);
  
  const loadRestaurantData = async () => {
    setIsLoading(true);
    try {
      if (!user?.id) {
        return;
      }
      
      // Fetch restaurant details
      const restaurantData = await fetchRestaurantById(user.id);
      if (restaurantData) {
        setRestaurant(restaurantData);
        setName(restaurantData.name);
        setCuisine(restaurantData.cuisine || "");
        setPriceRange(restaurantData.price_range || "$");
        setDescription(restaurantData.description || "");
      }
      
      // Fetch location
      const locationData = await fetchRestaurantLocation(user.id);
      if (locationData) {
        setLocation(locationData);
        setAddress(locationData.address);
        setLatitude(locationData.latitude || 0);
        setLongitude(locationData.longitude || 0);
      }
    } catch (error) {
      console.error("Error loading restaurant data:", error);
      toast({
        title: "Error loading data",
        description: "Could not load your restaurant information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCoordinatesChange = (newLatitude: number, newLongitude: number) => {
    setLatitude(newLatitude);
    setLongitude(newLongitude);
  };
  
  const handleSave = async () => {
    if (!user?.id) return;
    
    setIsSaving(true);
    try {
      // Update restaurant details
      await updateRestaurantDetails(user.id, {
        name,
        cuisine,
        price_range: priceRange,
        description
      });
      
      // Update location with coordinates
      await updateRestaurantLocation(user.id, {
        address,
        latitude,
        longitude
      });
      
      toast({
        title: "Changes saved",
        description: "Your restaurant information has been updated successfully.",
      });
      
      // Refresh data
      loadRestaurantData();
    } catch (error) {
      console.error("Error saving restaurant data:", error);
      toast({
        title: "Error saving changes",
        description: "Could not save your changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <p>Loading account information...</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Account Management</h2>
      </div>
      
      <ProfileForm 
        restaurant={restaurant}
        isSaving={isSaving}
        name={name}
        cuisine={cuisine}
        priceRange={priceRange}
        description={description}
        onNameChange={setName}
        onCuisineChange={setCuisine}
        onPriceRangeChange={setPriceRange}
        onDescriptionChange={setDescription}
      />
      
      <LocationForm 
        location={location}
        address={address}
        onAddressChange={setAddress}
        onCoordinatesChange={handleCoordinatesChange}
      />
      
      <AccountActions 
        isSaving={isSaving}
        onSave={handleSave}
        onSignOut={signOut}
      />
    </div>
  );
};

export default AccountManagement;
