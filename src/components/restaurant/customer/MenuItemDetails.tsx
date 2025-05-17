
// Creating a stub file for MenuItemDetails.tsx to ensure compatibility
// with our fixes in RestaurantProfileView.tsx

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MinusCircle, PlusCircle } from "lucide-react";

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity?: number;
}

interface MenuItemOption {
  id: string;
  name: string;
  priceAdjustment: number;
}

interface MenuItemOptionGroup {
  id: string;
  name: string;
  required: boolean;
  selection_type: string;
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
  
  const increaseQuantity = () => setQuantity(prev => prev + 1);
  const decreaseQuantity = () => setQuantity(prev => Math.max(1, prev - 1));
  
  const handleAddToCart = () => {
    onAddToCart(item, quantity, selectedOptions);
  };

  return (
    <Dialog open={!!item} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{item.name}</DialogTitle>
        </DialogHeader>
        
        {item.image_url && (
          <div className="relative h-48 rounded-md overflow-hidden">
            <img 
              src={item.image_url} 
              alt={item.name} 
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <p className="text-sm text-muted-foreground">
          {item.description || "No description available."}
        </p>
        
        <div className="flex justify-between items-center">
          <span className="font-semibold text-lg">${item.price.toFixed(2)}</span>
          
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
