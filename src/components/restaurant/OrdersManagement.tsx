
import { useState, useEffect } from "react";
import { Clock, Check, ListOrdered } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OrdersTab from "./orders/OrdersTab";
import { OrderStatus } from "./orders/types";
import { OrderProps } from "./orders/OrderCard";
import { fetchRestaurantOrders, updateOrderStatus } from "@/services/orderService";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { mockOrders } from "./orders/mockData";

const OrdersManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<OrderProps[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [useRealData, setUseRealData] = useState(true);
  
  // Filter orders by status
  const pendingOrders = orders.filter(order => order.status === "pending");
  const confirmedOrders = orders.filter(order => order.status === "confirmed");
  const completedOrders = orders.filter(order => order.status === "completed" || order.status === "cancelled");
  
  // Load orders when component mounts
  useEffect(() => {
    const loadOrders = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        const restaurantOrders = await fetchRestaurantOrders(user.id);
        
        if (restaurantOrders.length > 0) {
          // Transform to OrderProps format
          const formattedOrders: OrderProps[] = restaurantOrders.map(order => ({
            id: order.id,
            customer: order.customer_name,
            items: order.items,
            total: order.total,
            status: order.status,
            time: new Date(order.created_at).toLocaleString(),
            specialInstructions: order.special_instructions
          }));
          
          setOrders(formattedOrders);
          setUseRealData(true);
        } else {
          // If no real orders, use mock data
          setOrders(mockOrders);
          setUseRealData(false);
        }
      } catch (error) {
        console.error("Error loading orders:", error);
        setOrders(mockOrders);
        setUseRealData(false);
        toast({
          title: "Error",
          description: "Could not load orders. Using sample data instead.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadOrders();
  }, [user, toast]);
  
  // Handle order status updates
  async function handleOrderStatusUpdate(orderId: string, status: OrderStatus) {
    try {
      if (useRealData) {
        // Update in database
        await updateOrderStatus(orderId, status);
      }
      
      // Update local state
      setOrders(
        orders.map(order => 
          order.id === orderId 
            ? { ...order, status } 
            : order
        )
      );
      
      toast({
        title: "Order Updated",
        description: `Order status changed to ${status}`,
      });
    } catch (error) {
      console.error("Error updating order:", error);
      toast({
        title: "Update Failed",
        description: "Could not update the order status",
        variant: "destructive",
      });
    }
  }
  
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Orders Management</h2>
      
      {!useRealData && (
        <div className="bg-yellow-50 text-yellow-800 p-3 rounded-md text-sm mb-4">
          Showing sample orders. Real orders will appear here when customers place them.
        </div>
      )}
      
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
          <OrdersTab 
            orders={pendingOrders} 
            emptyMessage="No pending orders right now."
            onStatusUpdate={handleOrderStatusUpdate}
          />
        </TabsContent>
        
        <TabsContent value="confirmed" className="pt-4">
          <OrdersTab 
            orders={confirmedOrders} 
            emptyMessage="No confirmed orders right now."
            onStatusUpdate={handleOrderStatusUpdate}
          />
        </TabsContent>
        
        <TabsContent value="history" className="pt-4">
          <OrdersTab 
            orders={completedOrders} 
            emptyMessage="No order history yet."
            onStatusUpdate={handleOrderStatusUpdate}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OrdersManagement;
