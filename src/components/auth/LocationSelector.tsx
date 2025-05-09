
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { MapPin, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

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

  // Function to get address suggestions based on input
  const fetchAddressSuggestions = async (input: string) => {
    if (input.length < 3) {
      setSuggestions([]);
      return;
    }

    // In a real implementation, this would call a geocoding API
    // For demonstration, we'll simulate with some example addresses
    const mockSuggestions = [
      `${input}, New York, NY`,
      `${input}, Los Angeles, CA`,
      `${input}, Chicago, IL`,
      `${input}, Houston, TX`,
      `${input}, Phoenix, AZ`,
    ].filter(suggestion => 
      suggestion.toLowerCase().includes(input.toLowerCase())
    ).slice(0, 5);
    
    setSuggestions(mockSuggestions);
  };

  // Function to validate an address and get coordinates
  const validateAddress = async (addressToValidate: string) => {
    setIsValidating(true);
    setIsValidated(false);
    setValidationError(null);
    
    try {
      // In a real implementation, this would call a geocoding API
      // For now, we'll simulate with a delay and random coordinates
      await new Promise(resolve => setTimeout(resolve, 800));
      
      if (addressToValidate.length < 10) {
        throw new Error("Address is too short to be valid");
      }
      
      // Generate realistic-looking coordinates
      const baseLat = 37.7749; // San Francisco
      const baseLng = -122.4194;
      
      // Create small random offset for demo purposes
      const latOffset = (Math.random() - 0.5) * 0.2;
      const lngOffset = (Math.random() - 0.5) * 0.2;
      
      const newLat = baseLat + latOffset;
      const newLng = baseLng + lngOffset;
      
      setLatitude(newLat);
      setLongitude(newLng);
      setIsValidated(true);
      console.log("Address validated successfully:", { address: addressToValidate, latitude: newLat, longitude: newLng });
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
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="absolute right-2 top-1/2 transform -translate-y-1/2"
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
