
import { useState, useEffect } from "react";
import { Clock, Check, ListOrdered } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OrdersTab from "./orders/OrdersTab";
import { OrderStatus } from "./orders/types";
import { OrderProps } from "./orders/OrderCard";
import { fetchRestaurantOrders, updateOrderStatus } from "@/services/orderService";
import { useAuth } from "@/contexts/auth";
import { useToast } from "@/components/ui/use-toast";
import { mockOrders } from "./orders/mockData";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const OrdersManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"pending" | "confirmed" | "history">("pending");
  
  // Use React Query to fetch and cache orders
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['restaurantOrders', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      try {
        const restaurantOrders = await fetchRestaurantOrders(user.id);
        
        if (restaurantOrders.length > 0) {
          // Transform to OrderProps format
          return restaurantOrders.map(order => ({
            id: order.id,
            customer: order.customer_name,
            items: order.items,
            total: order.total,
            status: order.status,
            time: new Date(order.created_at).toLocaleString(),
            specialInstructions: order.special_instructions,
            scheduledFor: order.scheduled_for ? new Date(order.scheduled_for).toLocaleString() : undefined
          }));
        } else {
          // If no real orders, use mock data for demo purposes
          toast({
            title: "No orders found",
            description: "Using sample data for demonstration",
          });
          return mockOrders;
        }
      } catch (error) {
        console.error("Error loading orders:", error);
        toast({
          title: "Error",
          description: "Could not load orders. Using sample data instead.",
          variant: "destructive",
        });
        return mockOrders;
      }
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Refetch every 30 seconds to get new orders
  });
  
  // Use mutation for updating order status
  const updateOrderMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string, status: OrderStatus }) => 
      updateOrderStatus(orderId, status),
    onSuccess: () => {
      // Invalidate the orders query to refetch data
      queryClient.invalidateQueries({ queryKey: ['restaurantOrders'] });
      toast({
        title: "Order Updated",
        description: "Order status has been updated successfully",
      });
    },
    onError: (error) => {
      console.error("Error updating order:", error);
      toast({
        title: "Update Failed",
        description: "Could not update the order status",
        variant: "destructive",
      });
    }
  });
  
  // Filter orders by status
  const pendingOrders = orders.filter(order => order.status === "pending");
  const confirmedOrders = orders.filter(order => order.status === "confirmed");
  const completedOrders = orders.filter(order => 
    order.status === "completed" || order.status === "cancelled"
  );
  
  // Handle order status updates
  const handleOrderStatusUpdate = (orderId: string, status: OrderStatus) => {
    updateOrderMutation.mutate({ orderId, status });
  };
  
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Orders Management</h2>
      
      {orders.length > 0 && orders[0] === mockOrders[0] && (
        <div className="bg-yellow-50 text-yellow-800 p-3 rounded-md text-sm mb-4">
          Showing sample orders. Real orders will appear here when customers place them.
        </div>
      )}
      
      <Tabs defaultValue="pending" value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
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
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-skipit-primary border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <OrdersTab 
              orders={pendingOrders} 
              emptyMessage="No pending orders right now."
              onStatusUpdate={handleOrderStatusUpdate}
            />
          )}
        </TabsContent>
        
        <TabsContent value="confirmed" className="pt-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-skipit-primary border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <OrdersTab 
              orders={confirmedOrders} 
              emptyMessage="No confirmed orders right now."
              onStatusUpdate={handleOrderStatusUpdate}
            />
          )}
        </TabsContent>
        
        <TabsContent value="history" className="pt-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-skipit-primary border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <OrdersTab 
              orders={completedOrders} 
              emptyMessage="No order history yet."
              onStatusUpdate={handleOrderStatusUpdate}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OrdersManagement;
