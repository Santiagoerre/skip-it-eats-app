
import { supabase } from "@/integrations/supabase/client";

export const getMenuItemsByRestaurant = async (restaurantId: string) => {
  try {
    if (!restaurantId) {
      console.warn("No restaurant ID provided for getMenuItemsByRestaurant");
      return [];
    }

    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('restaurant_id', restaurantId);

    if (error) {
      console.error('Error fetching menu items:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching menu items:', error);
    return [];
  }
};

export const getMenuItemById = async (itemId: string) => {
  try {
    if (!itemId) {
      console.warn("No item ID provided for getMenuItemById");
      return null;
    }

    const { data, error } = await supabase
      .from('menu_items')
      .select('*, menu_option_groups(*), menu_option_groups.menu_options(*)')
      .eq('id', itemId)
      .single();

    if (error) {
      console.error('Error fetching menu item:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching menu item:', error);
    return null;
  }
};
