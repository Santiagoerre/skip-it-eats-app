
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { useNavigate } from "react-router-dom";
import OrderDialog from "./OrderDialog";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  options?: Array<{
    groupName: string;
    selections: Array<{
      name: string;
      priceAdjustment: number;
    }>;
  }>;
}

interface CartSummaryProps {
  items: CartItem[];
  total: number;
  restaurantId: string;
  restaurantName: string;
  onClearCart: () => void;
}

const CartSummary = ({
  items,
  total,
  restaurantId,
  restaurantName,
  onClearCart
}: CartSummaryProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  
  const handleCheckout = () => {
    if (!user) {
      navigate('/signin?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }
    
    setIsOrderDialogOpen(true);
  };
  
  const handleOrderSuccess = () => {
    onClearCart();
    navigate('/orders');
  };
  
  if (items.length === 0) {
    return null;
  }
  
  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 z-10">
        <div className="mobile-container">
          <div className="flex justify-between items-center mb-2">
            <div>
              <span className="text-sm text-muted-foreground">
                {items.reduce((sum, item) => sum + item.quantity, 0)} items
              </span>
              <h3 className="font-medium">${total.toFixed(2)}</h3>
            </div>
            <Button onClick={handleCheckout}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Checkout
            </Button>
          </div>
        </div>
      </div>
      
      <OrderDialog
        isOpen={isOrderDialogOpen}
        onClose={() => setIsOrderDialogOpen(false)}
        restaurantId={restaurantId}
        restaurantName={restaurantName}
        orderItems={items}
        orderTotal={total}
        onSuccess={handleOrderSuccess}
      />
    </>
  );
};

export default CartSummary;
