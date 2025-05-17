
import { supabase } from "@/integrations/supabase/client";
import { MenuOption, NewMenuOption } from "./types";

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
