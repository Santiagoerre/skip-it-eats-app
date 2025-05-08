
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const foodTypes = [
  "American", "Chinese", "Italian", "Mexican", "Japanese", 
  "Indian", "Thai", "Mediterranean", "Fast Food", "Breakfast",
  "Vegetarian", "Vegan", "Seafood", "BBQ", "Dessert", "Other"
];

interface FoodTypeSelectorProps {
  foodType: string;
  setFoodType: (foodType: string) => void;
  error?: string;
  isLoading: boolean;
}

const FoodTypeSelector = ({
  foodType,
  setFoodType,
  error,
  isLoading
}: FoodTypeSelectorProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="foodType">Food Type (Required)</Label>
      <Select 
        value={foodType} 
        onValueChange={setFoodType}
        disabled={isLoading}
      >
        <SelectTrigger className={error ? "border-red-500" : ""}>
          <SelectValue placeholder="Select food type" />
        </SelectTrigger>
        <SelectContent>
          {foodTypes.map((type) => (
            <SelectItem key={type} value={type}>{type}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
};

export default FoodTypeSelector;
