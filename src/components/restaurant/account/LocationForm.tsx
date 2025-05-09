
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MapPin, AlertCircle, Check } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RestaurantLocation } from "@/services/restaurantService";

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
      // In a real implementation, this would call a geocoding API
      // For now, we'll simulate with a delay and random coordinates
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Generate realistic-looking coordinates or use existing ones with small change
      const baseLat = location?.latitude || 37.7749;
      const baseLng = location?.longitude || -122.4194;
      
      // Create small random offset for demo purposes
      const latOffset = (Math.random() - 0.5) * 0.01;
      const lngOffset = (Math.random() - 0.5) * 0.01;
      
      const newLat = baseLat + latOffset;
      const newLng = baseLng + lngOffset;
      
      setCurrentLatitude(newLat);
      setCurrentLongitude(newLng);
      
      // Call the parent callback if provided
      if (onCoordinatesChange) {
        onCoordinatesChange(newLat, newLng);
      }
      
      setIsValidated(true);
      console.log("Address validated successfully:", { address, latitude: newLat, longitude: newLng });
    } catch (error) {
      console.error("Error validating address:", error);
      setValidationError(error instanceof Error ? error.message : "Failed to validate address");
    } finally {
      setIsValidating(false);
    }
  };

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
          <div className="flex gap-2">
            <Input 
              id="address" 
              value={address} 
              onChange={(e) => {
                onAddressChange(e.target.value);
                setIsValidated(false);
              }}
              placeholder="Full restaurant address"
              className={validationError ? "border-red-500" : ""}
            />
            <Button 
              type="button" 
              size="sm" 
              onClick={validateAddress}
              disabled={isValidating}
            >
              {isValidating ? "Validating..." : "Validate"}
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
