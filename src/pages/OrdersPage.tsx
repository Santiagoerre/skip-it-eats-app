
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Clock, CheckCircle } from "lucide-react";
import { fetchCustomerOrders } from "@/services/orderService";
import { useAuth } from "@/contexts/auth";
import { useToast } from "@/components/ui/use-toast";
import { useQuery } from "@tanstack/react-query";

// Interface for order data
interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  restaurantId: string;
  restaurantName: string;
  items: OrderItem[];
  totalItems: number;
  totalPrice: number;
  status: string;
  date: Date;
  formattedDate: string;
  estimatedReadyTime?: string;
  preparationTime?: number;
  imageUrl: string;
  specialInstructions?: string;
  scheduledFor?: string;
}

const OrdersPage = () => {
  const [activeTab, setActiveTab] = useState("active");
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch orders using React Query
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['customerOrders', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      try {
        const fetchedOrders = await fetchCustomerOrders(user.id);
        
        // Transform to our Order interface format
        const formattedOrders: Order[] = fetchedOrders.map(order => {
          const date = new Date(order.created_at);
          const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
          
          return {
            id: order.id,
            restaurantId: order.restaurant_id,
            restaurantName: "Restaurant", // We should fetch restaurant names in a real app
            items: order.items,
            totalItems,
            totalPrice: order.total,
            status: order.status,
            date,
            formattedDate: formatDate(date),
            estimatedReadyTime: order.status === 'pending' ? '15 minutes' : undefined,
            preparationTime: order.preparation_time,
            imageUrl: "/lovable-uploads/da394ecb-aa2b-40dd-b48b-3d91161b0dac.png", // Placeholder
            specialInstructions: order.special_instructions,
            scheduledFor: order.scheduled_for ? formatDate(new Date(order.scheduled_for)) : undefined
          };
        });
        
        return formattedOrders;
      } catch (error) {
        console.error("Error loading orders:", error);
        toast({
          title: "Error",
          description: "Could not load your orders",
          variant: "destructive",
        });
        return [];
      }
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Format date helper
  const formatDate = (date: Date): string => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === now.toDateString()) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  // Filter active and past orders
  const activeOrders = orders.filter(order => 
    order.status === 'pending' || order.status === 'confirmed'
  );
  
  const pastOrders = orders.filter(order => 
    order.status === 'completed' || order.status === 'cancelled'
  );

  const reorder = (restaurantId: string) => {
    navigate(`/restaurant/${restaurantId}`);
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Waiting for confirmation';
      case 'confirmed':
        return 'Confirmed';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Rejected';
      default:
        return status;
    }
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
          {isLoading ? (
            <div className="text-center py-8">Loading orders...</div>
          ) : activeOrders.length > 0 ? (
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
                      className={order.status === 'pending' 
                        ? "bg-amber-100 text-amber-800 hover:bg-amber-100"
                        : "bg-blue-100 text-blue-800 hover:bg-blue-100"
                      }
                    >
                      {getStatusText(order.status)}
                    </Badge>
                    <span className="font-semibold">${order.totalPrice.toFixed(2)}</span>
                  </div>
                  
                  <div className="text-sm mb-3">
                    <p className="text-muted-foreground mb-1">
                      {order.items.map(item => `${item.quantity}x ${item.name}`).join(", ")}
                    </p>
                    <p className="font-medium flex items-center">
                      <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                      {order.status === 'pending' 
                        ? `Ready in about ${order.estimatedReadyTime}`
                        : order.preparationTime 
                          ? `Ready in about ${order.preparationTime} minutes`
                          : 'Ready for pickup'}
                    </p>
                    {order.scheduledFor && (
                      <p className="font-medium flex items-center text-blue-600 mt-1">
                        <Clock className="h-4 w-4 mr-1 text-blue-600" />
                        Scheduled for: {order.scheduledFor}
                      </p>
                    )}
                  </div>
                  
                  {order.specialInstructions && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-3 text-sm">
                      <p className="font-medium">Note:</p>
                      <p className="text-muted-foreground">{order.specialInstructions}</p>
                    </div>
                  )}
                  
                  <div className="bg-skipit-light rounded-lg p-3 text-center">
                    <p className="text-sm font-medium">Pickup at {order.formattedDate}</p>
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
          {isLoading ? (
            <div className="text-center py-8">Loading orders...</div>
          ) : pastOrders.length > 0 ? (
            pastOrders.map((order) => (
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
                      <span className="text-sm">${order.totalPrice.toFixed(2)}</span>
                    </div>
                    
                    <p className="text-xs text-muted-foreground mb-2">
                      {order.formattedDate}
                      {order.scheduledFor && ` • Scheduled for ${order.scheduledFor}`}
                    </p>
                    
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-muted-foreground line-clamp-1">
                        {order.items.map(item => `${item.quantity}x ${item.name}`).join(", ")}
                      </div>
                      <Badge 
                        variant="outline" 
                        className={order.status === 'completed' 
                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                          : "bg-red-100 text-red-800 hover:bg-red-100"
                        }
                      >
                        {getStatusText(order.status)}
                      </Badge>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-3 w-full"
                      onClick={() => reorder(order.restaurantId)}
                    >
                      Reorder
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="bg-skipit-light rounded-lg p-6 inline-block mx-auto mb-4">
                <CheckCircle className="h-12 w-12 text-skipit-primary mx-auto" />
              </div>
              <p className="text-lg font-medium mb-2">No order history</p>
              <p className="text-muted-foreground mb-6">
                Your completed orders will appear here
              </p>
              <Button onClick={() => navigate("/app")}>
                Browse Restaurants
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OrdersPage;
