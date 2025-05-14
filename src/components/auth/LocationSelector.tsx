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
import { useToast } from "@/components/ui/use-toast";

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
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

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
      console.log(`Fetching address suggestions for: ${input}`);
      
      // Using Nominatim OpenStreetMap API with proper headers
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(input)}&limit=5`,
        {
          headers: {
            "Accept-Language": "en-US,en",
            "User-Agent": "SkipItApp/1.0" // Adding a User-Agent header to comply with Nominatim's ToS
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          const addresses = data.map((item: any) => item.display_name);
          setSuggestions(addresses);
          setShowSuggestions(addresses.length > 0);
          
          // Cache the results
          suggestionCache.set(input, addresses);
          
          console.log(`Found ${addresses.length} suggestions`);
        } else {
          console.warn("Received data is not an array:", data);
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } else {
        console.error("Error fetching address suggestions, status:", response.status);
        setSuggestions([]);
        setShowSuggestions(false);
        toast({
          title: "Error fetching suggestions",
          description: `Server responded with status ${response.status}`,
          variant: "destructive",
        });
      }
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
      
      // Using Nominatim OpenStreetMap API with proper headers
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
        {
          headers: {
            "Accept-Language": "en-US,en",
            "User-Agent": "SkipItApp/1.0" // Adding a User-Agent header
          }
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
        console.log("Address validated successfully:", { address, latitude: newLat, longitude: newLng });
        
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
        
        // Center coordinates (use existing or default to a central location)
        const centerLat = latitude || 40.7128; // Default to New York
        const centerLng = longitude || -74.0060;
        
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
          
          // Attempt to reverse geocode the new coordinates
          fetchAddressFromCoordinates(newLat, newLng);
          
          // Reload the map with new marker
          loadMap();
        });
      } catch (error) {
        console.error("Error loading map:", error);
        toast({
          title: "Map Error",
          description: "Could not load the map. Please try again.",
          variant: "destructive",
        });
      }
    };
    
    loadMap();
  }, [isMapDialogOpen, latitude, longitude, toast]);

  // Function to get address from coordinates (reverse geocoding)
  const fetchAddressFromCoordinates = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            "Accept-Language": "en-US,en",
            "User-Agent": "SkipItApp/1.0"
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Network error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.display_name) {
        setAddress(data.display_name);
      } else {
        console.warn("Could not reverse geocode the coordinates");
      }
    } catch (error) {
      console.error("Error reverse geocoding:", error);
      // Non-blocking error, we'll still keep the coordinates
    }
  };

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
