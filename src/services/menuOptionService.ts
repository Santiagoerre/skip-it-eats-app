
import { supabase } from "@/integrations/supabase/client";

// Types for menu options
export interface MenuOptionGroup {
  id: string;
  menu_item_id: string;
  name: string;
  description: string | null;
  selection_type: 'single' | 'multiple';
  required: boolean;
  created_at: string;
  updated_at: string;
  options?: MenuOption[]; // For nested options
}

export interface MenuOption {
  id: string;
  option_group_id: string;
  name: string;
  description: string | null;
  price_adjustment: number;
  created_at: string;
  updated_at: string;
}

export interface NewMenuOptionGroup {
  menu_item_id: string;
  name: string;
  description?: string | null;
  selection_type: 'single' | 'multiple';
  required?: boolean;
}

export interface NewMenuOption {
  option_group_id: string;
  name: string;
  description?: string | null;
  price_adjustment: number;
}

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

// Create a new option
export const createOption = async (option: NewMenuOption): Promise<MenuOption> => {
  try {
    const { data, error } = await supabase
      .from('menu_options')
      .insert(option)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating option:', error);
    throw error;
  }
};

// Update an existing option
export const updateOption = async (id: string, updates: Partial<MenuOption>): Promise<MenuOption> => {
  try {
    const { data, error } = await supabase
      .from('menu_options')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating option:', error);
    throw error;
  }
};

// Delete an option
export const deleteOption = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('menu_options')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting option:', error);
    throw error;
  }
};

// Fetch option groups for a menu item, including their options
export const fetchOptionGroupsWithOptions = async (menuItemId: string): Promise<MenuOptionGroup[]> => {
  try {
    // First, fetch all option groups for the menu item
    const { data: groups, error: groupsError } = await supabase
      .from('menu_option_groups')
      .select('*')
      .eq('menu_item_id', menuItemId)
      .order('created_at', { ascending: true });
    
    if (groupsError) throw groupsError;
    if (!groups || groups.length === 0) return [];
    
    // For each group, fetch its options
    const groupsWithOptions = await Promise.all(groups.map(async (group) => {
      const { data: options, error: optionsError } = await supabase
        .from('menu_options')
        .select('*')
        .eq('option_group_id', group.id)
        .order('created_at', { ascending: true });
      
      if (optionsError) throw optionsError;
      
      return {
        ...group,
        selection_type: group.selection_type as 'single' | 'multiple',
        options: options || []
      } as MenuOptionGroup;
    }));
    
    return groupsWithOptions;
  } catch (error) {
    console.error('Error fetching option groups with options:', error);
    return [];
  }
};
