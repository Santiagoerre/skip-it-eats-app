
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
        
        // Ensure profile exists with multiple retries
        let profileCreated = false;
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const success = await ensureUserProfile(currentSession.user.id, metadataUserType);
            if (success) {
              profileCreated = true;
              console.log(`Profile creation/verification complete on attempt ${attempt + 1} for:`, currentSession.user.id);
              break;
            }
            console.log(`Profile creation failed on attempt ${attempt + 1}, will retry`);
            await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          } catch (err) {
            console.error(`Error ensuring user profile exists on attempt ${attempt + 1}:`, err);
          }
        }
        
        if (!profileCreated) {
          console.error("All profile creation attempts failed for:", currentSession.user.id);
        }
        
        // Set the user type from metadata
        setUserType(metadataUserType);
        return;
      }
      
      // Then check profiles table with multiple retries
      let profileData = null;
      let profileError = null;
      
      for (let attempt = 0; attempt < 3; attempt++) {
        const result = await supabase
          .from("profiles")
          .select("user_type")
          .eq("id", currentSession.user.id)
          .maybeSingle();
        
        profileData = result.data;
        profileError = result.error;
        
        if (!profileError && profileData) {
          break;
        }
        
        console.log(`Profile fetch attempt ${attempt + 1} failed, will retry`);
        await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
      }
      
      if (profileError) {
        console.error("Error fetching user type after multiple attempts:", profileError);
        setUserType(null);
        return;
      }
      
      if (profileData) {
        console.log("Found user type in profile:", profileData.user_type);
        setUserType(profileData.user_type as UserType);
      } else {
        console.log("No profile found for user:", currentSession.user.id);
        setUserType(null);
        
        // Try to create profile if it doesn't exist and we have a user type in metadata
        const userMetadataType = currentSession.user.user_metadata?.user_type as UserType;
        if (userMetadataType) {
          console.log("Attempting to create missing profile with type from metadata:", userMetadataType);
          try {
            const success = await ensureUserProfile(currentSession.user.id, userMetadataType);
            if (success) {
              console.log("Successfully created missing profile from metadata");
              setUserType(userMetadataType);
            } else {
              console.error("Failed to create profile from metadata after multiple attempts");
            }
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
