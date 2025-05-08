
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { MapPin } from "lucide-react";

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
  // In a real app, we would integrate with a mapping/geocoding API
  // For now, we'll simulate geocoding by updating coordinates when the address changes
  const simulateGeocode = (address: string) => {
    // This is a simplified mock geocoder
    // In a real app, you'd use a service like Google Maps, Mapbox, etc.
    
    // Basic randomization to simulate different locations
    // For demo purposes only
    const baseLatitude = 37.7749; // San Francisco
    const baseLongitude = -122.4194;
    
    const randomLat = baseLatitude + (Math.random() - 0.5) * 0.1;
    const randomLng = baseLongitude + (Math.random() - 0.5) * 0.1;
    
    return { lat: randomLat, lng: randomLng };
  };
  
  const handleAddressChange = (value: string) => {
    setAddress(value);
    
    // Update coordinates when address changes
    if (value.length > 5) {
      const { lat, lng } = simulateGeocode(value);
      setLatitude(lat);
      setLongitude(lng);
    }
  };

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
          className={`pl-10 ${error ? "border-red-500" : ""}`}
          disabled={isLoading}
        />
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <p className="text-xs text-muted-foreground">
        This address will be shown to customers on the map
      </p>
    </div>
  );
};

export default LocationSelector;
