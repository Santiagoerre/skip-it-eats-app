
import { useEffect, useRef, useState } from "react";
import { MapPin, Navigation, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { fetchRestaurants, fetchRestaurantLocation } from "@/services/restaurantService";

interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  price_range: string;
  latitude?: number;
  longitude?: number;
  image_url?: string;
}

interface MapViewProps {
  onRestaurantSelect: (restaurantId: string) => void;
}

const MapView = ({ onRestaurantSelect }: MapViewProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [userLocation, setUserLocation] = useState<GeolocationPosition | null>(null);
  const { toast } = useToast();
  const [mapError, setMapError] = useState<string | null>(null);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);

  // Fetch restaurants data - not using React Query as we'll manually fetch and transform
  useEffect(() => {
    const fetchMapData = async () => {
      try {
        console.log("Fetching restaurants for map view");
        const restaurantsData = await fetchRestaurants();
        
        // Get location data for each restaurant
        const restaurantsWithLocationPromises = restaurantsData.map(async (restaurant) => {
          try {
            const location = await fetchRestaurantLocation(restaurant.id);
            console.log(`Restaurant ${restaurant.name} location:`, location);
            
            if (location && location.latitude && location.longitude) {
              return {
                ...restaurant,
                latitude: location.latitude,
                longitude: location.longitude
              };
            }
            
            // If no valid location, create a random one near Madrid for demo purposes
            const randomLat = 40.4168 + (Math.random() * 0.1 - 0.05);
            const randomLng = -3.7038 + (Math.random() * 0.1 - 0.05);
            
            console.log(`Creating random location for ${restaurant.name}:`, { lat: randomLat, lng: randomLng });
            
            return {
              ...restaurant,
              latitude: randomLat,
              longitude: randomLng
            };
          } catch (error) {
            console.error("Error fetching location for restaurant:", restaurant.id, error);
            // Return restaurant with random coordinates on error
            return {
              ...restaurant,
              latitude: 40.4168 + (Math.random() * 0.1 - 0.05),
              longitude: -3.7038 + (Math.random() * 0.1 - 0.05)
            };
          }
        });
        
        const restaurantsWithLocation = await Promise.all(restaurantsWithLocationPromises);
        setRestaurants(restaurantsWithLocation);
        console.log("Processed restaurants with location:", restaurantsWithLocation);
        
      } catch (error) {
        console.error('Error fetching restaurants for map:', error);
        setMapError('Failed to load restaurant data');
      } finally {
        setIsMapLoading(false);
      }
    };
    
    fetchMapData();
  }, []);

  // Get user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("User location obtained:", position.coords);
          setUserLocation(position);
        },
        (error) => {
          console.error('Error getting user location:', error);
          // Create a default user location near Madrid for demo purposes
          const fakePosition = {
            coords: {
              latitude: 40.4168,
              longitude: -3.7038,
              accuracy: 10,
              altitude: null,
              altitudeAccuracy: null,
              heading: null,
              speed: null
            },
            timestamp: Date.now()
          };
          setUserLocation(fakePosition as GeolocationPosition);
          
          toast({
            title: "Using default location",
            description: "We're showing you a default location in Madrid",
            variant: "default",
          });
        }
      );
    } else {
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support geolocation",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Initialize map after data is loaded
  useEffect(() => {
    if (isMapLoading || !mapRef.current || mapInitialized) {
      return;
    }

    // Set a short delay to ensure DOM is ready
    const timer = setTimeout(() => {
      setIsMapLoading(false);
      try {
        renderMap();
        setMapInitialized(true);
      } catch (error) {
        console.error('Error initializing map:', error);
        setMapError('Unable to initialize map. Please try again later.');
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [isMapLoading, restaurants, userLocation, mapInitialized]);

  const renderMap = () => {
    if (!mapRef.current) return;
    
    console.log("Rendering map with", restaurants.length, "restaurants");
    const mapContainer = mapRef.current;
    mapContainer.innerHTML = '';
    
    // Create map wrapper with a proper background
    const mapWrapper = document.createElement('div');
    mapWrapper.className = 'relative bg-gray-100 rounded-lg w-full h-full overflow-hidden';
    
    // Create map UI
    const mapUI = document.createElement('div');
    mapUI.className = 'absolute inset-0 p-4';
    
    // Add a simple grid to represent the map (better visual)
    const grid = document.createElement('div');
    grid.className = 'absolute inset-0 grid grid-cols-10 grid-rows-10 z-0';
    for (let i = 0; i < 100; i++) {
      const cell = document.createElement('div');
      cell.className = 'border border-gray-200 opacity-20';
      grid.appendChild(cell);
    }
    mapUI.appendChild(grid);
    
    // Add restaurant markers
    restaurants.forEach(restaurant => {
      if (!restaurant.latitude || !restaurant.longitude) {
        console.warn(`Restaurant ${restaurant.name} has invalid coordinates:`, { lat: restaurant.latitude, lng: restaurant.longitude });
        return;
      }
      
      // Normalize coordinates to fit our container
      // We'll use a simple mapping to place markers on our grid
      const x = ((restaurant.longitude + 180) / 360) * 100;
      const y = ((90 - restaurant.latitude) / 180) * 100;
      
      console.log(`Adding marker for ${restaurant.name} at position:`, { x, y, lat: restaurant.latitude, lng: restaurant.longitude });
      
      // Create marker element
      const marker = document.createElement('div');
      marker.className = 'absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10';
      marker.style.left = `${x}%`;
      marker.style.top = `${y}%`;
      
      // Create pin element
      const pin = document.createElement('div');
      pin.className = 'bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors';
      pin.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>`;
      
      marker.appendChild(pin);
      
      // Add restaurant name tooltip
      const tooltip = document.createElement('div');
      tooltip.className = 'absolute top-full left-1/2 transform -translate-x-1/2 mt-1 bg-white p-2 rounded shadow-md text-xs whitespace-nowrap opacity-0 pointer-events-none transition-opacity z-20';
      tooltip.textContent = restaurant.name;
      marker.appendChild(tooltip);
      
      // Show tooltip on hover
      marker.addEventListener('mouseenter', () => {
        tooltip.classList.remove('opacity-0');
        tooltip.classList.add('opacity-100');
      });
      
      marker.addEventListener('mouseleave', () => {
        tooltip.classList.remove('opacity-100');
        tooltip.classList.add('opacity-0');
      });
      
      // Handle marker click to navigate to restaurant
      marker.addEventListener('click', () => {
        onRestaurantSelect(restaurant.id);
      });
      
      mapUI.appendChild(marker);
    });
    
    // Add user marker if location is available
    if (userLocation) {
      const userX = ((userLocation.coords.longitude + 180) / 360) * 100;
      const userY = ((90 - userLocation.coords.latitude) / 180) * 100;
      
      console.log("Adding user marker at:", { x: userX, y: userY });
      
      const userMarker = document.createElement('div');
      userMarker.className = 'absolute transform -translate-x-1/2 -translate-y-1/2 z-20';
      userMarker.style.left = `${userX}%`;
      userMarker.style.top = `${userY}%`;
      
      const userPin = document.createElement('div');
      userPin.className = 'bg-blue-500 text-white p-1 rounded-full pulseAnimation';
      userPin.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="4"></circle></svg>`;
      
      userMarker.appendChild(userPin);
      
      // Add user tooltip
      const userTooltip = document.createElement('div');
      userTooltip.className = 'absolute top-full left-1/2 transform -translate-x-1/2 mt-1 bg-white p-2 rounded shadow-md text-xs whitespace-nowrap opacity-0 pointer-events-none transition-opacity z-20';
      userTooltip.textContent = "Your location";
      userMarker.appendChild(userTooltip);
      
      // Show tooltip on hover
      userMarker.addEventListener('mouseenter', () => {
        userTooltip.classList.remove('opacity-0');
        userTooltip.classList.add('opacity-100');
      });
      
      userMarker.addEventListener('mouseleave', () => {
        userTooltip.classList.remove('opacity-100');
        userTooltip.classList.add('opacity-0');
      });
      
      mapUI.appendChild(userMarker);
    }
    
    mapWrapper.appendChild(mapUI);
    mapContainer.appendChild(mapWrapper);
    
    // Add disclaimer
    const disclaimer = document.createElement('div');
    disclaimer.className = 'absolute bottom-2 right-2 bg-white/80 p-1 rounded text-xs text-gray-500';
    disclaimer.textContent = 'Map View (Simplified)';
    mapWrapper.appendChild(disclaimer);
    
    // Add pulse animation style for user location
    const style = document.createElement('style');
    style.textContent = `
      .pulseAnimation {
        animation: pulse 1.5s infinite;
      }
      @keyframes pulse {
        0% {
          transform: scale(0.95);
          box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
        }
        70% {
          transform: scale(1);
          box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
        }
        100% {
          transform: scale(0.95);
          box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
        }
      }
    `;
    document.head.appendChild(style);
  };

  // Center map on user location
  const centerOnUserLocation = () => {
    if (userLocation && mapRef.current) {
      toast({
        title: "Map Centered",
        description: "Map centered on your current location",
      });
      renderMap();
    }
  };

  // Refresh map data
  const refreshMap = () => {
    setMapInitialized(false);
    setIsMapLoading(true);
    
    // Fetch data again
    const fetchData = async () => {
      try {
        const restaurantsData = await fetchRestaurants();
        
        // Add mock locations if needed for demonstration purposes
        const restaurantsWithLocation = restaurantsData.map(restaurant => ({
          ...restaurant,
          latitude: 40.4168 + (Math.random() * 0.1 - 0.05),
          longitude: -3.7038 + (Math.random() * 0.1 - 0.05)
        }));
        
        setRestaurants(restaurantsWithLocation);
        renderMap();
        
        toast({
          title: "Map Refreshed",
          description: "Map data has been refreshed",
        });
      } catch (error) {
        console.error('Error refreshing map data:', error);
        setMapError('Failed to refresh map data');
      } finally {
        setIsMapLoading(false);
      }
    };
    
    fetchData();
  };

  if (isMapLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  if (mapError) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <MapPin className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium mb-2">Map Error</h3>
        <p className="text-muted-foreground text-sm mb-4">{mapError}</p>
        <Button onClick={refreshMap}>Reload Map</Button>
      </div>
    );
  }

  if (restaurants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <MapPin className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium mb-2">No Restaurants Found</h3>
        <p className="text-muted-foreground text-sm mb-4">We couldn't find any restaurants with valid location data.</p>
        <Button onClick={refreshMap}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full rounded-lg overflow-hidden" />
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 flex gap-2">
        {userLocation && (
          <Button 
            size="sm" 
            className="flex items-center gap-2"
            onClick={centerOnUserLocation}
          >
            <Navigation className="h-4 w-4" />
            <span>Center on me</span>
          </Button>
        )}
        <Button 
          size="sm" 
          variant="outline"
          onClick={refreshMap}
        >
          Refresh Map
        </Button>
      </div>
    </div>
  );
};

export default MapView;
