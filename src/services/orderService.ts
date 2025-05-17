
import { supabase } from "@/integrations/supabase/client";
import { OrderStatus } from "@/components/restaurant/orders/types";
import { Json } from "@/integrations/supabase/types";
import { useToast } from "@/components/ui/use-toast";

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  options?: OrderItemOption[];
}

export interface OrderItemOption {
  groupName: string;
  selections: {
    name: string;
    priceAdjustment: number;
  }[];
}

export interface Order {
  id: string;
  customer_id: string;
  restaurant_id: string;
  customer_name: string;
  items: OrderItem[];
  items_with_options?: OrderItem[];
  total: number;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
  special_instructions?: string;
}

// Submit a new order
export const submitOrder = async (
  customerId: string, 
  restaurantId: string, 
  customerName: string,
  items: OrderItem[], 
  total: number,
  specialInstructions?: string
): Promise<Order> => {
  try {
    // Validate inputs
    if (!customerId || !restaurantId || !items.length || total <= 0) {
      throw new Error("Invalid order data. Please check all required fields.");
    }
    
    // Make sure all items have required properties
    items.forEach(item => {
      if (!item.name || typeof item.quantity !== 'number' || typeof item.price !== 'number') {
        throw new Error("Invalid order item data");
      }
    });
    
    // Prepare the order data
    const orderData = {
      customer_id: customerId,
      restaurant_id: restaurantId,
      customer_name: customerName,
      items: items.map(({ options, ...rest }) => rest) as unknown as Json,
      items_with_options: items as unknown as Json,
      total,
      status: 'pending',
      special_instructions: specialInstructions
    };
    
    const { data, error } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();
    
    if (error) {
      console.error('Error submitting order:', error);
      throw error;
    }
    
    // Track the order in console for debugging
    console.log('Order created successfully:', data.id);
    
    return {
      ...data,
      items: data.items as unknown as OrderItem[],
      items_with_options: data.items_with_options as unknown as OrderItem[]
    } as Order;
  } catch (error) {
    console.error('Error submitting order:', error);
    throw error;
  }
};

// Fetch all orders for a customer
export const fetchCustomerOrders = async (customerId: string): Promise<Order[]> => {
  try {
    if (!customerId) {
      console.warn("No customer ID provided for fetchCustomerOrders");
      return [];
    }
    
    console.log("Fetching orders for customer:", customerId);
    
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching customer orders:', error);
      throw error;
    }
    
    console.log(`Found ${data?.length || 0} orders for customer`);
    
    // Transform the items field from Json to OrderItem[]
    return (data || []).map(order => ({
      ...order,
      items: order.items as unknown as OrderItem[]
    })) as Order[];
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    return [];
  }
};

// Fetch all orders for a restaurant
export const fetchRestaurantOrders = async (restaurantId: string): Promise<Order[]> => {
  try {
    if (!restaurantId) {
      console.warn("No restaurant ID provided for fetchRestaurantOrders");
      return [];
    }
    
    console.log("Fetching orders for restaurant:", restaurantId);
    
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching restaurant orders:', error);
      throw error;
    }
    
    console.log(`Found ${data?.length || 0} orders for restaurant`);
    
    // Transform the items field from Json to OrderItem[]
    return (data || []).map(order => ({
      ...order,
      items: order.items as unknown as OrderItem[]
    })) as Order[];
  } catch (error) {
    console.error('Error fetching restaurant orders:', error);
    return [];
  }
};

// Update order status
export const updateOrderStatus = async (orderId: string, status: OrderStatus): Promise<Order> => {
  try {
    if (!orderId) {
      throw new Error("No order ID provided for status update");
    }
    
    // Validate status is one of the allowed types
    if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
      throw new Error(`Invalid status: ${status}`);
    }
    
    console.log(`Updating order ${orderId} status to ${status}`);
    
    const { data, error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
    
    return {
      ...data,
      items: data.items as unknown as OrderItem[]
    } as Order;
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};

// Get a single order by ID
export const getOrderById = async (orderId: string): Promise<Order | null> => {
  try {
    if (!orderId) {
      console.warn("No order ID provided for getOrderById");
      return null;
    }
    
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // Order not found
        console.log(`Order ${orderId} not found`);
        return null;
      }
      console.error('Error fetching order by ID:', error);
      throw error;
    }
    
    if (!data) return null;
    
    return {
      ...data,
      items: data.items as unknown as OrderItem[]
    } as Order;
  } catch (error) {
    console.error('Error fetching order by ID:', error);
    return null;
  }
};
