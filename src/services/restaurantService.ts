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

export const fetchRestaurants = async (): Promise<Restaurant[]> => {
  try {
    const { data, error } = await supabase
      .from('restaurant_details')
      .select('*, restaurant_id');
    
    if (error) throw error;
    
    if (!data || data.length === 0) {
      return [];
    }
    
    // Transform data to match our interface
    return data.map(item => ({
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
    const { data, error } = await supabase
      .from('restaurant_details')
      .select('*')
      .eq('restaurant_id', id)
      .single();
    
    if (error) throw error;
    
    if (!data) {
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
    const { data, error } = await supabase
      .from('restaurant_locations')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .single();
    
    if (error) throw error;
    
    if (!data) {
      return null;
    }
    
    return {
      id: data.id,
      restaurant_id: data.restaurant_id,
      address: data.address,
      latitude: data.latitude,
      longitude: data.longitude
    };
  } catch (error) {
    console.error('Error fetching restaurant location:', error);
    return null;
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
