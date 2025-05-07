
import { useState } from "react";
import { Search, SlidersHorizontal, MapPin, ListFilter, X } from "lucide-react";
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
import RestaurantCard from "@/components/RestaurantCard";

// Mock data for restaurants
const restaurants = [
  {
    id: 1,
    name: "Taco Truck Deluxe",
    cuisine: "Mexican",
    rating: 4.8,
    price: "$$",
    distance: "0.2 mi",
    imageUrl: "/lovable-uploads/da394ecb-aa2b-40dd-b48b-3d91161b0dac.png",
  },
  {
    id: 2,
    name: "Burger Express",
    cuisine: "American",
    rating: 4.5,
    price: "$$",
    distance: "0.5 mi",
    imageUrl: "/lovable-uploads/da394ecb-aa2b-40dd-b48b-3d91161b0dac.png",
  },
  {
    id: 3,
    name: "Sushi Go",
    cuisine: "Japanese",
    rating: 4.7,
    price: "$$$",
    distance: "0.8 mi",
    imageUrl: "/lovable-uploads/da394ecb-aa2b-40dd-b48b-3d91161b0dac.png",
  },
  {
    id: 4,
    name: "Pizza Palace",
    cuisine: "Italian",
    rating: 4.3,
    price: "$$",
    distance: "1.2 mi",
    imageUrl: "/lovable-uploads/da394ecb-aa2b-40dd-b48b-3d91161b0dac.png",
  },
];

// Filter options
const cuisineTypes = ["All", "American", "Mexican", "Japanese", "Italian", "Chinese", "Thai", "Indian"];
const priceRanges = ["All", "$", "$$", "$$$", "$$$$"];

const MapListView = () => {
  const [view, setView] = useState<"list" | "map">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    cuisine: "All",
    maxDistance: 5, // miles
    minRating: 0,
    price: "All",
  });

  // Filter restaurants based on search query and filters
  const filteredRestaurants = restaurants.filter((restaurant) => {
    const matchesSearch = restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          restaurant.cuisine.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCuisine = filters.cuisine === "All" || restaurant.cuisine === filters.cuisine;
    
    const matchesDistance = parseFloat(restaurant.distance) <= filters.maxDistance;
    
    const matchesRating = restaurant.rating >= filters.minRating;
    
    const matchesPrice = filters.price === "All" || restaurant.price.length === filters.price.length;
    
    return matchesSearch && matchesCuisine && matchesDistance && matchesRating && matchesPrice;
  });

  const resetFilters = () => {
    setFilters({
      cuisine: "All",
      maxDistance: 5,
      minRating: 0,
      price: "All",
    });
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
                    {cuisineTypes.map((cuisine) => (
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
                    max={10}
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
        {view === "list" ? (
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
          <div className="h-full flex items-center justify-center bg-skipit-light rounded-lg text-center p-6">
            <div className="flex flex-col items-center">
              <MapPin className="h-12 w-12 text-skipit-primary mb-4" />
              <h3 className="text-lg font-medium mb-2">Map View</h3>
              <p className="text-muted-foreground text-sm mb-4">
                This would display a map with restaurant locations in a real app.
              </p>
              <p className="text-xs text-muted-foreground">
                (Map integration would be added in the next iteration)
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapListView;
