
/**
 * Helper functions for managing auth state and signup flow flags
 */

/**
 * Marks the current user flow as a new signup 
 */
export const markAsNewSignupFlow = (): void => {
  sessionStorage.setItem('is_new_signup', 'true');
};

/**
 * Clears the new signup flow flag
 */
export const clearNewSignupFlag = (): void => {
  sessionStorage.removeItem('is_new_signup');
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
  sessionStorage.setItem('temp_email', email);
  sessionStorage.setItem('temp_password', password);
};

/**
 * Clears temporary credentials from session storage
 */
export const clearTemporaryCredentials = (): void => {
  sessionStorage.removeItem('temp_email');
  sessionStorage.removeItem('temp_password');
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
  sessionStorage.setItem('new_user_id', userId);
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
  sessionStorage.removeItem('new_user_id');
};
