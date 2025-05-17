
import { useState, useEffect } from "react";
import { X, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { MenuItem } from "@/services/restaurantService";
import { MenuOptionGroup, fetchOptionGroupsWithOptions } from "@/services/menuOptionService";
import { OrderItem, OrderItemOption } from "@/services/orderService";

interface MenuItemDetailsProps {
  item: MenuItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddToCart: (item: OrderItem) => void;
}

const MenuItemDetails = ({ item, open, onOpenChange, onAddToCart }: MenuItemDetailsProps) => {
  const { toast } = useToast();
  const [optionGroups, setOptionGroups] = useState<MenuOptionGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  
  // For tracking selected options
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  
  // Reset everything when the dialog opens or item changes
  useEffect(() => {
    if (open && item) {
      setQuantity(1);
      setSelectedOptions({});
      loadOptionGroups();
    }
  }, [open, item]);
  
  const loadOptionGroups = async () => {
    if (!item) return;
    
    setIsLoading(true);
    try {
      const groups = await fetchOptionGroupsWithOptions(item.id);
      setOptionGroups(groups);
      
      // Initialize selected options
      const initialSelections: Record<string, string[]> = {};
      groups.forEach(group => {
        if (group.selection_type === 'single' && group.options && group.options.length > 0) {
          // Pre-select first option for required radio buttons
          if (group.required) {
            initialSelections[group.id] = [group.options[0].id];
          } else {
            initialSelections[group.id] = [];
          }
        } else {
          initialSelections[group.id] = [];
        }
      });
      
      setSelectedOptions(initialSelections);
    } catch (error) {
      console.error("Error loading option groups:", error);
      toast({
        title: "Error",
        description: "Could not load item options",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSingleOptionChange = (groupId: string, optionId: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [groupId]: [optionId]
    }));
  };
  
  const handleMultipleOptionChange = (groupId: string, optionId: string, checked: boolean) => {
    setSelectedOptions(prev => {
      const currentSelections = prev[groupId] || [];
      
      if (checked) {
        return {
          ...prev,
          [groupId]: [...currentSelections, optionId]
        };
      } else {
        return {
          ...prev,
          [groupId]: currentSelections.filter(id => id !== optionId)
        };
      }
    });
  };
  
  const increaseQuantity = () => setQuantity(prev => prev + 1);
  
  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };
  
  const calculateTotalPrice = () => {
    if (!item) return 0;
    
    let totalPrice = item.price;
    
    // Add price adjustments from selected options
    Object.entries(selectedOptions).forEach(([groupId, selectedOptionIds]) => {
      const group = optionGroups.find(g => g.id === groupId);
      if (!group || !group.options) return;
      
      selectedOptionIds.forEach(optionId => {
        const option = group.options?.find(o => o.id === optionId);
        if (option) {
          totalPrice += option.price_adjustment;
        }
      });
    });
    
    return totalPrice * quantity;
  };
  
  const validateSelections = () => {
    // Check if all required groups have selections
    const missingRequired = optionGroups.filter(group => {
      if (!group.required) return false;
      
      const selections = selectedOptions[group.id] || [];
      return selections.length === 0;
    });
    
    return missingRequired.length === 0;
  };
  
  const handleAddToCart = () => {
    if (!item) return;
    
    // Validate that all required options are selected
    if (!validateSelections()) {
      toast({
        title: "Required options",
        description: "Please select all required options",
        variant: "destructive",
      });
      return;
    }
    
    // Format the selected options
    const formattedOptions: OrderItemOption[] = optionGroups
      .filter(group => (selectedOptions[group.id] || []).length > 0)
      .map(group => {
        const selectedOptionIds = selectedOptions[group.id] || [];
        const selections = selectedOptionIds
          .map(optionId => {
            const option = group.options?.find(o => o.id === optionId);
            return option ? {
              name: option.name,
              priceAdjustment: option.price_adjustment
            } : null;
          })
          .filter(Boolean) as { name: string; priceAdjustment: number }[];
        
        return {
          groupName: group.name,
          selections
        };
      });
    
    const orderItem: OrderItem = {
      name: item.name,
      price: item.price,
      quantity,
      options: formattedOptions
    };
    
    onAddToCart(orderItem);
    onOpenChange(false);
    
    toast({
      description: `${item.name} added to cart`,
      duration: 2000,
    });
  };
  
  if (!item) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] p-0 h-[80vh] max-h-[600px] flex flex-col">
        <div className="relative h-40 bg-muted">
          <img
            src={item.image_url || '/placeholder.svg'}
            alt={item.name}
            className="w-full h-full object-cover"
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 rounded-full bg-black/50 text-white hover:bg-black/70"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="p-4 flex-1 overflow-hidden flex flex-col">
          <div>
            <h2 className="text-xl font-bold">{item.name}</h2>
            <p className="text-muted-foreground text-sm">{item.description}</p>
            <p className="mt-2 font-semibold">${item.price.toFixed(2)}</p>
          </div>
          
          <ScrollArea className="flex-1 my-4 pr-4">
            {isLoading ? (
              <p className="text-center py-4">Loading options...</p>
            ) : optionGroups.length > 0 ? (
              <div className="space-y-6">
                {optionGroups.map(group => (
                  <div key={group.id} className="space-y-3">
                    <div>
                      <h3 className="font-medium">{group.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {group.selection_type === 'single' ? 'Select one' : 'Select any'}
                        {group.required ? ' (Required)' : ' (Optional)'}
                      </p>
                    </div>
                    
                    {group.selection_type === 'single' ? (
                      <RadioGroup
                        value={selectedOptions[group.id]?.[0] || ""}
                        onValueChange={(value) => handleSingleOptionChange(group.id, value)}
                        className="space-y-2"
                      >
                        {group.options?.map(option => (
                          <div key={option.id} className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value={option.id} id={option.id} />
                              <Label htmlFor={option.id} className="cursor-pointer">
                                {option.name}
                              </Label>
                            </div>
                            {option.price_adjustment > 0 && (
                              <span className="text-sm">+${option.price_adjustment.toFixed(2)}</span>
                            )}
                          </div>
                        ))}
                      </RadioGroup>
                    ) : (
                      <div className="space-y-2">
                        {group.options?.map(option => (
                          <div key={option.id} className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={option.id}
                                checked={(selectedOptions[group.id] || []).includes(option.id)}
                                onCheckedChange={(checked) => 
                                  handleMultipleOptionChange(group.id, option.id, checked === true)
                                }
                              />
                              <Label htmlFor={option.id} className="cursor-pointer">
                                {option.name}
                              </Label>
                            </div>
                            {option.price_adjustment > 0 && (
                              <span className="text-sm">+${option.price_adjustment.toFixed(2)}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-4 text-muted-foreground">No customization options available</p>
            )}
          </ScrollArea>
          
          <div className="pt-4 border-t flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={decreaseQuantity}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center">{quantity}</span>
                <Button variant="outline" size="icon" onClick={increaseQuantity}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Button onClick={handleAddToCart} className="ml-auto">
                Add to cart - ${calculateTotalPrice().toFixed(2)}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MenuItemDetails;
