
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
  clearNewSignupFlag();
  clearTemporaryCredentials();
  clearNewUserId();
  safelyRemoveSessionItem('restaurant_redirect_attempted');
  safelyRemoveSessionItem('shown_welcome_toast');
};
