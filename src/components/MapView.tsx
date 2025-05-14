
import { useEffect, useRef, useState } from "react";
import { MapPin, Navigation, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { fetchRestaurants, fetchRestaurantLocation } from "@/services/restaurantService";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  price_range: string;
  latitude?: number;
  longitude?: number;
  image_url?: string;
  rating?: number;
}

interface MapViewProps {
  onRestaurantSelect: (restaurantId: string) => void;
}

const MapView = ({ onRestaurantSelect }: MapViewProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const { toast } = useToast();
  const [mapError, setMapError] = useState<string | null>(null);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [isGettingUserLocation, setIsGettingUserLocation] = useState(false);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);

  // Fix Leaflet icon paths that are broken in production builds
  useEffect(() => {
    // Only run once on component mount
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    });
  }, []);

  // Fetch restaurants data
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
  const getUserLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support geolocation",
        variant: "destructive",
      });
      return;
    }

    setIsGettingUserLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log("User location obtained:", position.coords);
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setIsGettingUserLocation(false);
        
        toast({
          title: "Location found",
          description: "We've found your current location",
        });
        
        // If map is already initialized, update user marker
        if (leafletMapRef.current) {
          updateUserMarker(position.coords.latitude, position.coords.longitude);
          leafletMapRef.current.setView([position.coords.latitude, position.coords.longitude], 13);
        }
      },
      (error) => {
        console.error('Error getting user location:', error);
        setIsGettingUserLocation(false);
        
        // Create a default user location near Madrid for demo purposes
        const defaultLat = 40.4168;
        const defaultLng = -3.7038;
        
        setUserLocation({
          latitude: defaultLat,
          longitude: defaultLng
        });
        
        toast({
          title: "Using default location",
          description: "We're showing you a default location in Madrid",
          variant: "default",
        });
        
        // If map is already initialized, update with default location
        if (leafletMapRef.current) {
          updateUserMarker(defaultLat, defaultLng);
          leafletMapRef.current.setView([defaultLat, defaultLng], 13);
        }
      }
    );
  };

  // Create or update user location marker
  const updateUserMarker = (lat: number, lng: number) => {
    if (!leafletMapRef.current) return;
    
    // Create custom blue icon for user marker
    const userIcon = new L.Icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
    
    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([lat, lng]);
    } else {
      const marker = L.marker([lat, lng], { 
        icon: userIcon,
        zIndexOffset: 1000 // Ensure user marker is on top
      }).addTo(leafletMapRef.current);
      
      marker.bindPopup("Your location").openPopup();
      userMarkerRef.current = marker;
      
      // Add pulse animation to marker
      const icon = marker.getElement();
      if (icon) {
        icon.classList.add('pulse-animation');
      }
    }
  };

  // Initialize map after data is loaded
  useEffect(() => {
    if (isMapLoading || !mapRef.current) {
      return;
    }

    // Clean up previous map instance if exists
    if (leafletMapRef.current) {
      leafletMapRef.current.remove();
      leafletMapRef.current = null;
      userMarkerRef.current = null;
      markersRef.current = [];
    }

    try {
      console.log("Initializing Leaflet map");
      
      // Set initial map center (use user location if available, otherwise default to Madrid)
      const initialLat = userLocation ? userLocation.latitude : 40.4168;
      const initialLng = userLocation ? userLocation.longitude : -3.7038;
      
      // Create Leaflet map
      const map = L.map(mapRef.current).setView([initialLat, initialLng], 13);
      leafletMapRef.current = map;
      
      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);
      
      // Add user marker if location is available
      if (userLocation) {
        updateUserMarker(userLocation.latitude, userLocation.longitude);
      }
      
      // Add restaurant markers
      restaurants.forEach(restaurant => {
        if (!restaurant.latitude || !restaurant.longitude) return;
        
        // Create custom restaurant marker
        const restaurantIcon = new L.Icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        });
        
        const marker = L.marker([restaurant.latitude, restaurant.longitude], { 
          icon: restaurantIcon 
        }).addTo(map);
        
        // Add popup with restaurant info
        const popupContent = `
          <div class="p-2">
            <h3 class="font-bold">${restaurant.name}</h3>
            <p>${restaurant.cuisine} · ${restaurant.price_range}</p>
            <button class="bg-primary text-white px-2 py-1 rounded text-xs mt-2 view-details-btn" 
              data-id="${restaurant.id}">View Details</button>
          </div>
        `;
        
        const popup = marker.bindPopup(popupContent);
        
        // Handle popup open to attach click event to the button
        popup.on('popupopen', () => {
          const button = document.querySelector(`.view-details-btn[data-id="${restaurant.id}"]`);
          if (button) {
            button.addEventListener('click', () => {
              onRestaurantSelect(restaurant.id);
            });
          }
        });
        
        // Also handle marker click directly
        marker.on('click', () => {
          marker.openPopup();
        });
        
        markersRef.current.push(marker);
      });
      
      // Add pulsing animation style for user location
      const style = document.createElement('style');
      style.textContent = `
        .pulse-animation {
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0% {
            transform: scale(0.95);
            filter: drop-shadow(0 0 0 rgba(59, 130, 246, 0.7));
          }
          70% {
            transform: scale(1);
            filter: drop-shadow(0 0 10px rgba(59, 130, 246, 0));
          }
          100% {
            transform: scale(0.95);
            filter: drop-shadow(0 0 0 rgba(59, 130, 246, 0));
          }
        }
      `;
      document.head.appendChild(style);
      
      // Force map to fit to container
      setTimeout(() => {
        if (leafletMapRef.current) {
          leafletMapRef.current.invalidateSize();
        }
      }, 300);
      
    } catch (error) {
      console.error('Error initializing map:', error);
      setMapError('Unable to initialize map. Please try again later.');
    }
    
    // Cleanup when component unmounts
    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        userMarkerRef.current = null;
        markersRef.current = [];
      }
    };
  }, [isMapLoading, restaurants, userLocation]);

  // Center map on user location
  const centerOnUserLocation = () => {
    if (!userLocation) {
      getUserLocation();
      return;
    }
    
    if (leafletMapRef.current) {
      leafletMapRef.current.setView([userLocation.latitude, userLocation.longitude], 13);
      
      toast({
        title: "Map Centered",
        description: "Map centered on your current location",
      });
    }
  };

  // Refresh map data
  const refreshMap = () => {
    setIsMapLoading(true);
    
    // Clean up previous map
    if (leafletMapRef.current) {
      leafletMapRef.current.remove();
      leafletMapRef.current = null;
      userMarkerRef.current = null;
      markersRef.current = [];
    }
    
    // Refetch data
    const fetchData = async () => {
      try {
        const restaurantsData = await fetchRestaurants();
        
        // Get location data for each restaurant
        const restaurantsWithLocationPromises = restaurantsData.map(async (restaurant) => {
          try {
            const location = await fetchRestaurantLocation(restaurant.id);
            
            if (location && location.latitude && location.longitude) {
              return {
                ...restaurant,
                latitude: location.latitude,
                longitude: location.longitude
              };
            }
            
            // If no valid location, create a random one near Madrid
            return {
              ...restaurant,
              latitude: 40.4168 + (Math.random() * 0.1 - 0.05),
              longitude: -3.7038 + (Math.random() * 0.1 - 0.05)
            };
          } catch (error) {
            console.error("Error fetching location for restaurant:", restaurant.id, error);
            return {
              ...restaurant,
              latitude: 40.4168 + (Math.random() * 0.1 - 0.05),
              longitude: -3.7038 + (Math.random() * 0.1 - 0.05)
            };
          }
        });
        
        const restaurantsWithLocation = await Promise.all(restaurantsWithLocationPromises);
        setRestaurants(restaurantsWithLocation);
        
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

  // Get user location on component mount
  useEffect(() => {
    if (!userLocation) {
      getUserLocation();
    }
  }, []);

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

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full rounded-lg overflow-hidden" />
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 flex gap-2">
        <Button 
          size="sm" 
          className="flex items-center gap-2"
          onClick={centerOnUserLocation}
          disabled={isGettingUserLocation}
        >
          {isGettingUserLocation ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Getting location...</span>
            </>
          ) : (
            <>
              <Navigation className="h-4 w-4" />
              <span>Center on me</span>
            </>
          )}
        </Button>
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
