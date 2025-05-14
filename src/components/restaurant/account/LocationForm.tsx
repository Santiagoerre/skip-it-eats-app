import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MapPin, Check, MapIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RestaurantLocation } from "@/services/restaurantService";
import { useToast } from "@/components/ui/use-toast";
import { 
  getAddressSuggestions, 
  getCoordinatesForAddress, 
  getAddressFromCoordinates 
} from "@/utils/geocoding";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface LocationFormProps {
  location: RestaurantLocation | null;
  address: string;
  onAddressChange: (value: string) => void;
  onCoordinatesChange?: (latitude: number, longitude: number) => void;
}

const LocationForm = ({ 
  location, 
  address, 
  onAddressChange,
  onCoordinatesChange 
}: LocationFormProps) => {
  const { toast } = useToast();
  const [isValidating, setIsValidating] = useState(false);
  const [isValidated, setIsValidated] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [currentLatitude, setCurrentLatitude] = useState(location?.latitude || 0);
  const [currentLongitude, setCurrentLongitude] = useState(location?.longitude || 0);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isMapDialogOpen, setIsMapDialogOpen] = useState(false);
  const [lastRequestTime, setLastRequestTime] = useState(0);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const leafletMarkerRef = useRef<L.Marker | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

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

  // Function to fetch address suggestions with debouncing
  const fetchAddressSuggestions = async (input: string) => {
    if (input.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
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
      toast({
        title: "Error fetching suggestions",
        description: "Could not retrieve address suggestions. Please try typing your full address.",
        variant: "destructive",
      });
    }
  };

  // Function to validate an address and get coordinates
  const validateAddress = async () => {
    if (!address || address.trim().length < 5) {
      setValidationError("Please enter a valid address");
      return;
    }

    setIsValidating(true);
    setIsValidated(false);
    setValidationError(null);
    
    try {
      const coordinates = await getCoordinatesForAddress(address);
      
      if (coordinates) {
        setCurrentLatitude(coordinates.lat);
        setCurrentLongitude(coordinates.lng);
        
        // Call the parent callback if provided
        if (onCoordinatesChange) {
          onCoordinatesChange(coordinates.lat, coordinates.lng);
        }
        
        setIsValidated(true);
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

  // Handle address input change with debouncing
  const handleAddressChange = (value: string) => {
    onAddressChange(value);
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
    onAddressChange(suggestion);
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

  // Initialize the Leaflet map when dialog opens
  useEffect(() => {
    if (!isMapDialogOpen || !mapContainerRef.current) return;

    // If we already have a map instance, clean it up
    if (leafletMapRef.current) {
      leafletMapRef.current.remove();
      leafletMapRef.current = null;
    }
    
    // Get the container and make sure it's ready
    const container = mapContainerRef.current;
    if (!container) return;
    
    // Set initial map center
    const initialLat = currentLatitude || 40.7128; // Default to NYC if no coordinates
    const initialLng = currentLongitude || -74.0060;
    
    try {
      // Create the map
      const map = L.map(container).setView([initialLat, initialLng], 13);
      leafletMapRef.current = map;
      
      // Add tile layer (OpenStreetMap)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);
      
      // Add a marker if we have coordinates
      if (currentLatitude !== 0 && currentLongitude !== 0) {
        const marker = L.marker([currentLatitude, currentLongitude], {
          draggable: true
        }).addTo(map);
        leafletMarkerRef.current = marker;
        
        // Handle marker drag events
        marker.on('dragend', async function(e) {
          const marker = e.target;
          const position = marker.getLatLng();
          const newLat = position.lat;
          const newLng = position.lng;
          
          setCurrentLatitude(newLat);
          setCurrentLongitude(newLng);
          
          // Call the parent callback if provided
          if (onCoordinatesChange) {
            onCoordinatesChange(newLat, newLng);
          }
          
          setIsValidated(true);
          
          // Get address from coordinates
          try {
            const newAddress = await getAddressFromCoordinates(newLat, newLng);
            if (newAddress) {
              onAddressChange(newAddress);
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
          
          setCurrentLatitude(newLat);
          setCurrentLongitude(newLng);
          
          // Call the parent callback if provided
          if (onCoordinatesChange) {
            onCoordinatesChange(newLat, newLng);
          }
          
          setIsValidated(true);
          
          // Get address from coordinates
          try {
            const newAddress = await getAddressFromCoordinates(newLat, newLng);
            if (newAddress) {
              onAddressChange(newAddress);
            }
          } catch (error) {
            console.error("Failed to get address from coordinates:", error);
          }
        });
      }
      
      // Handle map click events to move marker
      map.on('click', async function(e) {
        const newLat = e.latlng.lat;
        const newLng = e.latlng.lng;
        
        // Update our coordinates
        setCurrentLatitude(newLat);
        setCurrentLongitude(newLng);
        
        // Call the parent callback if provided
        if (onCoordinatesChange) {
          onCoordinatesChange(newLat, newLng);
        }
        
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
            const posLat = position.lat;
            const posLng = position.lng;
            
            setCurrentLatitude(posLat);
            setCurrentLongitude(posLng);
            
            // Call the parent callback if provided
            if (onCoordinatesChange) {
              onCoordinatesChange(posLat, posLng);
            }
            
            setIsValidated(true);
            
            // Get address from coordinates
            try {
              const newAddress = await getAddressFromCoordinates(posLat, posLng);
              if (newAddress) {
                onAddressChange(newAddress);
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
            onAddressChange(newAddress);
          }
        } catch (error) {
          console.error("Failed to get address from coordinates:", error);
        }
      });
      
      // Update map size when container becomes visible
      setTimeout(() => {
        if (leafletMapRef.current) {
          leafletMapRef.current.invalidateSize();
        }
      }, 100);
      
    } catch (error) {
      console.error("Error initializing map:", error);
      toast({
        title: "Map Error",
        description: "Failed to initialize the map. Please try again.",
        variant: "destructive",
      });
    }
    
    // Cleanup function
    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        leafletMarkerRef.current = null;
      }
    };
  }, [isMapDialogOpen, currentLatitude, currentLongitude, onCoordinatesChange, onAddressChange, toast]);

  // Function to update address from coordinates
  const updateAddressFromCoordinates = async (lat: number, lng: number) => {
    try {
      const newAddress = await getAddressFromCoordinates(lat, lng);
      if (newAddress) {
        onAddressChange(newAddress);
      }
    } catch (error) {
      console.error("Error getting address from coordinates:", error);
      // Non-blocking error
    }
  };

  // Check if already validated on mount
  useEffect(() => {
    if (location?.latitude && location?.longitude && !isValidated) {
      setIsValidated(true);
    }
  }, [location, isValidated]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" /> Location
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <div className="relative" ref={suggestionsRef}>
            <Input 
              id="address" 
              value={address} 
              onChange={(e) => handleAddressChange(e.target.value)}
              placeholder="Full restaurant address"
              className={validationError ? "border-red-500" : ""}
              autoComplete="off"
            />
            
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
          <div className="flex gap-2 mt-2">
            <Dialog open={isMapDialogOpen} onOpenChange={setIsMapDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <MapIcon className="h-4 w-4" />
                  <span>Choose on Map</span>
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
                  <div ref={mapContainerRef} className="w-full h-full" />
                </div>
              </DialogContent>
            </Dialog>
            
            <Button 
              type="button" 
              size="sm" 
              onClick={validateAddress}
              disabled={isValidating}
            >
              {isValidating ? "Validating..." : "Validate Address"}
            </Button>
          </div>
          
          {validationError && (
            <div className="text-red-500 text-sm">{validationError}</div>
          )}
          <p className="text-xs text-muted-foreground">
            This address will be shown to customers on the map
          </p>
        </div>
        
        {/* Success validation message */}
        {isValidated && (
          <Alert className="bg-green-50 border-green-200">
            <Check className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-700 text-sm">
              Address validated successfully.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Display coordinates if available */}
        {(currentLatitude !== 0 || currentLongitude !== 0) && (
          <div className="pt-2 border-t">
            <Label className="text-sm text-muted-foreground">Location Coordinates</Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <div>
                <Label htmlFor="latitude" className="text-xs">Latitude</Label>
                <Input 
                  id="latitude" 
                  value={currentLatitude.toFixed(6)} 
                  disabled 
                  className="bg-gray-50"
                />
              </div>
              <div>
                <Label htmlFor="longitude" className="text-xs">Longitude</Label>
                <Input 
                  id="longitude" 
                  value={currentLongitude.toFixed(6)} 
                  disabled 
                  className="bg-gray-50"
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LocationForm;
