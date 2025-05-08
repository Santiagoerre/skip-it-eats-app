
import { useState } from "react";
import { Check, X, Clock, ListOrdered } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock data for orders - will be replaced with real API calls
const mockOrders = [
  {
    id: "1",
    customer: "John Doe",
    items: [
      { name: "Burger", quantity: 1, price: 12.99 },
      { name: "Fries", quantity: 1, price: 3.99 },
      { name: "Soda", quantity: 1, price: 1.99 }
    ],
    total: 18.97,
    status: "pending",
    time: "Today, 5:30 PM",
    specialInstructions: "No onions on the burger please"
  },
  {
    id: "2",
    customer: "Jane Smith",
    items: [
      { name: "Pizza", quantity: 1, price: 14.99 },
      { name: "Breadsticks", quantity: 1, price: 4.99 }
    ],
    total: 19.98,
    status: "confirmed",
    time: "Today, 5:15 PM"
  },
  {
    id: "3",
    customer: "Alice Johnson",
    items: [
      { name: "Salad", quantity: 1, price: 9.99 },
      { name: "Iced Tea", quantity: 1, price: 2.99 }
    ],
    total: 12.98,
    status: "completed",
    time: "Today, 4:30 PM"
  }
];

type OrderStatus = "pending" | "confirmed" | "completed" | "cancelled";

interface Order {
  id: string;
  customer: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  status: OrderStatus;
  time: string;
  specialInstructions?: string;
}

const OrdersManagement = () => {
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  
  const pendingOrders = orders.filter(order => order.status === "pending");
  const confirmedOrders = orders.filter(order => order.status === "confirmed");
  const completedOrders = orders.filter(order => order.status === "completed" || order.status === "cancelled");
  
  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders(
      orders.map(order => 
        order.id === orderId 
          ? { ...order, status } 
          : order
      )
    );
  };
  
  const OrderCard = ({ order }: { order: Order }) => (
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
            onClick={() => updateOrderStatus(order.id, "cancelled")}
          >
            <X className="h-4 w-4 mr-2" /> Reject
          </Button>
          <Button 
            variant="default" 
            className="flex-1"
            onClick={() => updateOrderStatus(order.id, "confirmed")}
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
            onClick={() => updateOrderStatus(order.id, "completed")}
          >
            <Check className="h-4 w-4 mr-2" /> Mark as Completed
          </Button>
        </CardFooter>
      )}
    </Card>
  );
  
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Orders Management</h2>
      
      <Tabs defaultValue="pending">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" className="flex items-center justify-center">
            <Clock className="h-4 w-4 mr-2" /> 
            Pending <Badge variant="outline" className="ml-2">{pendingOrders.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="confirmed">
            <Check className="h-4 w-4 mr-2" /> 
            Confirmed <Badge variant="outline" className="ml-2">{confirmedOrders.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="history">
            <ListOrdered className="h-4 w-4 mr-2" /> 
            History <Badge variant="outline" className="ml-2">{completedOrders.length}</Badge>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending" className="pt-4">
          {pendingOrders.length === 0 ? (
            <div className="text-center py-8 bg-muted rounded-lg">
              <p className="text-muted-foreground">No pending orders right now.</p>
            </div>
          ) : (
            pendingOrders.map(order => (
              <OrderCard key={order.id} order={order} />
            ))
          )}
        </TabsContent>
        
        <TabsContent value="confirmed" className="pt-4">
          {confirmedOrders.length === 0 ? (
            <div className="text-center py-8 bg-muted rounded-lg">
              <p className="text-muted-foreground">No confirmed orders right now.</p>
            </div>
          ) : (
            confirmedOrders.map(order => (
              <OrderCard key={order.id} order={order} />
            ))
          )}
        </TabsContent>
        
        <TabsContent value="history" className="pt-4">
          {completedOrders.length === 0 ? (
            <div className="text-center py-8 bg-muted rounded-lg">
              <p className="text-muted-foreground">No order history yet.</p>
            </div>
          ) : (
            completedOrders.map(order => (
              <OrderCard key={order.id} order={order} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OrdersManagement;
