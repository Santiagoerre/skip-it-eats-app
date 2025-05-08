
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";
import { Restaurant } from "@/services/restaurantService";

interface ProfileFormProps {
  restaurant: Restaurant | null;
  isSaving: boolean;
  name: string;
  cuisine: string;
  priceRange: string;
  description: string;
  onNameChange: (value: string) => void;
  onCuisineChange: (value: string) => void;
  onPriceRangeChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
}

const ProfileForm = ({
  restaurant,
  isSaving,
  name,
  cuisine,
  priceRange,
  description,
  onNameChange,
  onCuisineChange,
  onPriceRangeChange,
  onDescriptionChange
}: ProfileFormProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" /> Restaurant Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Restaurant Name</Label>
          <Input 
            id="name" 
            value={name} 
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Your restaurant name"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="cuisine">Cuisine Type</Label>
          <Input 
            id="cuisine" 
            value={cuisine} 
            onChange={(e) => onCuisineChange(e.target.value)}
            placeholder="e.g., Italian, Indian, American"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="priceRange">Price Range</Label>
          <select
            id="priceRange"
            value={priceRange}
            onChange={(e) => onPriceRangeChange(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="$">$ (Budget)</option>
            <option value="$$">$$ (Moderate)</option>
            <option value="$$$">$$$ (Expensive)</option>
            <option value="$$$$">$$$$ (Very Expensive)</option>
          </select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea 
            id="description" 
            value={description} 
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Tell customers about your restaurant"
            rows={4}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileForm;
