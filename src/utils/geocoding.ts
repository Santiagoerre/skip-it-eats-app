
// A utility file for geocoding operations

// Cache for address suggestions to reduce API calls
const suggestionCache = new Map<string, string[]>();
const coordinateCache = new Map<string, { lat: number; lng: number }>();
const reverseCache = new Map<string, string>();

/**
 * Get address suggestions from OpenStreetMap Nominatim API
 */
export const getAddressSuggestions = async (query: string): Promise<string[]> => {
  if (query.length < 3) {
    return [];
  }

  // Check cache first
  if (suggestionCache.has(query)) {
    return suggestionCache.get(query) || [];
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
      {
        headers: {
          "Accept-Language": "en-US,en",
          "User-Agent": "SkipItApp/1.0"
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Network error: ${response.status}`);
    }
    
    const data = await response.json();
    if (Array.isArray(data)) {
      const addresses = data.map((item: any) => item.display_name);
      
      // Cache the results
      suggestionCache.set(query, addresses);
      
      return addresses;
    }
    
    return [];
  } catch (error) {
    console.error("Error fetching address suggestions:", error);
    return [];
  }
};

/**
 * Get coordinates for an address from OpenStreetMap Nominatim API
 */
export const getCoordinatesForAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
  if (!address || address.trim().length < 5) {
    return null;
  }

  // Check cache first
  const cacheKey = address.trim().toLowerCase();
  if (coordinateCache.has(cacheKey)) {
    return coordinateCache.get(cacheKey) || null;
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      {
        headers: {
          "Accept-Language": "en-US,en",
          "User-Agent": "SkipItApp/1.0"
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Network error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (Array.isArray(data) && data.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);
      
      if (isNaN(lat) || isNaN(lng)) {
        throw new Error("Invalid coordinates returned");
      }
      
      const result = { lat, lng };
      
      // Cache the results
      coordinateCache.set(cacheKey, result);
      
      return result;
    }
    
    return null;
  } catch (error) {
    console.error("Error getting coordinates for address:", error);
    return null;
  }
};

/**
 * Get address from coordinates using OpenStreetMap Nominatim API (reverse geocoding)
 */
export const getAddressFromCoordinates = async (lat: number, lng: number): Promise<string | null> => {
  // Check cache first
  const cacheKey = `${lat},${lng}`;
  if (reverseCache.has(cacheKey)) {
    return reverseCache.get(cacheKey) || null;
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          "Accept-Language": "en-US,en",
          "User-Agent": "SkipItApp/1.0"
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Network error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data && data.display_name) {
      // Cache the result
      reverseCache.set(cacheKey, data.display_name);
      
      return data.display_name;
    }
    
    return null;
  } catch (error) {
    console.error("Error reverse geocoding:", error);
    return null;
  }
};

/**
 * Standardize an address format
 */
export const standardizeAddress = (address: string): string => {
  // This is a simple implementation, but could be more complex in a real app
  return address.trim();
};

/**
 * Clear all caches
 */
export const clearGeoCaches = () => {
  suggestionCache.clear();
  coordinateCache.clear();
  reverseCache.clear();
};
