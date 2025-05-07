
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Clock, CheckCircle, LogOut } from "lucide-react";

// Mock data for incoming orders
const incomingOrders = [
  {
    id: 1,
    customerName: "Jane Smith",
    items: ["Chicken Burrito", "Chips & Salsa"],
    totalPrice: "$15.99",
    status: "New",
    pickupTime: "12:30 PM",
  },
  {
    id: 2,
    customerName: "Mike Johnson",
    items: ["Beef Tacos (3)", "Mexican Soda"],
    totalPrice: "$14.50",
    status: "Preparing",
    pickupTime: "12:45 PM",
  },
];

const RestaurantDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("orders");
  
  const handleSignOut = () => {
    navigate("/");
  };
  
  return (
    <div className="mobile-container app-height flex flex-col">
      <header className="p-4 border-b flex justify-between items-center bg-white">
        <h1 className="text-xl font-bold">Restaurant Dashboard</h1>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={handleSignOut}
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </header>
      
      <div className="p-4 bg-skipit-light">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="font-semibold">Taco Truck Deluxe</h2>
            <p className="text-sm text-muted-foreground">Mexican Cuisine</p>
          </div>
          <div className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full">
            Open
          </div>
        </div>
      </div>
      
      <Tabs 
        defaultValue="orders" 
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col"
      >
        <TabsList className="grid grid-cols-2 p-0 h-auto">
          <TabsTrigger value="orders" className="py-3 rounded-none">
            Incoming Orders
          </TabsTrigger>
          <TabsTrigger value="menu" className="py-3 rounded-none">
            Menu
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="orders" className="flex-1 overflow-y-auto p-4 space-y-4">
          {incomingOrders.map((order) => (
            <Card key={order.id}>
              <CardContent className="p-3">
                <div className="flex justify-between mb-2">
                  <h3 className="font-semibold">{order.customerName}</h3>
                  <span className="text-sm font-medium text-skipit-primary">
                    {order.status}
                  </span>
                </div>
                
                <p className="text-sm text-muted-foreground mb-2">
                  {order.items.join(", ")}
                </p>
                
                <div className="flex justify-between items-center">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Pickup: </span>
                    <span className="font-medium">{order.pickupTime}</span>
                  </div>
                  <span className="font-medium">{order.totalPrice}</span>
                </div>
                
                <div className="flex space-x-2 mt-3">
                  <Button size="sm" variant="outline" className="flex-1">
                    Reject
                  </Button>
                  <Button size="sm" className="flex-1">
                    Accept
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        
        <TabsContent value="menu" className="flex-1 overflow-y-auto p-4">
          <div className="flex justify-between mb-4">
            <h3 className="font-semibold">Your Menu</h3>
            <Button size="sm">Add Item</Button>
          </div>
          
          <div className="text-center py-8 text-muted-foreground">
            <p className="mb-4">Your menu will appear here</p>
            <p className="text-sm">
              (Menu management will be implemented in the next iteration)
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RestaurantDashboard;
