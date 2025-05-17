
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
