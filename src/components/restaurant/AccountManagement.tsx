
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Settings } from "lucide-react";
import { 
  Restaurant, 
  RestaurantLocation, 
  fetchRestaurantById, 
  fetchRestaurantLocation,
  updateRestaurantDetails,
  updateRestaurantLocation
} from "@/services/restaurantService";

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
      
      // Update location if address changed
      if (address !== location?.address) {
        await updateRestaurantLocation(user.id, {
          address
        });
      }
      
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
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" /> Restaurant Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Restaurant Name</Label>
            <Input 
              id="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              placeholder="Your restaurant name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="cuisine">Cuisine Type</Label>
            <Input 
              id="cuisine" 
              value={cuisine} 
              onChange={(e) => setCuisine(e.target.value)}
              placeholder="e.g., Italian, Indian, American"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="priceRange">Price Range</Label>
            <select
              id="priceRange"
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="$">$ (Budget)</option>
              <option value="$$">$$ (Moderate)</option>
              <option value="$$$">$$$ (Expensive)</option>
              <option value="$$$$">$$$$ (Very Expensive)</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell customers about your restaurant"
              rows={4}
            />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" /> Location
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input 
              id="address" 
              value={address} 
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Full restaurant address"
            />
            <p className="text-xs text-muted-foreground">
              This address will be shown to customers on the map
            </p>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex space-x-4">
        <Button 
          onClick={handleSave} 
          disabled={isSaving} 
          className="flex-1"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
        <Button 
          variant="outline"
          onClick={() => signOut()}
          className="flex-1"
        >
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default AccountManagement;
