
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MenuItem, createMenuItem, updateMenuItem } from "@/services/restaurantService";

interface MenuItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: MenuItem | null; // null for new item, object for editing
  onSave: () => void;
}

// Common food categories
const CATEGORIES = [
  "Appetizers",
  "Salads",
  "Soups",
  "Main Courses",
  "Burgers",
  "Sandwiches",
  "Pizza",
  "Pasta",
  "Sides",
  "Desserts",
  "Beverages",
  "Breakfast",
  "Lunch Specials",
  "Dinner Specials",
  "Vegetarian",
  "Vegan",
  "Gluten Free",
  "Kids Menu",
  "Other"
];

const MenuItemDialog = ({ open, onOpenChange, item, onSave }: MenuItemDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Main Courses");
  const [customCategory, setCustomCategory] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (item) {
      setName(item.name);
      setDescription(item.description || "");
      setPrice(item.price.toString());
      setCategory(item.category || "Other");
    } else {
      // Clear form for new item
      setName("");
      setDescription("");
      setPrice("");
      setCategory("Main Courses");
      setCustomCategory("");
    }
    setErrors({});
  }, [item, open]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) {
      newErrors.name = "Name is required";
    }
    
    if (!price.trim()) {
      newErrors.price = "Price is required";
    } else if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      newErrors.price = "Price must be a valid number greater than 0";
    }
    
    if (category === "Other" && !customCategory.trim()) {
      newErrors.category = "Custom category is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !user?.id) return;
    
    setIsSubmitting(true);
    
    try {
      const finalCategory = category === "Other" ? customCategory : category;
      const itemData = {
        restaurant_id: user.id,
        name,
        description: description || null,
        price: parseFloat(price),
        category: finalCategory,
        image_url: null, // Will implement image upload in future
      };
      
      if (item) {
        // Update existing item
        await updateMenuItem(item.id, itemData);
        toast({
          title: "Menu item updated",
          description: "The menu item has been updated successfully.",
        });
      } else {
        // Create new item
        await createMenuItem(itemData);
        toast({
          title: "Menu item added",
          description: "The new menu item has been added to your menu.",
        });
      }
      
      onSave();
    } catch (error) {
      console.error("Error saving menu item:", error);
      toast({
        title: "Error saving item",
        description: "Could not save the menu item. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{item ? "Edit Menu Item" : "Add Menu Item"}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Item Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Margherita Pizza"
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your menu item..."
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="price">Price ($)</Label>
            <Input
              id="price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="9.99"
              type="number"
              step="0.01"
              min="0"
              className={errors.price ? "border-red-500" : ""}
            />
            {errors.price && <p className="text-red-500 text-sm">{errors.price}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className={errors.category ? "border-red-500" : ""}>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {category === "Other" && (
              <Input
                placeholder="Enter custom category"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="mt-2"
              />
            )}
            {errors.category && <p className="text-red-500 text-sm">{errors.category}</p>}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : item ? "Update Item" : "Add Item"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MenuItemDialog;
