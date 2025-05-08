
import { useState } from "react";
import { Clock, Check, ListOrdered } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OrdersTab from "./orders/OrdersTab";
import { mockOrders } from "./orders/mockData";
import { OrderStatus } from "./orders/types";
import { OrderProps } from "./orders/OrderCard";

const OrdersManagement = () => {
  const [orders, setOrders] = useState<OrderProps[]>(
    mockOrders.map(order => ({
      ...order,
      onStatusUpdate: updateOrderStatus
    }))
  );
  
  const pendingOrders = orders.filter(order => order.status === "pending");
  const confirmedOrders = orders.filter(order => order.status === "confirmed");
  const completedOrders = orders.filter(order => order.status === "completed" || order.status === "cancelled");
  
  function updateOrderStatus(orderId: string, status: OrderStatus) {
    setOrders(
      orders.map(order => 
        order.id === orderId 
          ? { ...order, status } 
          : order
      )
    );
  }
  
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
          <OrdersTab 
            orders={pendingOrders} 
            emptyMessage="No pending orders right now."
            onStatusUpdate={updateOrderStatus}
          />
        </TabsContent>
        
        <TabsContent value="confirmed" className="pt-4">
          <OrdersTab 
            orders={confirmedOrders} 
            emptyMessage="No confirmed orders right now."
            onStatusUpdate={updateOrderStatus}
          />
        </TabsContent>
        
        <TabsContent value="history" className="pt-4">
          <OrdersTab 
            orders={completedOrders} 
            emptyMessage="No order history yet."
            onStatusUpdate={updateOrderStatus}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OrdersManagement;
