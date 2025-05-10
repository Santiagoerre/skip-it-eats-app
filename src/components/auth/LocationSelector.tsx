
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
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // Function to safely fetch address suggestions with error handling
  const fetchAddressSuggestions = async (input: string) => {
    if (input.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      console.log(`Fetching address suggestions for: ${input}`);
      
      // Using Nominatim OpenStreetMap API with proper user agent and retry mechanism
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(input)}&limit=5`,
        {
          headers: {
            "Accept-Language": "en-US,en",
            "User-Agent": "SkipItApp/1.0" // Adding a User-Agent header to comply with Nominatim's ToS
          },
          mode: 'cors', // Explicitly setting CORS mode
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          const addresses = data.map((item: any) => item.display_name);
          setSuggestions(addresses);
          setShowSuggestions(true);
          console.log(`Found ${addresses.length} suggestions`);
        } else {
          console.warn("Received data is not an array:", data);
          setSuggestions([]);
        }
      } else {
        console.error("Error fetching address suggestions, status:", response.status);
        setSuggestions([]);
      }
    } catch (error) {
      console.error("Error fetching address suggestions:", error);
      setSuggestions([]);
    }
  };

  // Function to validate an address and get coordinates with better error handling
  const validateAddress = async (addressToValidate: string) => {
    if (!addressToValidate || addressToValidate.trim().length === 0) {
      setValidationError("Please enter an address");
      return;
    }
    
    setIsValidating(true);
    setIsValidated(false);
    setValidationError(null);
    
    try {
      if (addressToValidate.length < 5) {
        throw new Error("Address is too short to be valid");
      }
      
      console.log(`Validating address: ${addressToValidate}`);
      
      // Using Nominatim OpenStreetMap API with proper user agent
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressToValidate)}&limit=1`,
        {
          headers: {
            "Accept-Language": "en-US,en",
            "User-Agent": "SkipItApp/1.0" // Adding a User-Agent header to comply with Nominatim's ToS
          },
          mode: 'cors', // Explicitly setting CORS mode
        }
      );
      
      if (!response.ok) {
        throw new Error(`Network error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (Array.isArray(data) && data.length > 0) {
        const newLat = parseFloat(data[0].lat);
        const newLng = parseFloat(data[0].lon);
        
        if (isNaN(newLat) || isNaN(newLng)) {
          throw new Error("Invalid coordinates returned from geocoding service");
        }
        
        setLatitude(newLat);
        setLongitude(newLng);
        setIsValidated(true);
        console.log("Address validated successfully:", { address: addressToValidate, latitude: newLat, longitude: newLng });
      } else {
        throw new Error("Could not find coordinates for this address");
      }
    } catch (error) {
      console.error("Error validating address:", error);
      setValidationError(error instanceof Error ? error.message : "Failed to validate address. Please try again later.");
    } finally {
      setIsValidating(false);
    }
  };

  // Handle address input change
  const handleAddressChange = (value: string) => {
    setAddress(value);
    setIsValidated(false);
    fetchAddressSuggestions(value);
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

    const loadMap = async () => {
      try {
        const mapContainer = mapContainerRef.current;
        if (!mapContainer) return;
        
        // Clear previous content
        mapContainer.innerHTML = '';
        
        // Create map container
        const mapElement = document.createElement('div');
        mapElement.className = 'w-full h-full bg-gray-100 relative';
        mapContainer.appendChild(mapElement);
        
        // If we have coordinates, show a marker
        if (latitude && longitude) {
          const marker = document.createElement('div');
          marker.className = 'absolute z-10 transform -translate-x-1/2 -translate-y-1/2';
          marker.style.left = '50%';
          marker.style.top = '50%';
          marker.innerHTML = `<svg class="h-6 w-6 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>`;
          
          mapElement.appendChild(marker);
          
          // Show coordinates
          const coordInfo = document.createElement('div');
          coordInfo.className = 'absolute bottom-2 left-2 bg-white p-2 rounded shadow-sm text-xs';
          coordInfo.textContent = `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`;
          mapElement.appendChild(coordInfo);
        }
        
        // Create a simple instructions overlay
        const instructions = document.createElement('div');
        instructions.className = 'absolute top-2 left-2 right-2 bg-white p-2 rounded text-center text-sm';
        instructions.textContent = 'Click anywhere on the map to set your location';
        mapElement.appendChild(instructions);
        
        // Handle click on map
        mapElement.addEventListener('click', (e) => {
          if (e.target === instructions) return; // Don't trigger when clicking on instructions
          
          // This is a simplified map - in a real app with libraries like Leaflet or Google Maps
          // you would convert click coordinates to lat/lng
          // For this demo we'll simulate by generating coordinates around a center point
          
          // Use existing coordinates as center or default to San Francisco
          const centerLat = latitude || 37.7749;
          const centerLng = longitude || -122.4194;
          
          // Calculate relative position in the container to adjust coordinates
          const rect = mapElement.getBoundingClientRect();
          const relX = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
          const relY = (e.clientY - rect.top) / rect.height - 0.5; // -0.5 to 0.5
          
          // Generate new coordinates (simulate a real map)
          const newLat = centerLat - relY * 0.2; // Increase multiplier for bigger coordinate changes
          const newLng = centerLng + relX * 0.4;
          
          setLatitude(newLat);
          setLongitude(newLng);
          setIsValidated(true);
          
          // Reload the map with new marker
          loadMap();
        });
      } catch (error) {
        console.error("Error loading map:", error);
      }
    };
    
    loadMap();
  }, [isMapDialogOpen, latitude, longitude]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.suggestions-container')) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Check if already validated on mount
  useEffect(() => {
    if (latitude && longitude && address && !isValidated) {
      setIsValidated(true);
    }
  }, []);

  return (
    <div className="space-y-2">
      <Label htmlFor="address">Restaurant Address (Required)</Label>
      <div className="relative suggestions-container">
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
        
        {/* Address suggestions dropdown - Made clickable */}
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
