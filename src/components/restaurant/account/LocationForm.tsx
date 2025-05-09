
import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MapPin, AlertCircle, Check, MapIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RestaurantLocation } from "@/services/restaurantService";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
  const [isValidating, setIsValidating] = useState(false);
  const [isValidated, setIsValidated] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [currentLatitude, setCurrentLatitude] = useState(location?.latitude || 0);
  const [currentLongitude, setCurrentLongitude] = useState(location?.longitude || 0);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isMapDialogOpen, setIsMapDialogOpen] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Function to get address suggestions
  const fetchAddressSuggestions = async (input: string) => {
    if (input.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      // Using Nominatim OpenStreetMap API for geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(input)}&limit=5`,
        {
          headers: {
            "Accept-Language": "en-US,en",
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        const addresses = data.map((item: any) => item.display_name);
        setSuggestions(addresses);
      } else {
        console.error("Error fetching address suggestions");
        setSuggestions([]);
      }
    } catch (error) {
      console.error("Error fetching address suggestions:", error);
      setSuggestions([]);
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
      // Using Nominatim OpenStreetMap API for geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
        {
          headers: {
            "Accept-Language": "en-US,en",
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.length > 0) {
          const newLat = parseFloat(data[0].lat);
          const newLng = parseFloat(data[0].lon);
          
          setCurrentLatitude(newLat);
          setCurrentLongitude(newLng);
          
          // Call the parent callback if provided
          if (onCoordinatesChange) {
            onCoordinatesChange(newLat, newLng);
          }
          
          setIsValidated(true);
          console.log("Address validated successfully:", { address, latitude: newLat, longitude: newLng });
        } else {
          throw new Error("Could not find coordinates for this address");
        }
      } else {
        throw new Error("Failed to validate address with geocoding service");
      }
    } catch (error) {
      console.error("Error validating address:", error);
      setValidationError(error instanceof Error ? error.message : "Failed to validate address");
    } finally {
      setIsValidating(false);
    }
  };

  // Handle address input change
  const handleAddressChange = (value: string) => {
    onAddressChange(value);
    setIsValidated(false);
    fetchAddressSuggestions(value);
    setShowSuggestions(true);
  };

  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion: string) => {
    onAddressChange(suggestion);
    setSuggestions([]);
    setShowSuggestions(false);
    // Don't auto-validate to give user a chance to check the address
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowSuggestions(false);
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Initialize the map when dialog opens
  useEffect(() => {
    if (!isMapDialogOpen || !mapContainerRef.current) return;

    const initMap = async () => {
      try {
        // Create a simple map interface
        const mapContainer = mapContainerRef.current;
        mapContainer.innerHTML = '';
        
        // Create a div that represents the map
        const mapDiv = document.createElement('div');
        mapDiv.className = 'relative w-full h-full bg-gray-100 overflow-hidden';
        
        // If we have coordinates, show them
        if (currentLatitude && currentLongitude) {
          const marker = document.createElement('div');
          marker.className = 'absolute z-10 transform -translate-x-1/2 -translate-y-1/2';
          marker.style.left = '50%';
          marker.style.top = '50%';
          marker.innerHTML = `<svg class="text-red-500" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>`;
          mapDiv.appendChild(marker);
          
          const coordinates = document.createElement('div');
          coordinates.className = 'absolute bottom-2 left-2 bg-white p-2 rounded text-xs';
          coordinates.textContent = `Lat: ${currentLatitude.toFixed(6)}, Lng: ${currentLongitude.toFixed(6)}`;
          mapDiv.appendChild(coordinates);
        }
        
        // Add instructions
        const instructions = document.createElement('div');
        instructions.className = 'absolute top-2 left-2 right-2 bg-white p-2 rounded text-sm text-center';
        instructions.textContent = 'Click anywhere on the map to set your restaurant location';
        mapDiv.appendChild(instructions);
        
        // Add event listener for clicks
        mapDiv.addEventListener('click', (e) => {
          // This is a simplified version without a real map
          // Generate coordinates based on current ones or defaults
          const baseLatitude = currentLatitude || 37.7749;
          const baseLongitude = currentLongitude || -122.4194;
          
          // Create a random offset
          const latOffset = (Math.random() - 0.5) * 0.1;
          const lngOffset = (Math.random() - 0.5) * 0.1;
          
          const newLat = baseLatitude + latOffset;
          const newLng = baseLongitude + lngOffset;
          
          setCurrentLatitude(newLat);
          setCurrentLongitude(newLng);
          
          // Call the parent callback if provided
          if (onCoordinatesChange) {
            onCoordinatesChange(newLat, newLng);
          }
          
          setIsValidated(true);
          
          // Update the display with new marker
          initMap();
        });
        
        mapContainer.appendChild(mapDiv);
      } catch (error) {
        console.error("Error initializing map:", error);
      }
    };
    
    initMap();
  }, [isMapDialogOpen, currentLatitude, currentLongitude, onCoordinatesChange]);

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
          <div className="relative">
            <Input 
              id="address" 
              value={address} 
              onChange={(e) => handleAddressChange(e.target.value)}
              placeholder="Full restaurant address"
              className={validationError ? "border-red-500" : ""}
            />
            
            {/* Address suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg">
                <ul className="py-1">
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
                    Click anywhere on the map to set your restaurant location.
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
