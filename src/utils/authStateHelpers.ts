
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

// Safely set localStorage items
const safelySetLocalStorageItem = (key: string, value: string) => {
  if (localStorage.getItem(key) !== value) {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error(`Failed to set ${key} in localStorage:`, error);
    }
  }
};

// Safely get localStorage items
const safelyGetLocalStorageItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error(`Failed to get ${key} from localStorage:`, error);
    return null;
  }
};

// Safely remove localStorage items
const safelyRemoveLocalStorageItem = (key: string) => {
  if (localStorage.getItem(key) !== null) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove ${key} from localStorage:`, error);
    }
  }
};

/**
 * Marks the current user flow as a new signup 
 */
export const markAsNewSignupFlow = (): void => {
  safelySetSessionItem('is_new_signup', 'true');
  // Also store in localStorage for persistence across redirects
  safelySetLocalStorageItem('skipit_new_signup', 'true');
};

/**
 * Clears the new signup flow flag
 */
export const clearNewSignupFlag = (): void => {
  safelyRemoveSessionItem('is_new_signup');
  safelyRemoveLocalStorageItem('skipit_new_signup');
};

/**
 * Checks if the current flow is a new signup
 */
export const isNewSignupFlow = (): boolean => {
  return (
    window.location.search.includes('new=true') || 
    sessionStorage.getItem('is_new_signup') === 'true' ||
    localStorage.getItem('skipit_new_signup') === 'true'
  );
};

/**
 * Preserves critical state information for redirection
 */
export const preserveRedirectState = (userId: string | undefined, userType: "customer" | "restaurant" | null): void => {
  console.log("Preserving redirect state:", { userId, userType });
  
  if (userId) {
    safelySetLocalStorageItem('skipit_user_id', userId);
  }
  
  if (userType) {
    safelySetLocalStorageItem('skipit_user_type', userType);
  }
  
  // Mark that redirect is in progress
  safelySetLocalStorageItem('skipit_redirect_in_progress', 'true');
  safelySetLocalStorageItem('skipit_redirect_timestamp', Date.now().toString());
};

/**
 * Restores redirect state information
 */
export const restoreRedirectState = (): "customer" | "restaurant" | null => {
  const userType = safelyGetLocalStorageItem('skipit_user_type') as "customer" | "restaurant" | null;
  const redirectTimestamp = safelyGetLocalStorageItem('skipit_redirect_timestamp');
  
  console.log("Restoring redirect state:", { userType, redirectTimestamp });
  
  // Only use stored redirect info if it's recent (within 5 minutes)
  if (redirectTimestamp) {
    const timestamp = parseInt(redirectTimestamp, 10);
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    
    if (now - timestamp > fiveMinutes) {
      console.log("Stored redirect state is too old, ignoring");
      clearRedirectState();
      return null;
    }
  }
  
  return userType;
};

/**
 * Clears redirect state information
 */
export const clearRedirectState = (): void => {
  safelyRemoveLocalStorageItem('skipit_user_id');
  safelyRemoveLocalStorageItem('skipit_user_type');
  safelyRemoveLocalStorageItem('skipit_redirect_in_progress');
  safelyRemoveLocalStorageItem('skipit_redirect_timestamp');
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
  // Also store in localStorage for persistence
  safelySetLocalStorageItem('skipit_new_user_id', userId);
};

/**
 * Gets the ID of a newly created account
 */
export const getNewUserId = (): string | null => {
  return sessionStorage.getItem('new_user_id') || localStorage.getItem('skipit_new_user_id');
};

/**
 * Clears the new user ID from session storage
 */
export const clearNewUserId = (): void => {
  safelyRemoveSessionItem('new_user_id');
  safelyRemoveLocalStorageItem('skipit_new_user_id');
};

/**
 * Records the OAuth provider being used during signup
 */
export const recordOAuthProvider = (provider: string): void => {
  safelySetSessionItem('oauth_provider', provider);
  safelySetLocalStorageItem('skipit_oauth_provider', provider);
};

/**
 * Gets the OAuth provider used during signup
 */
export const getOAuthProvider = (): string | null => {
  return sessionStorage.getItem('oauth_provider') || localStorage.getItem('skipit_oauth_provider');
};

/**
 * Clears the OAuth provider from session storage
 */
export const clearOAuthProvider = (): void => {
  safelyRemoveSessionItem('oauth_provider');
  safelyRemoveLocalStorageItem('skipit_oauth_provider');
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
  clearOAuthProvider();
  clearRedirectState();
  
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
  safelyRemoveSessionItem('google_auth_pending');
  safelyRemoveSessionItem('oauth_flow_started');
  safelyRemoveSessionItem('oauth_provider');
  safelyRemoveSessionItem('oauth_redirect_pending');
  
  // Local storage cleanup (for persisted states)
  try {
    localStorage.removeItem('skipit_auth_redirect_pending');
    localStorage.removeItem('skipit_signup_pending');
    localStorage.removeItem('skipit_oauth_flow');
    localStorage.removeItem('skipit_new_signup');
    localStorage.removeItem('skipit_new_user_id');
    localStorage.removeItem('skipit_oauth_provider');
    localStorage.removeItem('skipit_restaurant_created');
    localStorage.removeItem('skipit_signup_complete');
  } catch (error) {
    console.error("Failed to clean localStorage items:", error);
  }
  
  // Remove any URL parameters that might trigger signup redirects
  if (window.history && window.history.replaceState) {
    try {
      const url = new URL(window.location.href);
      let modified = false;
      
      // Clear standard signup parameters
      const paramsToRemove = [
        'new', 'signup', 'success', 'provider', 
        'oauth', 'flow', 'access_token', 'token_type', 
        'expires_in', 'state', 'provider_token'
      ];
      
      for (const param of paramsToRemove) {
        if (url.searchParams.has(param)) {
          url.searchParams.delete(param);
          modified = true;
        }
      }
      
      // Only update history if we changed the URL
      if (modified) {
        window.history.replaceState({}, document.title, url.toString());
      }
      
      // Also clean up any hash fragments that might include OAuth tokens
      if (window.location.hash && (
        window.location.hash.includes('access_token') || 
        window.location.hash.includes('token_type')
      )) {
        window.history.replaceState({}, document.title, 
          window.location.pathname + window.location.search);
      }
    } catch (error) {
      console.error("Failed to clean URL parameters:", error);
    }
  }
};
