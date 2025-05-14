
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
        
        // Ensure profile exists
        try {
          await ensureUserProfile(currentSession.user.id, metadataUserType);
          console.log("Profile creation/verification complete for:", currentSession.user.id);
        } catch (err) {
          console.error("Error ensuring user profile exists:", err);
        }
        
        // Set the user type from metadata
        setUserType(metadataUserType);
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
        
        // Try to create profile if it doesn't exist and we have a user type in metadata
        const userMetadataType = currentSession.user.user_metadata?.user_type as UserType;
        if (userMetadataType) {
          console.log("Attempting to create missing profile with type from metadata:", userMetadataType);
          try {
            await ensureUserProfile(currentSession.user.id, userMetadataType);
            setUserType(userMetadataType);
          } catch (err) {
            console.error("Failed to create profile from metadata:", err);
          }
        }
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
