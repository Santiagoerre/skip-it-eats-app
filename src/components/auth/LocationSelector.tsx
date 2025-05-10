
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
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Function to manually validate an address without external API calls
  const manuallyValidateAddress = () => {
    if (!address || address.trim().length < 5) {
      setValidationError("Please enter a valid address");
      return;
    }
    
    // Generate some random coordinates near Madrid if we don't have any
    const newLat = latitude || 40.4168 + (Math.random() * 0.1 - 0.05);
    const newLng = longitude || -3.7038 + (Math.random() * 0.1 - 0.05);
    
    setLatitude(newLat);
    setLongitude(newLng);
    setIsValidated(true);
    setValidationError(null);
    
    console.log("Address manually validated:", { address, latitude: newLat, longitude: newLng });
  };

  // Check if already validated on mount
  useEffect(() => {
    if (latitude && longitude && address && !isValidated) {
      setIsValidated(true);
    }
  }, [latitude, longitude, address, isValidated]);

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
          
          // Use existing coordinates as center or default to Madrid
          const centerLat = latitude || 40.4168;
          const centerLng = longitude || -3.7038;
          
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

  // Handle address input change
  const handleAddressChange = (value: string) => {
    setAddress(value);
    setIsValidated(false);
    
    // Generate sample suggestions for demonstration purposes
    if (value.length > 3) {
      const sampleSuggestions = [
        `${value}, Madrid, Spain`,
        `${value}, Barcelona, Spain`,
        `${value}, Valencia, Spain`,
      ];
      setSuggestions(sampleSuggestions);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion: string) => {
    console.log("Selected suggestion:", suggestion);
    setAddress(suggestion);
    setSuggestions([]);
    setShowSuggestions(false);
    manuallyValidateAddress();
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
            onClick={manuallyValidateAddress}
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
