
import { Clock, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Order {
  id: number;
  restaurantName: string;
  items: string[];
  totalPrice: string;
  status: string;
  pickupTime: string;
  imageUrl: string;
}

interface OrderCardProps {
  order: Order;
  isActive: boolean;
}

const OrderCard = ({ order, isActive }: OrderCardProps) => {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex border-b p-3">
          <div className="w-16 h-16 rounded-md overflow-hidden mr-3 flex-shrink-0">
            <img
              src={order.imageUrl}
              alt={order.restaurantName}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">{order.restaurantName}</h3>
            <p className="text-sm text-muted-foreground">
              {order.items.join(", ")}
            </p>
            <div className="mt-1 flex justify-between items-center">
              <span className="font-medium">{order.totalPrice}</span>
              {isActive ? (
                <span className="text-skipit-primary text-sm font-medium flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {order.status}
                </span>
              ) : (
                <span className="text-green-600 text-sm font-medium flex items-center">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {order.status}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="p-3 flex justify-between items-center bg-skipit-light">
          <div className="text-sm">
            <span className="text-muted-foreground">Pickup: </span>
            <span className="font-medium">{order.pickupTime}</span>
          </div>
          
          {isActive && (
            <Button variant="outline" size="sm">
              View Details
            </Button>
          )}
          
          {!isActive && (
            <Button variant="outline" size="sm">
              Reorder
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderCard;
