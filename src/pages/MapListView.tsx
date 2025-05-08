
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, SlidersHorizontal, MapPin, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import RestaurantCard from "@/components/RestaurantCard";
import MapView from "@/components/MapView";
import { 
  fetchRestaurants, 
  Restaurant, 
  calculateDistance, 
  formatDistance, 
  fetchRestaurantLocation 
} from "@/services/restaurantService";

const MapListView = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [view, setView] = useState<"list" | "map">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [filters, setFilters] = useState({
    cuisine: "All",
    maxDistance: 10, // miles
    minRating: 0,
    price: "All",
  });

  // Fetch real restaurant data
  useEffect(() => {
    const loadRestaurants = async () => {
      try {
        setIsLoading(true);
        const data = await fetchRestaurants();

        // Get user location if available
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const userLat = position.coords.latitude;
              const userLon = position.coords.longitude;
              setUserLocation({ latitude: userLat, longitude: userLon });
              
              // Add distance to each restaurant
              const restaurantsWithDistance = await Promise.all(
                data.map(async (restaurant) => {
                  const location = await fetchRestaurantLocation(restaurant.id);
                  if (location && location.latitude && location.longitude) {
                    const distance = calculateDistance(
                      userLat, userLon,
                      location.latitude, location.longitude
                    );
                    return {
                      ...restaurant,
                      distance: formatDistance(distance),
                      distanceValue: distance * 0.621371 // km to miles
                    };
                  }
                  return {
                    ...restaurant,
                    distance: 'Unknown',
                    distanceValue: Infinity
                  };
                })
              );
              
              // Sort by distance
              restaurantsWithDistance.sort((a, b) => {
                return (a.distanceValue || Infinity) - (b.distanceValue || Infinity);
              });
              
              setRestaurants(restaurantsWithDistance);
            },
            (error) => {
              console.error('Error getting user location:', error);
              setRestaurants(data);
            }
          );
        } else {
          setRestaurants(data);
        }
      } catch (error) {
        console.error('Error loading restaurants:', error);
        toast({
          title: "Error loading restaurants",
          description: "Could not load restaurant data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadRestaurants();
  }, [toast]);

  // Filter restaurants based on search query and filters
  const filteredRestaurants = restaurants.filter((restaurant) => {
    const matchesSearch = restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          restaurant.cuisine.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCuisine = filters.cuisine === "All" || restaurant.cuisine === filters.cuisine;
    
    const matchesDistance = !restaurant.distanceValue || restaurant.distanceValue <= filters.maxDistance;
    
    const matchesRating = restaurant.rating >= filters.minRating;
    
    const matchesPrice = filters.price === "All" || 
                         (filters.price === "$" && restaurant.price_range === "$") ||
                         (filters.price === "$$" && restaurant.price_range === "$$") ||
                         (filters.price === "$$$" && restaurant.price_range === "$$$") ||
                         (filters.price === "$$$$" && restaurant.price_range === "$$$$");
    
    return matchesSearch && matchesCuisine && matchesDistance && matchesRating && matchesPrice;
  });

  const resetFilters = () => {
    setFilters({
      cuisine: "All",
      maxDistance: 10,
      minRating: 0,
      price: "All",
    });
  };

  // Get unique cuisine types from the actual data
  const availableCuisines = ["All", ...Array.from(new Set(restaurants.map(r => r.cuisine)))];
  const priceRanges = ["All", "$", "$$", "$$$", "$$$$"];

  const handleRestaurantSelect = (restaurantId: string) => {
    navigate(`/restaurant/${restaurantId}`);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b sticky top-0 bg-white z-10">
        <div className="flex items-center space-x-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search restaurants..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
          
          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline">
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filter Restaurants</SheetTitle>
                <SheetDescription>
                  Adjust filters to find the perfect restaurant for your meal.
                </SheetDescription>
              </SheetHeader>
              
              <div className="py-4 space-y-6">
                <div className="space-y-2">
                  <Label>Cuisine Type</Label>
                  <RadioGroup 
                    value={filters.cuisine} 
                    onValueChange={(value) => setFilters({...filters, cuisine: value})}
                    className="flex flex-wrap gap-2"
                  >
                    {availableCuisines.map((cuisine) => (
                      <div key={cuisine} className="flex items-center space-x-2">
                        <RadioGroupItem value={cuisine} id={`cuisine-${cuisine}`} />
                        <Label htmlFor={`cuisine-${cuisine}`}>{cuisine}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Maximum Distance</Label>
                    <span className="text-sm text-muted-foreground">{filters.maxDistance} miles</span>
                  </div>
                  <Slider
                    value={[filters.maxDistance]}
                    min={0.5}
                    max={20}
                    step={0.5}
                    onValueChange={(value) => setFilters({...filters, maxDistance: value[0]})}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Minimum Rating</Label>
                    <span className="text-sm text-muted-foreground">{filters.minRating} stars</span>
                  </div>
                  <Slider
                    value={[filters.minRating]}
                    min={0}
                    max={5}
                    step={0.5}
                    onValueChange={(value) => setFilters({...filters, minRating: value[0]})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Price Range</Label>
                  <RadioGroup 
                    value={filters.price} 
                    onValueChange={(value) => setFilters({...filters, price: value})}
                    className="flex gap-4"
                  >
                    {priceRanges.map((price) => (
                      <div key={price} className="flex items-center space-x-2">
                        <RadioGroupItem value={price} id={`price-${price}`} />
                        <Label htmlFor={`price-${price}`}>{price}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>
              
              <SheetFooter className="flex-row justify-between space-x-4 sm:space-x-0">
                <Button variant="outline" onClick={resetFilters} className="flex-1">
                  Reset Filters
                </Button>
                <SheetClose asChild>
                  <Button className="flex-1">Apply Filters</Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Switch
              id="view-toggle"
              checked={view === "map"}
              onCheckedChange={(checked) => setView(checked ? "map" : "list")}
            />
            <Label htmlFor="view-toggle" className="text-sm">
              {view === "list" ? "List View" : "Map View"}
            </Label>
          </div>
          
          <div className="flex items-center text-sm text-muted-foreground">
            <span>{filteredRestaurants.length} results</span>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full rounded-md" />
            ))}
          </div>
        ) : view === "list" ? (
          filteredRestaurants.length > 0 ? (
            <div className="space-y-4">
              {filteredRestaurants.map((restaurant) => (
                <RestaurantCard key={restaurant.id} restaurant={restaurant} />
              ))}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-center p-6">
              <div>
                <p className="text-lg font-medium mb-2">No restaurants found</p>
                <p className="text-muted-foreground text-sm">
                  Try adjusting your search or filters
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    setSearchQuery("");
                    resetFilters();
                  }}
                >
                  Clear Search & Filters
                </Button>
              </div>
            </div>
          )
        ) : (
          <div className="h-full">
            <MapView onRestaurantSelect={handleRestaurantSelect} />
          </div>
        )}
      </div>
    </div>
  );
};

export default MapListView;
