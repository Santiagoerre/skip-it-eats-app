
import { Label } from "@/components/ui/label";

interface RestaurantNameFieldProps {
  restaurantName: string;
  setRestaurantName: (name: string) => void;
  error?: string;
  isLoading: boolean;
}

const RestaurantNameField = ({
  restaurantName,
  setRestaurantName,
  error,
  isLoading
}: RestaurantNameFieldProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="restaurantName" className="block text-sm font-medium">
        Restaurant Name (Required)
      </Label>
      <input
        id="restaurantName"
        type="text"
        value={restaurantName}
        onChange={(e) => setRestaurantName(e.target.value)}
        className={`w-full p-2 border rounded-md ${error ? "border-red-500" : ""}`}
        disabled={isLoading}
      />
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
};

export default RestaurantNameField;
