
import { supabase } from "@/integrations/supabase/client";

export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  price_range: string;
  distance?: string;
  distanceValue?: number; // Add this property for sorting
  image_url: string;
  description?: string;
}

export interface RestaurantLocation {
  id: string;
  restaurant_id: string;
  address: string;
  latitude: number;
  longitude: number;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export const fetchRestaurants = async (): Promise<Restaurant[]> => {
  try {
    console.log("Fetching restaurants");
    const { data: detailsData, error: detailsError } = await supabase
      .from('restaurant_details')
      .select('*');
    
    if (detailsError) {
      console.error("Error fetching restaurant details:", detailsError);
      throw detailsError;
    }
    
    if (!detailsData || detailsData.length === 0) {
      console.log("No restaurant details found");
      return [];
    }
    
    // Transform data to match our interface
    return detailsData.map(item => ({
      id: item.restaurant_id,
      name: item.name,
      cuisine: item.cuisine || 'Not specified',
      rating: 0, // Will be calculated in the future
      price_range: item.price_range || '$',
      image_url: item.image_url || '/placeholder.svg',
      description: item.description
    }));
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    throw error;
  }
};

export const fetchRestaurantById = async (id: string): Promise<Restaurant | null> => {
  try {
    console.log("Fetching restaurant by ID:", id);
    const { data, error } = await supabase
      .from('restaurant_details')
      .select('*')
      .eq('restaurant_id', id)
      .single();
    
    if (error) {
      console.error("Error fetching restaurant details:", error);
      throw error;
    }
    
    if (!data) {
      console.log("No restaurant details found for ID:", id);
      return null;
    }
    
    return {
      id: data.restaurant_id,
      name: data.name,
      cuisine: data.cuisine || 'Not specified',
      rating: 0, // Will be calculated in the future
      price_range: data.price_range || '$',
      image_url: data.image_url || '/placeholder.svg',
      description: data.description
    };
  } catch (error) {
    console.error('Error fetching restaurant:', error);
    throw error;
  }
};

export const fetchRestaurantLocation = async (restaurantId: string): Promise<RestaurantLocation | null> => {
  try {
    console.log("Fetching restaurant location for ID:", restaurantId);
    const { data, error } = await supabase
      .from('restaurant_locations')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .maybeSingle();
    
    if (error) {
      console.error("Error fetching restaurant location:", error);
      throw error;
    }
    
    if (!data) {
      console.log("No location found for restaurant ID:", restaurantId);
      return null;
    }
    
    return {
      id: data.id,
      restaurant_id: data.restaurant_id,
      address: data.address,
      latitude: data.latitude || 0,
      longitude: data.longitude || 0
    };
  } catch (error) {
    console.error('Error fetching restaurant location:', error);
    return null;
  }
};

// Fetch menu items for a restaurant
export const fetchMenuItems = async (restaurantId: string): Promise<MenuItem[]> => {
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('category', { ascending: true });
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching menu items:', error);
    return [];
  }
};

// Create a new menu item
export const createMenuItem = async (item: Omit<MenuItem, 'id' | 'created_at' | 'updated_at'>): Promise<MenuItem> => {
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .insert([item])
      .select()
      .single();
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error creating menu item:', error);
    throw error;
  }
};

// Update an existing menu item
export const updateMenuItem = async (id: string, updates: Partial<MenuItem>): Promise<MenuItem> => {
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error updating menu item:', error);
    throw error;
  }
};

// Delete a menu item
export const deleteMenuItem = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting menu item:', error);
    throw error;
  }
};

// Update restaurant details
export const updateRestaurantDetails = async (restaurantId: string, updates: Partial<Omit<Restaurant, 'id'>>): Promise<Restaurant> => {
  try {
    const { data, error } = await supabase
      .from('restaurant_details')
      .update(updates)
      .eq('restaurant_id', restaurantId)
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.restaurant_id,
      name: data.name,
      cuisine: data.cuisine || 'Not specified',
      rating: 0,
      price_range: data.price_range || '$',
      image_url: data.image_url || '/placeholder.svg',
      description: data.description
    };
  } catch (error) {
    console.error('Error updating restaurant details:', error);
    throw error;
  }
};

// Update restaurant location
export const updateRestaurantLocation = async (
  restaurantId: string, 
  updates: { address: string; latitude?: number; longitude?: number }
): Promise<RestaurantLocation> => {
  try {
    // First check if location exists
    const { data: existingLocation } = await supabase
      .from('restaurant_locations')
      .select('id')
      .eq('restaurant_id', restaurantId)
      .maybeSingle();
    
    let data;
    
    if (existingLocation) {
      // Update existing location
      const { data: updatedData, error } = await supabase
        .from('restaurant_locations')
        .update(updates)
        .eq('restaurant_id', restaurantId)
        .select()
        .single();
      
      if (error) throw error;
      data = updatedData;
    } else {
      // Create new location
      const { data: newData, error } = await supabase
        .from('restaurant_locations')
        .insert([{ restaurant_id: restaurantId, ...updates }])
        .select()
        .single();
      
      if (error) throw error;
      data = newData;
    }
    
    return {
      id: data.id,
      restaurant_id: data.restaurant_id,
      address: data.address,
      latitude: data.latitude || 0,
      longitude: data.longitude || 0
    };
  } catch (error) {
    console.error('Error updating restaurant location:', error);
    throw error;
  }
};

// Calculate distance between two coordinates using the haversine formula
export const calculateDistance = (
  lat1: number, lon1: number, 
  lat2: number, lon2: number
): number => {
  const R = 6371; // Earth radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
};

// Format distance in miles
export const formatDistance = (distanceKm: number): string => {
  const distanceMiles = distanceKm * 0.621371;
  
  if (distanceMiles < 0.1) {
    return 'Near you';
  } else if (distanceMiles < 10) {
    return `${distanceMiles.toFixed(1)} mi`;
  } else {
    return `${Math.round(distanceMiles)} mi`;
  }
};
