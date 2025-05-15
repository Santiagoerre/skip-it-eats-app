
/**
 * Helper functions for managing auth state and signup flow flags
 */

// Prevent duplicate writes to session storage
const safelySetSessionItem = (key: string, value: string) => {
  if (sessionStorage.getItem(key) !== value) {
    try {
      sessionStorage.setItem(key, value);
    } catch (error) {
      console.error(`Failed to set ${key} in sessionStorage:`, error);
    }
  }
};

// Prevent unnecessary removals from session storage
const safelyRemoveSessionItem = (key: string) => {
  if (sessionStorage.getItem(key) !== null) {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove ${key} from sessionStorage:`, error);
    }
  }
};

/**
 * Marks the current user flow as a new signup 
 */
export const markAsNewSignupFlow = (): void => {
  safelySetSessionItem('is_new_signup', 'true');
};

/**
 * Clears the new signup flow flag
 */
export const clearNewSignupFlag = (): void => {
  safelyRemoveSessionItem('is_new_signup');
};

/**
 * Checks if the current flow is a new signup
 */
export const isNewSignupFlow = (): boolean => {
  return (
    window.location.search.includes('new=true') || 
    sessionStorage.getItem('is_new_signup') === 'true'
  );
};

/**
 * Temporarily stores user credentials for auto sign-in after signup
 */
export const storeTemporaryCredentials = (email: string, password: string): void => {
  if (!email || !password) {
    console.warn("Attempted to store empty credentials");
    return;
  }
  safelySetSessionItem('temp_email', email);
  safelySetSessionItem('temp_password', password);
};

/**
 * Clears temporary credentials from session storage
 */
export const clearTemporaryCredentials = (): void => {
  safelyRemoveSessionItem('temp_email');
  safelyRemoveSessionItem('temp_password');
};

/**
 * Gets temporary credentials from session storage
 */
export const getTemporaryCredentials = (): { email: string | null, password: string | null } => {
  return {
    email: sessionStorage.getItem('temp_email'),
    password: sessionStorage.getItem('temp_password')
  };
};

/**
 * Records the user ID of a newly created account
 */
export const recordNewUserId = (userId: string): void => {
  if (!userId) {
    console.warn("Attempted to record empty user ID");
    return;
  }
  safelySetSessionItem('new_user_id', userId);
};

/**
 * Gets the ID of a newly created account
 */
export const getNewUserId = (): string | null => {
  return sessionStorage.getItem('new_user_id');
};

/**
 * Clears the new user ID from session storage
 */
export const clearNewUserId = (): void => {
  safelyRemoveSessionItem('new_user_id');
};

/**
 * Clears all signup related session storage values at once
 */
export const clearAllSignupFlags = (): void => {
  console.log("Clearing all signup flags");
  
  // Core signup flags
  clearNewSignupFlag();
  clearTemporaryCredentials();
  clearNewUserId();
  
  // Clear additional flags that might cause loops or redirection issues
  safelyRemoveSessionItem('restaurant_redirect_attempted');
  safelyRemoveSessionItem('shown_welcome_toast');
  safelyRemoveSessionItem('profile_check_completed');
  safelyRemoveSessionItem('redirect_in_progress');
  safelyRemoveSessionItem('auth_check_completed');
  safelyRemoveSessionItem('redirect_attempted');
  safelyRemoveSessionItem('redirecting_to_dashboard');
  safelyRemoveSessionItem('auth_initialized');
  safelyRemoveSessionItem('user_type_verified');
  safelyRemoveSessionItem('user_verified');
  safelyRemoveSessionItem('profile_verified');
  safelyRemoveSessionItem('signup_complete');
  safelyRemoveSessionItem('signup_success');
  safelyRemoveSessionItem('redirect_started');
  safelyRemoveSessionItem('profile_created');
  safelyRemoveSessionItem('restaurant_created');
  
  // Remove any URL parameters that might trigger signup redirects
  if (window.history && window.history.replaceState) {
    try {
      const url = new URL(window.location.href);
      let modified = false;
      
      // Clear standard signup parameters
      if (url.searchParams.has('new')) {
        url.searchParams.delete('new');
        modified = true;
      }
      
      if (url.searchParams.has('signup')) {
        url.searchParams.delete('signup');
        modified = true;
      }
      
      if (url.searchParams.has('success')) {
        url.searchParams.delete('success');
        modified = true;
      }
      
      // Only update history if we changed the URL
      if (modified) {
        window.history.replaceState({}, document.title, url.toString());
      }
    } catch (error) {
      console.error("Failed to clean URL parameters:", error);
    }
  }
};
