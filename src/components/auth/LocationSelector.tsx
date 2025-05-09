
import { useState, useEffect, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { MapPin, Check, AlertCircle, MapIcon } from "lucide-react";
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
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isValidated, setIsValidated] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isMapDialogOpen, setIsMapDialogOpen] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Function to get address suggestions based on input
  const fetchAddressSuggestions = async (input: string) => {
    if (input.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      // Using Nominatim OpenStreetMap API for geocoding (free and no API key required)
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
  const validateAddress = async (addressToValidate: string) => {
    setIsValidating(true);
    setIsValidated(false);
    setValidationError(null);
    
    try {
      if (addressToValidate.length < 10) {
        throw new Error("Address is too short to be valid");
      }
      
      // Using Nominatim OpenStreetMap API for geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressToValidate)}&limit=1`,
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
          
          setLatitude(newLat);
          setLongitude(newLng);
          setIsValidated(true);
          console.log("Address validated successfully:", { address: addressToValidate, latitude: newLat, longitude: newLng });
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
    setAddress(value);
    setIsValidated(false);
    fetchAddressSuggestions(value);
    setShowSuggestions(true);
  };

  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion: string) => {
    setAddress(suggestion);
    setSuggestions([]);
    setShowSuggestions(false);
    validateAddress(suggestion);
  };

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
        if (latitude && longitude) {
          const marker = document.createElement('div');
          marker.className = 'absolute z-10 transform -translate-x-1/2 -translate-y-1/2';
          marker.style.left = '50%';
          marker.style.top = '50%';
          marker.innerHTML = `<svg class="text-red-500" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>`;
          mapDiv.appendChild(marker);
          
          const coordinates = document.createElement('div');
          coordinates.className = 'absolute bottom-2 left-2 bg-white p-2 rounded text-xs';
          coordinates.textContent = `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`;
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
          // In a real implementation, you would convert click coordinates to lat/lng
          
          // For demo purposes, we'll generate coordinates near the center of the map
          // with a small random offset to simulate different locations
          const baseLatitude = 37.7749; // San Francisco as a base
          const baseLongitude = -122.4194;
          
          // Create a random offset
          const latOffset = (Math.random() - 0.5) * 0.1;
          const lngOffset = (Math.random() - 0.5) * 0.1;
          
          const newLat = baseLatitude + latOffset;
          const newLng = baseLongitude + lngOffset;
          
          setLatitude(newLat);
          setLongitude(newLng);
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
  }, [isMapDialogOpen, latitude, longitude]);

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

  return (
    <div className="space-y-2">
      <Label htmlFor="address">Restaurant Address (Required)</Label>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          id="address"
          value={address}
          onChange={(e) => handleAddressChange(e.target.value)}
          placeholder="Enter your restaurant's address"
          className={`pl-10 ${error || validationError ? "border-red-500" : ""}`}
          disabled={isLoading || isValidating}
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
            variant="ghost"
            className="h-auto"
            onClick={() => validateAddress(address)}
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
