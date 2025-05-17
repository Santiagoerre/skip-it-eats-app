
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MinusCircle, PlusCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity?: number;
}

interface MenuItemOption {
  id: string;
  name: string;
  price_adjustment: number;
  description?: string;
}

interface MenuItemOptionGroup {
  id: string;
  name: string;
  required: boolean;
  selection_type: string;
  description?: string;
  menu_options: MenuItemOption[];
}

interface MenuItemDetailsProps {
  item: {
    id: string;
    name: string;
    description?: string;
    price: number;
    image_url?: string;
    menu_option_groups?: MenuItemOptionGroup[];
  };
  onClose: () => void;
  onAddToCart: (item: OrderItem, quantity: number, selectedOptions: any[]) => void;
}

const MenuItemDetails: React.FC<MenuItemDetailsProps> = ({ 
  item, 
  onClose,
  onAddToCart 
}) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Initialize selected options structure when item changes
  useEffect(() => {
    if (item.menu_option_groups && item.menu_option_groups.length > 0) {
      const initialSelections = item.menu_option_groups.map(group => ({
        groupId: group.id,
        groupName: group.name,
        required: group.required,
        selectionType: group.selection_type,
        selections: []
      }));
      setSelectedOptions(initialSelections);
    } else {
      setSelectedOptions([]);
    }
  }, [item]);
  
  const increaseQuantity = () => setQuantity(prev => prev + 1);
  const decreaseQuantity = () => setQuantity(prev => Math.max(1, prev - 1));
  
  // Calculate total price including selected options
  const calculateTotalPrice = () => {
    let totalPrice = item.price;
    
    if (selectedOptions.length > 0) {
      selectedOptions.forEach(group => {
        if (group.selections.length > 0) {
          group.selections.forEach(selection => {
            totalPrice += selection.priceAdjustment;
          });
        }
      });
    }
    
    return totalPrice;
  };
  
  // Handle radio option selection (single select)
  const handleRadioOptionSelect = (groupIndex: number, option: MenuItemOption) => {
    const updatedOptions = [...selectedOptions];
    
    // For radio buttons, replace any existing selection
    updatedOptions[groupIndex].selections = [{
      id: option.id,
      name: option.name,
      priceAdjustment: option.price_adjustment
    }];
    
    setSelectedOptions(updatedOptions);
    setErrorMessage(null);
  };
  
  // Handle checkbox option selection (multi-select)
  const handleCheckboxOptionSelect = (groupIndex: number, option: MenuItemOption, isChecked: boolean) => {
    const updatedOptions = [...selectedOptions];
    
    if (isChecked) {
      // Add the option
      updatedOptions[groupIndex].selections.push({
        id: option.id,
        name: option.name,
        priceAdjustment: option.price_adjustment
      });
    } else {
      // Remove the option
      updatedOptions[groupIndex].selections = updatedOptions[groupIndex].selections.filter(
        selection => selection.id !== option.id
      );
    }
    
    setSelectedOptions(updatedOptions);
    setErrorMessage(null);
  };
  
  // Check if an option is selected (for checkbox rendering)
  const isOptionSelected = (groupIndex: number, optionId: string) => {
    if (!selectedOptions[groupIndex]) return false;
    
    return selectedOptions[groupIndex].selections.some(
      (selection: any) => selection.id === optionId
    );
  };
  
  const handleAddToCart = () => {
    // Validate required options are selected
    if (item.menu_option_groups) {
      const missingRequiredGroup = item.menu_option_groups.findIndex((group, index) => 
        group.required && 
        (!selectedOptions[index] || selectedOptions[index].selections.length === 0)
      );
      
      if (missingRequiredGroup !== -1) {
        setErrorMessage(`Please select an option for "${item.menu_option_groups[missingRequiredGroup].name}"`);
        return;
      }
    }
    
    onAddToCart(item, quantity, selectedOptions);
  };
  
  return (
    <Dialog open={!!item} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{item.name}</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 max-h-[calc(90vh-12rem)]">
          {item.image_url && (
            <div className="relative h-48 rounded-md overflow-hidden mb-4">
              <img 
                src={item.image_url} 
                alt={item.name} 
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <p className="text-sm text-muted-foreground mb-4">
            {item.description || "No description available."}
          </p>
          
          {errorMessage && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          
          {/* Options Groups */}
          {item.menu_option_groups && item.menu_option_groups.length > 0 && (
            <div className="space-y-6 my-4">
              {item.menu_option_groups.map((group, groupIndex) => (
                <div key={group.id} className="space-y-2">
                  <h3 className="font-medium">
                    {group.name}
                    {group.required && <span className="text-red-500 ml-1">*</span>}
                  </h3>
                  
                  {group.description && (
                    <p className="text-sm text-muted-foreground">{group.description}</p>
                  )}
                  
                  {group.selection_type === 'single' ? (
                    // Radio buttons for single selection
                    <RadioGroup
                      className="space-y-2 mt-2"
                      value={selectedOptions[groupIndex]?.selections[0]?.id || ""}
                      onValueChange={(value) => {
                        const option = group.menu_options.find(o => o.id === value);
                        if (option) handleRadioOptionSelect(groupIndex, option);
                      }}
                    >
                      {group.menu_options.map(option => (
                        <div key={option.id} className="flex items-center space-x-2 rounded-md border p-2">
                          <RadioGroupItem value={option.id} id={`radio-${option.id}`} />
                          <Label htmlFor={`radio-${option.id}`} className="flex-1 cursor-pointer">
                            <div className="flex justify-between items-center w-full">
                              <span>{option.name}</span>
                              {option.price_adjustment > 0 && (
                                <span className="text-muted-foreground">
                                  +${option.price_adjustment.toFixed(2)}
                                </span>
                              )}
                            </div>
                            {option.description && (
                              <p className="text-sm text-muted-foreground">{option.description}</p>
                            )}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  ) : (
                    // Checkboxes for multiple selection
                    <div className="space-y-2 mt-2">
                      {group.menu_options.map(option => (
                        <div key={option.id} className="flex items-center space-x-2 rounded-md border p-2">
                          <Checkbox 
                            id={`checkbox-${option.id}`}
                            checked={isOptionSelected(groupIndex, option.id)}
                            onCheckedChange={(checked) => 
                              handleCheckboxOptionSelect(groupIndex, option, !!checked)
                            }
                          />
                          <Label htmlFor={`checkbox-${option.id}`} className="flex-1 cursor-pointer">
                            <div className="flex justify-between items-center w-full">
                              <span>{option.name}</span>
                              {option.price_adjustment > 0 && (
                                <span className="text-muted-foreground">
                                  +${option.price_adjustment.toFixed(2)}
                                </span>
                              )}
                            </div>
                            {option.description && (
                              <p className="text-sm text-muted-foreground">{option.description}</p>
                            )}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        <div className="mt-2">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-lg">${calculateTotalPrice().toFixed(2)}</span>
            
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-full h-8 w-8"
                onClick={decreaseQuantity}
              >
                <MinusCircle className="h-4 w-4" />
              </Button>
              <span className="w-6 text-center">{quantity}</span>
              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-full h-8 w-8"
                onClick={increaseQuantity}
              >
                <PlusCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        <Separator />
        
        <div className="mt-2">
          <Button onClick={handleAddToCart} className="w-full">
            Add to cart
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MenuItemDetails;
