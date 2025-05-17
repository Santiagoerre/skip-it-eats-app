
import {
  MenuOptionGroup,
  MenuOption,
  NewMenuOptionGroup,
  NewMenuOption,
  createOptionGroup,
  updateOptionGroup,
  deleteOptionGroup,
  createOption,
  updateOption,
  deleteOption,
  fetchOptionGroupsWithOptions
} from './menuOptions';

// Re-export all types and functions for backward compatibility
// This will allow existing code to continue working during the transition
export type { MenuOptionGroup, MenuOption, NewMenuOptionGroup, NewMenuOption };
export {
  createOptionGroup,
  updateOptionGroup,
  deleteOptionGroup,
  createOption,
  updateOption,
  deleteOption,
  fetchOptionGroupsWithOptions
};
