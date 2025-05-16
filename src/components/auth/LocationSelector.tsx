import { useState, useEffect, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { MapPin, Check, AlertCircle, MapIcon, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getAddressSuggestions, getCoordinatesForAddress, getAddressFromCoordinates } from "@/utils/geocoding";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface LocationSelectorProps {
  address: string;
  setAddress: (address: string) => void;
  error?: string;
  isLoading: boolean;
  latitude: number;
  setLatitude: (lat: number) => void;
  longitude: number;
  setLongitude: (lng: number) => void;
}

// Cache for address suggestions to reduce API calls
const suggestionCache = new Map<string, string[]>();

const LocationSelector = ({
  address,
  setAddress,
  error,
  isLoading,
  latitude,
  setLatitude,
  longitude,
  setLongitude
}: LocationSelectorProps) => {
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isValidated, setIsValidated] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isMapDialogOpen, setIsMapDialogOpen] = useState(false);
  const [lastRequestTime, setLastRequestTime] = useState(0);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const leafletMarkerRef = useRef<L.Marker | null>(null);
  const userLocationMarkerRef = useRef<L.Marker | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isGettingUserLocation, setIsGettingUserLocation] = useState(false);

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

  // Check if already validated on mount
  useEffect(() => {
    if (latitude && longitude && address && !isValidated) {
      setIsValidated(true);
    }
  }, [latitude, longitude, address, isValidated]);

  // Function to get address suggestions with rate limiting and caching
  const fetchAddressSuggestions = async (input: string) => {
    if (input.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Check cache first
    if (suggestionCache.has(input)) {
      const cachedSuggestions = suggestionCache.get(input);
      if (cachedSuggestions) {
        setSuggestions(cachedSuggestions);
        setShowSuggestions(cachedSuggestions.length > 0);
        return;
      }
    }

    // Rate limiting: Only allow requests every 1 second
    const now = Date.now();
    if (now - lastRequestTime < 1000) {
      return;
    }
    
    setLastRequestTime(now);

    try {
      const addresses = await getAddressSuggestions(input);
      setSuggestions(addresses);
      setShowSuggestions(addresses.length > 0);
    } catch (error) {
      console.error("Error fetching address suggestions:", error);
      setSuggestions([]);
      setShowSuggestions(false);
      toast({
        title: "Error fetching suggestions",
        description: "Could not retrieve address suggestions. Please try typing your full address.",
        variant: "destructive",
      });
    }
  };

  // Function to validate an address and get coordinates with better error handling
  const validateAddress = async () => {
    if (!address || address.trim().length < 5) {
      setValidationError("Please enter a valid address");
      return;
    }

    setIsValidating(true);
    setIsValidated(false);
    setValidationError(null);
    
    try {
      console.log(`Validating address: ${address}`);
      const coordinates = await getCoordinatesForAddress(address);
      
      if (coordinates) {
        setLatitude(coordinates.lat);
        setLongitude(coordinates.lng);
        setIsValidated(true);
        console.log("Address validated successfully:", { address, latitude: coordinates.lat, longitude: coordinates.lng });
        
        toast({
          title: "Address Validated",
          description: "Your address has been successfully validated.",
        });
      } else {
        throw new Error("Could not find coordinates for this address");
      }
    } catch (error) {
      console.error("Error validating address:", error);
      setValidationError(error instanceof Error ? error.message : "Failed to validate address. Please try again later.");
      
      toast({
        title: "Validation Failed",
        description: error instanceof Error ? error.message : "Failed to validate address. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  // Debounced address input handler
  const handleAddressChange = (value: string) => {
    setAddress(value);
    setIsValidated(false);
    
    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    // Set new timer to fetch suggestions after 500ms of inactivity
    debounceTimer.current = setTimeout(() => {
      fetchAddressSuggestions(value);
    }, 500);
  };

  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion: string) => {
    console.log("Selected suggestion:", suggestion);
    setAddress(suggestion);
    setSuggestions([]);
    setShowSuggestions(false);
    // Auto-validate when a suggestion is selected
    setTimeout(() => validateAddress(), 100);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Get user's current location
  const getUserLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Error",
        description: "Geolocation is not supported by your browser",
        variant: "destructive",
      });
      return;
    }

    setIsGettingUserLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        
        // Set user location
        setUserLocation({ lat: userLat, lng: userLng });
        
        // Update map with user location if map is open
        if (leafletMapRef.current) {
          // Center map on user location
          leafletMapRef.current.setView([userLat, userLng], 15);
          
          // Add or update user location marker
          if (userLocationMarkerRef.current) {
            userLocationMarkerRef.current.setLatLng([userLat, userLng]);
          } else {
            // Create a custom blue marker for user location
            const userIcon = new L.Icon({
              iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
              shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41]
            });
            
            const marker = L.marker([userLat, userLng], { 
              icon: userIcon,
              zIndexOffset: 1000 // Ensure user marker is on top
            }).addTo(leafletMapRef.current);
            
            marker.bindPopup("Your location").openPopup();
            userLocationMarkerRef.current = marker;
          }
        }
        
        // Try to get address from coordinates
        try {
          const address = await getAddressFromCoordinates(userLat, userLng);
          if (address) {
            setAddress(address);
            // Also update the restaurant marker position
            setLatitude(userLat);
            setLongitude(userLng);
            setIsValidated(true);
            
            if (leafletMapRef.current && leafletMarkerRef.current) {
              leafletMarkerRef.current.setLatLng([userLat, userLng]);
            }
            
            toast({
              title: "Location found",
              description: "We've set your location and address based on your current position",
            });
          }
        } catch (error) {
          console.error("Error getting address from coordinates:", error);
          // We still have the coordinates even if we couldn't get the address
          setLatitude(userLat);
          setLongitude(userLng);
          setIsValidated(true);
          
          toast({
            title: "Location found",
            description: "We've set your coordinates, but couldn't determine your exact address",
          });
        }
        
        setIsGettingUserLocation(false);
      },
      (error) => {
        console.error("Error getting user location:", error);
        setIsGettingUserLocation(false);
        
        let errorMessage = "Could not get your location";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "You denied the request for location access";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable";
            break;
          case error.TIMEOUT:
            errorMessage = "The request to get your location timed out";
            break;
        }
        
        toast({
          title: "Location error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    );
  };

  // Center map on user location
  const centerMapOnUserLocation = () => {
    if (!userLocation || !leafletMapRef.current) return;
    
    leafletMapRef.current.setView([userLocation.lat, userLocation.lng], 15);
    
    toast({
      title: "Map centered",
      description: "Map centered on your current location",
    });
  };

  // Initialize the Leaflet map when dialog opens
  useEffect(() => {
    if (!isMapDialogOpen) {
      setMapReady(false);
      return;
    }

    // Set a short delay to ensure the DOM is fully ready
    const initTimeout = setTimeout(() => {
      if (!mapContainerRef.current) {
        console.error("Map container ref is not available");
        return;
      }

      // If we already have a map instance, clean it up
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        leafletMarkerRef.current = null;
        userLocationMarkerRef.current = null;
      }
      
      // Get the container and make sure it's ready
      const container = mapContainerRef.current;
      if (!container) {
        console.error("Map container is not available after timeout");
        return;
      }
      
      // Add a specific height to the container to ensure it's visible
      container.style.height = '300px';
      
      // Set initial map center
      const initialLat = latitude || (userLocation ? userLocation.lat : 40.7128); // Default to NYC if no coordinates
      const initialLng = longitude || (userLocation ? userLocation.lng : -74.0060);
      
      try {
        console.log("Initializing map with center:", initialLat, initialLng);
        
        // Create the map
        const map = L.map(container).setView([initialLat, initialLng], 13);
        leafletMapRef.current = map;
        
        // Add Carto Positron tile layer
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>'
        }).addTo(map);
        
        // Add a marker if we have coordinates
        if (latitude && longitude) {
          const marker = L.marker([latitude, longitude], {
            draggable: true
          }).addTo(map);
          leafletMarkerRef.current = marker;
          
          // Handle marker drag events
          marker.on('dragend', async function(e) {
            const marker = e.target;
            const position = marker.getLatLng();
            const newLat = position.lat;
            const newLng = position.lng;
            
            setLatitude(newLat);
            setLongitude(newLng);
            setIsValidated(true);
            
            // Get address from coordinates
            try {
              const newAddress = await getAddressFromCoordinates(newLat, newLng);
              if (newAddress) {
                setAddress(newAddress);
              }
            } catch (error) {
              console.error("Failed to get address from coordinates:", error);
            }
          });
        } else {
          // If no marker yet, create one at the center
          const marker = L.marker([initialLat, initialLng], {
            draggable: true
          }).addTo(map);
          leafletMarkerRef.current = marker;
          
          // Handle marker drag events
          marker.on('dragend', async function(e) {
            const marker = e.target;
            const position = marker.getLatLng();
            const newLat = position.lat;
            const newLng = position.lng;
            
            setLatitude(newLat);
            setLongitude(newLng);
            setIsValidated(true);
            
            // Get address from coordinates
            try {
              const newAddress = await getAddressFromCoordinates(newLat, newLng);
              if (newAddress) {
                setAddress(newAddress);
              }
            } catch (error) {
              console.error("Failed to get address from coordinates:", error);
            }
          });
        }
        
        // Add user location marker if we have it
        if (userLocation) {
          // Create a custom blue marker for user location
          const userIcon = new L.Icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
          });
          
          const marker = L.marker([userLocation.lat, userLocation.lng], { 
            icon: userIcon,
            zIndexOffset: 1000 // Ensure user marker is on top
          }).addTo(map);
          
          marker.bindPopup("Your location").openPopup();
          userLocationMarkerRef.current = marker;
        }
        
        // Handle map click events to move marker
        map.on('click', async function(e) {
          const newLat = e.latlng.lat;
          const newLng = e.latlng.lng;
          
          // Update our coordinates
          setLatitude(newLat);
          setLongitude(newLng);
          setIsValidated(true);
          
          // Move the marker
          if (leafletMarkerRef.current) {
            leafletMarkerRef.current.setLatLng([newLat, newLng]);
          } else {
            // Create new marker if it doesn't exist
            const marker = L.marker([newLat, newLng], {
              draggable: true
            }).addTo(map);
            leafletMarkerRef.current = marker;
            
            // Handle marker drag events
            marker.on('dragend', async function(e) {
              const marker = e.target;
              const position = marker.getLatLng();
              setLatitude(position.lat);
              setLongitude(position.lng);
              setIsValidated(true);
              
              // Get address from coordinates
              try {
                const newAddress = await getAddressFromCoordinates(position.lat, position.lng);
                if (newAddress) {
                  setAddress(newAddress);
                }
              } catch (error) {
                console.error("Failed to get address from coordinates:", error);
              }
            });
          }
          
          // Get address from coordinates
          try {
            const newAddress = await getAddressFromCoordinates(newLat, newLng);
            if (newAddress) {
              setAddress(newAddress);
            }
          } catch (error) {
            console.error("Failed to get address from coordinates:", error);
          }
        });

        // Force map redraw after a short delay
        setTimeout(() => {
          if (leafletMapRef.current) {
            console.log("Invalidating map size");
            leafletMapRef.current.invalidateSize();
          }
          setMapReady(true);
        }, 300);
        
      } catch (error) {
        console.error("Error initializing map:", error);
        toast({
          title: "Map Error",
          description: "Failed to initialize the map. Please try again.",
          variant: "destructive",
        });
      }
    }, 200); // Short delay to ensure DOM is ready
    
    // Cleanup function
    return () => {
      clearTimeout(initTimeout);
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        leafletMarkerRef.current = null;
        userLocationMarkerRef.current = null;
      }
    };
  }, [isMapDialogOpen, latitude, longitude, userLocation, setLatitude, setLongitude, setAddress, toast]);

  return (
    <div className="space-y-2">
      <Label htmlFor="address">Restaurant Address (Required)</Label>
      <div className="relative" ref={suggestionsRef}>
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          id="address"
          value={address}
          onChange={(e) => handleAddressChange(e.target.value)}
          placeholder="Enter your restaurant's address"
          className={`pl-10 ${error || validationError ? "border-red-500" : ""}`}
          disabled={isLoading || isValidating}
          autoComplete="off"
        />
        
        {/* Validate button */}
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
          <Dialog open={isMapDialogOpen} onOpenChange={setIsMapDialogOpen}>
            <DialogTrigger asChild>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={isLoading || isValidating}
                className="p-1 h-auto"
              >
                <MapIcon className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Choose Location on Map</DialogTitle>
                <DialogDescription>
                  Click anywhere on the map to set your restaurant location or drag the marker.
                </DialogDescription>
              </DialogHeader>
              <div className="w-full h-[300px] mt-2 border rounded-md overflow-hidden">
                <div ref={mapContainerRef} className="w-full h-full" style={{ height: '300px' }} />
              </div>
              {!mapReady ? (
                <div className="text-center py-2 text-sm text-muted-foreground">
                  Initializing map...
                </div>
              ) : (
                <div className="flex justify-between items-center pt-2">
                  <Button 
                    size="sm" 
                    variant="secondary" 
                    onClick={getUserLocation}
                    disabled={isGettingUserLocation}
                    className="flex items-center gap-1"
                  >
                    {isGettingUserLocation ? (
                      "Getting location..."
                    ) : (
                      <>
                        <MapPin className="h-4 w-4" />
                        <span>Use My Location</span>
                      </>
                    )}
                  </Button>
                  
                  {userLocation && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={centerMapOnUserLocation}
                      className="flex items-center gap-1"
                    >
                      <Navigation className="h-4 w-4" />
                      <span>Center on Me</span>
                    </Button>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>
          
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-auto"
            onClick={validateAddress}
            disabled={isLoading || isValidating || !address}
          >
            {isValidating ? 
              "Validating..." : 
              isValidated ? 
                <Check className="h-4 w-4 text-green-500" /> : 
                "Validate"
            }
          </Button>
        </div>
        
        {/* Address suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg">
            <ul className="py-1 max-h-60 overflow-auto">
              {suggestions.map((suggestion, index) => (
                <li 
                  key={index}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                  onClick={() => handleSelectSuggestion(suggestion)}
                >
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      {/* Error message */}
      {(error || validationError) && (
        <div className="text-red-500 text-sm">
          {error || validationError}
        </div>
      )}
      
      {/* Success validation message */}
      {isValidated && (
        <Alert className="bg-green-50 border-green-200">
          <Check className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-700 text-sm">
            Address validated successfully. Coordinates saved.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex gap-2 mt-1">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={getUserLocation}
          disabled={isGettingUserLocation || isLoading}
          className="flex items-center gap-1 text-xs"
        >
          {isGettingUserLocation ? (
            "Getting location..."
          ) : (
            <>
              <MapPin className="h-3 w-3" />
              <span>Use My Location</span>
            </>
          )}
        </Button>
      </div>
      
      <p className="text-xs text-muted-foreground">
        This address will be shown to customers on the map
      </p>
      
      {/* Display coordinates if validated */}
      {isValidated && (
        <div className="text-xs text-muted-foreground">
          Location: {latitude.toFixed(6)}, {longitude.toFixed(6)}
        </div>
      )}
    </div>
  );
};

export default LocationSelector;
