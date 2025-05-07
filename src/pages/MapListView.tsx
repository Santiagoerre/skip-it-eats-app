
import { useState } from "react";
import { Search, SlidersHorizontal, MapPin, ListFilter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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

const MapListView = () => {
  const [view, setView] = useState<"list" | "map">("list");
  const [searchQuery, setSearchQuery] = useState("");

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
          </div>
          <Button size="icon" variant="outline">
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
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
            <Button variant="ghost" size="sm" className="h-8 px-2">
              <ListFilter className="h-4 w-4 mr-1" />
              Filter
            </Button>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {view === "list" ? (
          <div className="space-y-4">
            {restaurants.map((restaurant) => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>
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
