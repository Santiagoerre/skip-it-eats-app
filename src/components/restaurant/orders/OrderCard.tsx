
import { useState } from "react";
import { Clock, Check, X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { OrderStatus } from "./types";
import { OrderItem } from "@/services/orderService";

export interface OrderProps {
  id: string;
  customer: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  time: string;
  specialInstructions?: string;
}

interface StatusButtonProps {
  currentStatus: OrderStatus;
  targetStatus: OrderStatus;
  label: string;
  onClick: () => void;
}

const StatusButton = ({ currentStatus, targetStatus, label, onClick }: StatusButtonProps) => {
  // Determine which status changes are valid
  const isValid = 
    (currentStatus === 'pending' && targetStatus === 'confirmed') ||
    (currentStatus === 'pending' && targetStatus === 'cancelled') ||
    (currentStatus === 'confirmed' && targetStatus === 'completed') ||
    (currentStatus === 'confirmed' && targetStatus === 'cancelled');
  
  // Render nothing if status change is invalid
  if (!isValid) return null;
  
  return (
    <Button
      variant={targetStatus === 'cancelled' ? "destructive" : "default"}
      size="sm"
      onClick={onClick}
    >
      {label}
    </Button>
  );
};

const OrderCard = ({ 
  id, 
  customer, 
  items, 
  total, 
  status, 
  time,
  specialInstructions,
  onStatusUpdate
}: OrderProps & { 
  onStatusUpdate: (orderId: string, status: OrderStatus) => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  
  const getStatusBadge = () => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case 'confirmed':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Confirmed</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'confirmed':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'completed':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'cancelled':
        return <X className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };
  
  // Format the item details for display
  const formatItemText = (item: OrderItem) => {
    let baseText = `${item.quantity} × ${item.name}`;
    
    // Calculate the item price including options
    let itemPrice = item.price;
    if (item.options) {
      item.options.forEach(optionGroup => {
        optionGroup.selections.forEach(selection => {
          itemPrice += selection.priceAdjustment;
        });
      });
    }
    
    return {
      text: baseText,
      price: itemPrice * item.quantity
    };
  };
  
  const handleConfirm = () => {
    onStatusUpdate(id, 'confirmed');
  };
  
  const handleComplete = () => {
    onStatusUpdate(id, 'completed');
  };
  
  const handleCancel = () => {
    onStatusUpdate(id, 'cancelled');
  };
  
  return (
    <Card className={`mb-4 ${
      status === 'cancelled' ? 'opacity-75' : ''
    }`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <h3 className="font-medium">{customer}</h3>
              {getStatusBadge()}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Order placed: {time}</p>
          </div>
          <div className="text-right">
            <p className="font-semibold">${total.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground">Order #{id.substring(0, 8)}</p>
          </div>
        </div>
        
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-medium">Order Items</h4>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 p-0 px-2"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          <div className={`space-y-2 ${expanded ? 'block' : 'hidden'}`}>
            {items.map((item, index) => {
              const { text, price } = formatItemText(item);
              
              return (
                <div key={index} className="border-b pb-2 last:border-b-0">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p>{text}</p>
                      
                      {/* Display selected options if any */}
                      {item.options && item.options.length > 0 && (
                        <div className="ml-4 mt-1 text-sm text-muted-foreground">
                          {item.options.map((optionGroup, groupIndex) => (
                            <div key={groupIndex}>
                              <span className="font-medium">{optionGroup.groupName}: </span>
                              {optionGroup.selections.map((selection, selectionIndex) => (
                                <span key={selectionIndex}>
                                  {selection.name}
                                  {selection.priceAdjustment > 0 && ` (+$${selection.priceAdjustment.toFixed(2)})`}
                                  {selectionIndex < optionGroup.selections.length - 1 ? ', ' : ''}
                                </span>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="font-medium">${price.toFixed(2)}</p>
                  </div>
                </div>
              );
            })}
            
            {/* Special Instructions */}
            {specialInstructions && (
              <div className="mt-3 bg-muted p-3 rounded-md">
                <p className="font-medium text-sm">Special Instructions:</p>
                <p className="text-sm mt-1">{specialInstructions}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      
      {/* Order Actions */}
      {status !== 'completed' && status !== 'cancelled' && (
        <CardFooter className="flex justify-end gap-2 p-4 pt-0">
          <StatusButton
            currentStatus={status}
            targetStatus="confirmed"
            label="Confirm"
            onClick={handleConfirm}
          />
          <StatusButton
            currentStatus={status}
            targetStatus="completed"
            label="Complete"
            onClick={handleComplete}
          />
          <StatusButton
            currentStatus={status}
            targetStatus="cancelled"
            label="Cancel"
            onClick={handleCancel}
          />
        </CardFooter>
      )}
    </Card>
  );
};

export default OrderCard;
