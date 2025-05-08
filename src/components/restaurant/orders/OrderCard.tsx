
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { OrderStatus } from "./types";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

export interface OrderProps {
  id: string;
  customer: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  time: string;
  specialInstructions?: string;
}

interface OrderCardProps {
  order: OrderProps;
  onStatusUpdate: (orderId: string, status: OrderStatus) => void;
}

const OrderCard = ({ order, onStatusUpdate }: OrderCardProps) => {
  return (
    <Card className="mb-4">
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-semibold">{order.customer}</h3>
            <p className="text-sm text-muted-foreground">{order.time}</p>
          </div>
          <Badge
            variant={
              order.status === "pending" 
                ? "outline" 
                : order.status === "confirmed" 
                  ? "secondary"
                  : order.status === "completed"
                    ? "default"
                    : "destructive"
            }
          >
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </Badge>
        </div>
        
        <Separator className="my-4" />
        
        <div className="space-y-2">
          {order.items.map((item, index) => (
            <div key={index} className="flex justify-between text-sm">
              <span>{item.quantity}x {item.name}</span>
              <span>${item.price.toFixed(2)}</span>
            </div>
          ))}
        </div>
        
        {order.specialInstructions && (
          <div className="mt-4 p-3 bg-muted rounded-md text-sm">
            <p className="font-semibold">Special Instructions:</p>
            <p>{order.specialInstructions}</p>
          </div>
        )}
        
        <div className="mt-4 flex justify-between font-semibold">
          <span>Total</span>
          <span>${order.total.toFixed(2)}</span>
        </div>
      </CardContent>
      
      {order.status === "pending" && (
        <CardFooter className="flex justify-between gap-2 pt-0">
          <Button 
            variant="outline" 
            className="flex-1 border-red-200 hover:bg-red-50 hover:text-red-500"
            onClick={() => onStatusUpdate(order.id, "cancelled")}
          >
            <X className="h-4 w-4 mr-2" /> Reject
          </Button>
          <Button 
            variant="default" 
            className="flex-1"
            onClick={() => onStatusUpdate(order.id, "confirmed")}
          >
            <Check className="h-4 w-4 mr-2" /> Accept
          </Button>
        </CardFooter>
      )}
      
      {order.status === "confirmed" && (
        <CardFooter className="pt-0">
          <Button 
            variant="default" 
            className="w-full"
            onClick={() => onStatusUpdate(order.id, "completed")}
          >
            <Check className="h-4 w-4 mr-2" /> Mark as Completed
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default OrderCard;
