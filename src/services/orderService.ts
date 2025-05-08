
import { supabase } from "@/integrations/supabase/client";
import { OrderStatus } from "@/components/restaurant/orders/types";
import { Json } from "@/integrations/supabase/types";

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  customer_id: string;
  restaurant_id: string;
  customer_name: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  created_at: string;
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
    const { data, error } = await supabase
      .from('orders')
      .insert({
        customer_id: customerId,
        restaurant_id: restaurantId,
        customer_name: customerName,
        items: items as unknown as Json,
        total,
        status: 'pending',
        special_instructions: specialInstructions
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error submitting order:', error);
      throw error;
    }
    
    return {
      ...data,
      items: data.items as unknown as OrderItem[]
    } as Order;
  } catch (error) {
    console.error('Error submitting order:', error);
    throw error;
  }
};

// Fetch all orders for a customer
export const fetchCustomerOrders = async (customerId: string): Promise<Order[]> => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching customer orders:', error);
      throw error;
    }
    
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
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching restaurant orders:', error);
      throw error;
    }
    
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
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
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
