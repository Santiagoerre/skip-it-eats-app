
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OrderCard from "@/components/OrderCard";

// Mock data for orders
const activeOrders = [
  {
    id: 1,
    restaurantName: "Taco Truck Deluxe",
    items: ["Chicken Burrito", "Chips & Salsa"],
    totalPrice: "$15.99",
    status: "Preparing",
    pickupTime: "12:30 PM",
    imageUrl: "/lovable-uploads/da394ecb-aa2b-40dd-b48b-3d91161b0dac.png",
  },
];

const pastOrders = [
  {
    id: 2,
    restaurantName: "Burger Express",
    items: ["Double Cheeseburger", "Fries", "Soda"],
    totalPrice: "$18.50",
    status: "Completed",
    pickupTime: "Yesterday, 1:15 PM",
    imageUrl: "/lovable-uploads/da394ecb-aa2b-40dd-b48b-3d91161b0dac.png",
  },
  {
    id: 3,
    restaurantName: "Sushi Go",
    items: ["California Roll", "Miso Soup"],
    totalPrice: "$22.75",
    status: "Completed",
    pickupTime: "May 3, 12:45 PM",
    imageUrl: "/lovable-uploads/da394ecb-aa2b-40dd-b48b-3d91161b0dac.png",
  },
];

const OrdersPage = () => {
  const [activeTab, setActiveTab] = useState("active");

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">My Orders</h1>
      
      <Tabs defaultValue="active" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="space-y-4">
          {activeOrders.length > 0 ? (
            activeOrders.map((order) => (
              <OrderCard key={order.id} order={order} isActive={true} />
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No active orders</p>
              <Button onClick={() => window.location.href = "/app"}>
                Browse Restaurants
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="past" className="space-y-4">
          {pastOrders.map((order) => (
            <OrderCard key={order.id} order={order} isActive={false} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OrdersPage;
