
import { useState } from "react";
import { ChevronDown, ChevronUp, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { OrderItem } from "@/services/orderService";

interface OrderCardProps {
  id: string;
  restaurant: string;
  items: OrderItem[];
  total: number;
  status: string;
  time: string;
  specialInstructions?: string;
  scheduledFor?: string;
}

const OrderCard = ({ id, restaurant, items, total, status, time, specialInstructions, scheduledFor }: OrderCardProps) => {
  const [expanded, setExpanded] = useState(false);
  
  const getStatusBadge = () => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Waiting for confirmation</Badge>;
      case 'confirmed':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Confirmed</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
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
  
  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium">{restaurant}</h3>
              {getStatusBadge()}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Order placed: {time}</p>
            {scheduledFor && (
              <p className="text-sm font-medium text-blue-600 mt-1">
                <Clock className="h-3 w-3 inline mr-1" />
                Scheduled for: {scheduledFor}
              </p>
            )}
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
    </Card>
  );
};

export default OrderCard;
