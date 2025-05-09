
import { Check, X, Clock, Calendar, Utensils, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { OrderStatus } from "./types";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";

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
  const [showDetails, setShowDetails] = useState(false);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  
  const getStatusVariant = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return "outline";
      case "confirmed":
        return "secondary";
      case "completed":
        return "default";
      case "cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };
  
  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 mr-1" />;
      case "confirmed":
        return <Check className="h-4 w-4 mr-1" />;
      case "completed":
        return <Check className="h-4 w-4 mr-1" />;
      case "cancelled":
        return <X className="h-4 w-4 mr-1" />;
      default:
        return null;
    }
  };
  
  return (
    <>
      <Card className="mb-4 hover:shadow-md transition-shadow">
        <CardContent className="pt-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-semibold">{order.customer}</h3>
              <p className="text-sm text-muted-foreground">{order.time}</p>
            </div>
            <Badge
              variant={getStatusVariant(order.status)}
              className="flex items-center"
            >
              {getStatusIcon(order.status)}
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </Badge>
          </div>
          
          <Separator className="my-4" />
          
          <div className="space-y-2">
            {order.items.slice(0, 2).map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span>{item.quantity}x {item.name}</span>
                <span>${item.price.toFixed(2)}</span>
              </div>
            ))}
            {order.items.length > 2 && (
              <Button 
                variant="ghost" 
                className="text-xs p-0 h-auto" 
                onClick={() => setShowDetails(true)}
              >
                +{order.items.length - 2} more items
              </Button>
            )}
          </div>
          
          {order.specialInstructions && (
            <div className="mt-4 p-3 bg-muted rounded-md text-sm">
              <p className="font-semibold">Special Instructions:</p>
              <p className="line-clamp-2">{order.specialInstructions}</p>
              {order.specialInstructions.length > 100 && (
                <Button 
                  variant="ghost" 
                  className="text-xs p-0 h-auto mt-1" 
                  onClick={() => setShowDetails(true)}
                >
                  View all
                </Button>
              )}
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
              onClick={() => setConfirmCancelOpen(true)}
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
      
      {/* Order Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              Order from {order.customer} on {order.time}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <Badge variant={getStatusVariant(order.status)} className="mr-2">
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </Badge>
              <span className="text-sm text-muted-foreground">Order ID: {order.id.slice(0, 8)}</span>
            </div>
            
            <div className="bg-muted p-4 rounded-md space-y-3">
              <div className="font-medium">Items</div>
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>{item.quantity}x {item.name}</span>
                  <span>${item.price.toFixed(2)}</span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>${order.total.toFixed(2)}</span>
              </div>
            </div>
            
            {order.specialInstructions && (
              <div className="space-y-2">
                <div className="font-medium">Special Instructions</div>
                <div className="text-sm bg-muted p-4 rounded-md">
                  {order.specialInstructions}
                </div>
              </div>
            )}
            
            <div className="flex flex-col space-y-2">
              <div className="flex items-center text-sm">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>Ordered on {order.time}</span>
              </div>
              <div className="flex items-center text-sm">
                <Utensils className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>Customer: {order.customer}</span>
              </div>
              <div className="flex items-center text-sm">
                <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>Payment: Paid Online</span>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Confirmation Dialog for Cancelling Order */}
      <Dialog open={confirmCancelOpen} onOpenChange={setConfirmCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject this order? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setConfirmCancelOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                onStatusUpdate(order.id, "cancelled");
                setConfirmCancelOpen(false);
              }}
            >
              Reject Order
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OrderCard;
