
import { supabase } from "@/integrations/supabase/client";
import { fetchOptionGroupsWithOptions } from "./menuOptionService";

export const getMenuItemsByRestaurant = async (restaurantId: string) => {
  try {
    if (!restaurantId) {
      console.warn("No restaurant ID provided for getMenuItemsByRestaurant");
      return [];
    }

    // Fetch basic menu items first
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('restaurant_id', restaurantId);

    if (error) {
      console.error('Error fetching menu items:', error);
      throw error;
    }

    // For each menu item, fetch its option groups and options
    if (data && data.length > 0) {
      const menuItemsWithOptions = await Promise.all(
        data.map(async (item) => {
          try {
            const optionGroups = await fetchOptionGroupsWithOptions(item.id);
            return {
              ...item,
              menu_option_groups: optionGroups.length > 0 ? optionGroups : undefined
            };
          } catch (err) {
            console.error(`Error fetching options for menu item ${item.id}:`, err);
            return item;
          }
        })
      );
      return menuItemsWithOptions;
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
