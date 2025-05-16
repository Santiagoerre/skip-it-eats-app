
import { useState, useCallback, useRef, useEffect } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { ensureUserProfile } from "@/services/authService";
import { UserType } from "./types";

export const useUserType = () => {
  const [userType, setUserType] = useState<UserType>(null);
  // Add a ref to track ongoing profile checks
  const profileCheckInProgressRef = useRef(false);
  // Add a cache to prevent repetitive DB queries
  const userTypeCache = useRef<Record<string, { type: UserType, timestamp: number }>>({});

  // Clear old cache entries periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const cacheLifetime = 30 * 60 * 1000; // 30 minutes
      
      Object.keys(userTypeCache.current).forEach(userId => {
        const entry = userTypeCache.current[userId];
        if (now - entry.timestamp > cacheLifetime) {
          delete userTypeCache.current[userId];
        }
      });
    }, 5 * 60 * 1000); // Check every 5 minutes
    
    return () => clearInterval(interval);
  }, []);

  const getUserTypeFromSession = useCallback(async (currentSession: Session | null) => {
    // Prevent multiple simultaneous profile checks
    if (profileCheckInProgressRef.current) {
      console.log("Profile check already in progress, skipping");
      return;
    }

    if (!currentSession?.user) {
      console.log("No user in session, setting userType to null");
      setUserType(null);
      return;
    }
    
    const userId = currentSession.user.id;
    
    // Check cache first for fast retrieval
    if (userTypeCache.current[userId]) {
      const cachedType = userTypeCache.current[userId].type;
      console.log("Using cached user type:", cachedType);
      setUserType(cachedType);
      return;
    }
    
    try {
      profileCheckInProgressRef.current = true;
      
      // First check user metadata (fastest)
      const metadataUserType = currentSession.user.user_metadata?.user_type as UserType;
      
      if (metadataUserType) {
        console.log("Found user type in metadata:", metadataUserType);
        setUserType(metadataUserType);
        
        // Update cache
        userTypeCache.current[userId] = {
          type: metadataUserType,
          timestamp: Date.now()
        };
        
        // Ensure profile exists in background
        ensureUserProfile(currentSession.user.id, metadataUserType)
          .then(success => {
            if (success) {
              console.log("Profile creation/verification complete for:", currentSession.user.id);
            } else {
              console.error("Profile creation failed for:", currentSession.user.id);
            }
          })
          .catch(err => console.error("Error ensuring user profile:", err))
          .finally(() => {
            profileCheckInProgressRef.current = false;
          });
        
        return;
      }
      
      // Then check profiles table (single attempt)
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("user_type")
        .eq("id", currentSession.user.id)
        .maybeSingle();
      
      if (profileError) {
        console.error("Error fetching user type:", profileError);
        setUserType(null);
        return;
      }
      
      if (profileData) {
        console.log("Found user type in profile:", profileData.user_type);
        const dbUserType = profileData.user_type as UserType;
        setUserType(dbUserType);
        
        // Update cache
        userTypeCache.current[userId] = {
          type: dbUserType,
          timestamp: Date.now()
        };
      } else {
        console.log("No profile found for user:", currentSession.user.id);
        setUserType(null);
        
        // Try to create profile from metadata as fallback
        if (currentSession.user.user_metadata) {
          const metaUserType = currentSession.user.user_metadata.user_type as UserType;
          if (metaUserType) {
            console.log("Attempting to create profile with type from metadata:", metaUserType);
            const success = await ensureUserProfile(currentSession.user.id, metaUserType);
            if (success) {
              console.log("Successfully created profile from metadata");
              setUserType(metaUserType);
              
              // Update cache
              userTypeCache.current[userId] = {
                type: metaUserType,
                timestamp: Date.now()
              };
            }
          }
        }
      }
    } catch (err) {
      console.error("Failed to get user type:", err);
      setUserType(null);
    } finally {
      profileCheckInProgressRef.current = false;
    }
  }, []);

  return {
    userType,
    setUserType,
    getUserTypeFromSession
  };
};
