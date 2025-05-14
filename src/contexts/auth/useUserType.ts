
import { useState, useCallback } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { ensureUserProfile } from "@/services/authService";
import { UserType } from "./types";

export const useUserType = () => {
  const [userType, setUserType] = useState<UserType>(null);

  // Helper function to safely get user type
  const getUserTypeFromSession = useCallback(async (currentSession: Session | null) => {
    if (!currentSession?.user) {
      console.log("No user in session, setting userType to null");
      setUserType(null);
      return;
    }
    
    try {
      // First check user metadata
      const metadataUserType = currentSession.user.user_metadata?.user_type as UserType;
      
      if (metadataUserType) {
        console.log("Found user type in metadata:", metadataUserType);
        setUserType(metadataUserType);
        
        // Ensure profile exists with setTimeout to prevent deadlocks
        setTimeout(async () => {
          try {
            const profileCreated = await ensureUserProfile(currentSession.user.id, metadataUserType);
            console.log("Profile creation result:", profileCreated);
          } catch (err) {
            console.error("Error ensuring user profile exists:", err);
          }
        }, 100);
        
        return;
      }
      
      // Then check profiles table
      const { data, error } = await supabase
        .from("profiles")
        .select("user_type")
        .eq("id", currentSession.user.id)
        .maybeSingle();
      
      if (error) {
        console.error("Error fetching user type:", error);
        setUserType(null);
        return;
      }
      
      if (data) {
        console.log("Found user type in profile:", data.user_type);
        setUserType(data.user_type as UserType);
      } else {
        console.log("No profile found for user:", currentSession.user.id);
        setUserType(null);
      }
    } catch (err) {
      console.error("Failed to get user type:", err);
      setUserType(null);
    }
  }, []);

  return {
    userType,
    setUserType,
    getUserTypeFromSession
  };
};
