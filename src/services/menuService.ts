
import { supabase } from "@/integrations/supabase/client";
import { fetchOptionGroupsWithOptions } from "./menuOptions";

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
      console.log(`Fetching option groups for ${data.length} menu items`);
      
      const menuItemsWithOptions = await Promise.all(
        data.map(async (item) => {
          try {
            console.log(`Fetching options for menu item: ${item.id} (${item.name})`);
            const optionGroups = await fetchOptionGroupsWithOptions(item.id);
            console.log(`Found ${optionGroups.length} option groups for ${item.name}`);
            
            return {
              ...item,
              menu_option_groups: optionGroups
            };
          } catch (err) {
            console.error(`Error fetching options for menu item ${item.id}:`, err);
            return {
              ...item,
              menu_option_groups: []
            };
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
      .select('*')
      .eq('id', itemId)
      .single();

    if (error) {
      console.error('Error fetching menu item:', error);
      throw error;
    }

    if (data) {
      // Fetch option groups with options for this menu item
      try {
        console.log(`Fetching option groups for menu item: ${data.id}`);
        const optionGroups = await fetchOptionGroupsWithOptions(data.id);
        console.log(`Found ${optionGroups.length} option groups for item ${data.name}`);
        
        return {
          ...data,
          menu_option_groups: optionGroups
        };
      } catch (err) {
        console.error(`Error fetching options for menu item ${data.id}:`, err);
        return {
          ...data,
          menu_option_groups: []
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Error fetching menu item:', error);
    return null;
  }
};
