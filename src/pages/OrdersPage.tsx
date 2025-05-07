
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Clock, CheckCircle } from "lucide-react";

// Mock data for orders
const activeOrders = [
  {
    id: 1,
    restaurantName: "Taco Truck Deluxe",
    items: ["Chicken Burrito", "Chips & Salsa"],
    totalItems: 2,
    totalPrice: "$15.99",
    status: "Preparing",
    pickupTime: "12:30 PM",
    estimatedReadyTime: "10 minutes",
    imageUrl: "/lovable-uploads/da394ecb-aa2b-40dd-b48b-3d91161b0dac.png",
  },
];

const pastOrders = [
  {
    id: 2,
    restaurantName: "Burger Express",
    items: ["Double Cheeseburger", "Fries", "Soda"],
    totalItems: 3,
    totalPrice: "$18.50",
    status: "Completed",
    pickupTime: "Yesterday, 1:15 PM",
    imageUrl: "/lovable-uploads/da394ecb-aa2b-40dd-b48b-3d91161b0dac.png",
  },
  {
    id: 3,
    restaurantName: "Sushi Go",
    items: ["California Roll", "Miso Soup"],
    totalItems: 2,
    totalPrice: "$22.75",
    status: "Completed",
    pickupTime: "May 3, 12:45 PM",
    imageUrl: "/lovable-uploads/da394ecb-aa2b-40dd-b48b-3d91161b0dac.png",
  },
];

const OrdersPage = () => {
  const [activeTab, setActiveTab] = useState("active");
  const navigate = useNavigate();

  const reorder = (items: string[], price: string, restaurantName: string) => {
    console.log("Reordering:", items, "from", restaurantName);
    // In a real app, this would create a new order or navigate to the restaurant page
    navigate("/app");
  };

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
              <div 
                key={order.id} 
                className="bg-white rounded-lg shadow overflow-hidden border border-gray-100"
              >
                <div className="relative">
                  <img 
                    src={order.imageUrl} 
                    alt={order.restaurantName} 
                    className="w-full h-28 object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent py-2 px-4">
                    <h3 className="font-bold text-white">{order.restaurantName}</h3>
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="flex justify-between mb-2">
                    <Badge 
                      variant="outline" 
                      className="bg-amber-100 text-amber-800 hover:bg-amber-100"
                    >
                      {order.status}
                    </Badge>
                    <span className="font-semibold">{order.totalPrice}</span>
                  </div>
                  
                  <div className="text-sm mb-3">
                    <p className="text-muted-foreground mb-1">
                      {order.items.join(", ")}
                    </p>
                    <p className="font-medium flex items-center">
                      <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                      Ready in about {order.estimatedReadyTime}
                    </p>
                  </div>
                  
                  <div className="bg-skipit-light rounded-lg p-3 text-center">
                    <p className="text-sm font-medium">Pickup at {order.pickupTime}</p>
                    <p className="text-xs text-muted-foreground">Show this screen at the counter</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="bg-skipit-light rounded-lg p-6 inline-block mx-auto mb-4">
                <Clock className="h-12 w-12 text-skipit-primary mx-auto" />
              </div>
              <p className="text-lg font-medium mb-2">No active orders</p>
              <p className="text-muted-foreground mb-6">
                When you place an order, it will appear here
              </p>
              <Button onClick={() => navigate("/app")}>
                Browse Restaurants
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="past" className="space-y-4">
          {pastOrders.map((order) => (
            <div 
              key={order.id} 
              className="bg-white rounded-lg shadow overflow-hidden border border-gray-100"
            >
              <div className="flex">
                <div className="w-1/4">
                  <img 
                    src={order.imageUrl} 
                    alt={order.restaurantName} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="w-3/4 p-4">
                  <div className="flex justify-between mb-1">
                    <h3 className="font-semibold">{order.restaurantName}</h3>
                    <span className="text-sm">{order.totalPrice}</span>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mb-2">
                    {order.pickupTime}
                  </p>
                  
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground line-clamp-1">
                      {order.items.join(", ")}
                    </div>
                    <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
                      {order.status}
                    </Badge>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3 w-full"
                    onClick={() => reorder(order.items, order.totalPrice, order.restaurantName)}
                  >
                    Reorder
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OrdersPage;
