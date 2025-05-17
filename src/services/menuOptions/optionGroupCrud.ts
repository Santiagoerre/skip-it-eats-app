
import { supabase } from "@/integrations/supabase/client";
import { MenuOptionGroup, NewMenuOptionGroup } from "./types";

// Create a new option group
export const createOptionGroup = async (optionGroup: NewMenuOptionGroup): Promise<MenuOptionGroup> => {
  try {
    const { data, error } = await supabase
      .from('menu_option_groups')
      .insert(optionGroup)
      .select()
      .single();
    
    if (error) throw error;
    return data as MenuOptionGroup;
  } catch (error) {
    console.error('Error creating option group:', error);
    throw error;
  }
};

// Update an existing option group
export const updateOptionGroup = async (id: string, updates: Partial<MenuOptionGroup>): Promise<MenuOptionGroup> => {
  try {
    const { data, error } = await supabase
      .from('menu_option_groups')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as MenuOptionGroup;
  } catch (error) {
    console.error('Error updating option group:', error);
    throw error;
  }
};

// Delete an option group
export const deleteOptionGroup = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('menu_option_groups')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting option group:', error);
    throw error;
  }
};
