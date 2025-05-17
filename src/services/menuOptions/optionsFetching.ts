
import { supabase } from "@/integrations/supabase/client";
import { MenuOptionGroup } from "./types";

// Fetch option groups for a menu item, including their options
export const fetchOptionGroupsWithOptions = async (menuItemId: string): Promise<MenuOptionGroup[]> => {
  try {
    // First, fetch all option groups for the menu item
    const { data: groups, error: groupsError } = await supabase
      .from('menu_option_groups')
      .select('*')
      .eq('menu_item_id', menuItemId)
      .order('created_at', { ascending: true });
    
    if (groupsError) {
      console.error('Error fetching option groups:', groupsError);
      throw groupsError;
    }
    
    if (!groups || groups.length === 0) {
      console.log(`No option groups found for menu item ${menuItemId}`);
      return [];
    }
    
    console.log(`Found ${groups.length} option groups for menu item ${menuItemId}`);
    
    // For each group, fetch its options
    const groupsWithOptions = await Promise.all(groups.map(async (group) => {
      try {
        const { data: options, error: optionsError } = await supabase
          .from('menu_options')
          .select('*')
          .eq('option_group_id', group.id)
          .order('created_at', { ascending: true });
        
        if (optionsError) {
          console.error(`Error fetching options for group ${group.id}:`, optionsError);
          throw optionsError;
        }
        
        console.log(`Group ${group.name} has ${options?.length || 0} options`);
        
        return {
          ...group,
          selection_type: group.selection_type as 'single' | 'multiple',
          options: options || []
        } as MenuOptionGroup;
      } catch (err) {
        console.error(`Error processing option group ${group.id}:`, err);
        return {
          ...group,
          selection_type: group.selection_type as 'single' | 'multiple',
          options: []
        } as MenuOptionGroup;
      }
    }));
    
    return groupsWithOptions;
  } catch (error) {
    console.error('Error fetching option groups with options:', error);
    return [];
  }
};
