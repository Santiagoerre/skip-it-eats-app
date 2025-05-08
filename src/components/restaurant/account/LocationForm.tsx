
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin } from "lucide-react";
import { RestaurantLocation } from "@/services/restaurantService";

interface LocationFormProps {
  location: RestaurantLocation | null;
  address: string;
  onAddressChange: (value: string) => void;
}

const LocationForm = ({ location, address, onAddressChange }: LocationFormProps) => {
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
          <Input 
            id="address" 
            value={address} 
            onChange={(e) => onAddressChange(e.target.value)}
            placeholder="Full restaurant address"
          />
          <p className="text-xs text-muted-foreground">
            This address will be shown to customers on the map
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default LocationForm;
