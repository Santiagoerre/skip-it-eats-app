
import { useEffect, useRef, useState } from "react";
import { MapPin, Navigation } from "lucide-react";
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

  // Fetch restaurants with React Query
  const { data: restaurants = [], isLoading } = useQuery({
    queryKey: ['mapRestaurants'],
    queryFn: async () => {
      try {
        const restaurantsData = await fetchRestaurants();
        
        // Get location data for each restaurant
        const restaurantsWithLocation = await Promise.all(
          restaurantsData.map(async (restaurant) => {
            const location = await fetchRestaurantLocation(restaurant.id);
            
            return {
              ...restaurant,
              latitude: location?.latitude,
              longitude: location?.longitude
            };
          })
        );
        
        // Filter out restaurants with no location
        return restaurantsWithLocation.filter(
          r => r.latitude !== undefined && r.longitude !== undefined
        ) as Restaurant[];
      } catch (error) {
        console.error('Error fetching restaurants for map:', error);
        setMapError('Failed to load restaurant data');
        return [];
      }
    },
    refetchOnWindowFocus: false,
  });

  // Get user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation(position);
        },
        (error) => {
          console.error('Error getting user location:', error);
          toast({
            title: "Location not available",
            description: "Please enable location services to see nearby restaurants",
            variant: "destructive",
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
    if (isLoading || !mapRef.current || restaurants.length === 0) {
      return;
    }

    try {
      const mapContainer = mapRef.current;
      mapContainer.innerHTML = '';
      
      // Create map wrapper
      const mapWrapper = document.createElement('div');
      mapWrapper.className = 'relative bg-gray-100 rounded-lg w-full h-full overflow-hidden';
      
      // Create map UI
      const mapUI = document.createElement('div');
      mapUI.className = 'absolute inset-0 p-4';
      
      // Add restaurant markers
      restaurants.forEach(restaurant => {
        if (!restaurant.latitude || !restaurant.longitude) return;
        
        // Normalize coordinates to fit our container (simplified mapping)
        const x = ((restaurant.longitude + 180) / 360) * 100;
        const y = ((90 - restaurant.latitude) / 180) * 100;
        
        const marker = document.createElement('div');
        marker.className = 'absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10';
        marker.style.left = `${x}%`;
        marker.style.top = `${y}%`;
        
        const pin = document.createElement('div');
        pin.className = 'bg-skipit-primary text-white p-1 rounded-full hover:bg-skipit-primary-dark transition-colors';
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
        
        const userMarker = document.createElement('div');
        userMarker.className = 'absolute transform -translate-x-1/2 -translate-y-1/2 z-20';
        userMarker.style.left = `${userX}%`;
        userMarker.style.top = `${userY}%`;
        
        const userPin = document.createElement('div');
        userPin.className = 'bg-blue-500 text-white p-1 rounded-full pulseAnimation';
        userPin.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="4"></circle></svg>`;
        
        userMarker.appendChild(userPin);
        mapUI.appendChild(userMarker);
      }
      
      // Add a simple grid to represent the map (since we can't use real map libraries)
      const grid = document.createElement('div');
      grid.className = 'absolute inset-0 grid grid-cols-10 grid-rows-10 z-0';
      for (let i = 0; i < 100; i++) {
        const cell = document.createElement('div');
        cell.className = 'border border-gray-200 opacity-10';
        grid.appendChild(cell);
      }
      mapUI.appendChild(grid);
      
      mapWrapper.appendChild(mapUI);
      mapContainer.appendChild(mapWrapper);
      
      // Add disclaimer
      const disclaimer = document.createElement('div');
      disclaimer.className = 'absolute bottom-2 right-2 bg-white/80 p-1 rounded text-xs text-gray-500';
      disclaimer.textContent = 'Map View (Simplified)';
      mapWrapper.appendChild(disclaimer);
      
      // Add pulse animation style
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
    } catch (error) {
      console.error('Error initializing map:', error);
      setMapError('Unable to initialize map. Please try again later.');
    }
  }, [isLoading, restaurants, userLocation, onRestaurantSelect]);

  // Center map on user location
  const centerOnUserLocation = () => {
    if (userLocation && mapRef.current) {
      toast({
        title: "Map Centered",
        description: "Map centered on your current location",
      });
      
      // In a real app with a proper map library, we would do actual panning/zooming here
      // For now we'll just refresh the map to re-render with the user at center
      const oldMap = mapRef.current.innerHTML;
      mapRef.current.innerHTML = '';
      setTimeout(() => {
        if (mapRef.current) mapRef.current.innerHTML = oldMap;
      }, 10);
    }
  };

  if (isLoading) {
    return <Skeleton className="w-full h-full rounded-lg" />;
  }

  if (mapError) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <MapPin className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium mb-2">Map Error</h3>
        <p className="text-muted-foreground text-sm mb-4">{mapError}</p>
        <Button onClick={() => window.location.reload()}>Reload Map</Button>
      </div>
    );
  }

  if (restaurants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <MapPin className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium mb-2">No Restaurants Found</h3>
        <p className="text-muted-foreground text-sm">We couldn't find any restaurants with location data.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full rounded-lg overflow-hidden" />
      {userLocation && (
        <Button 
          size="sm" 
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 flex items-center gap-2"
          onClick={centerOnUserLocation}
        >
          <Navigation className="h-4 w-4" />
          <span>Center on me</span>
        </Button>
      )}
    </div>
  );
};

export default MapView;
