import { useState, useCallback, useRef } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { ensureUserProfile } from "@/services/authService";
import { UserType } from "./types";

export const useUserType = () => {
  const [userType, setUserType] = useState<UserType>(null);
  // Add a ref to track ongoing profile checks
  const profileCheckInProgressRef = useRef(false);

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
    
    try {
      profileCheckInProgressRef.current = true;
      
      // First check user metadata (fastest)
      const metadataUserType = currentSession.user.user_metadata?.user_type as UserType;
      
      if (metadataUserType) {
        console.log("Found user type in metadata:", metadataUserType);
        setUserType(metadataUserType);
        
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
        setUserType(profileData.user_type as UserType);
      } else {
        console.log("No profile found for user:", currentSession.user.id);
        setUserType(null);
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
