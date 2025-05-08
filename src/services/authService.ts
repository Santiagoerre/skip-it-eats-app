
import { supabase } from "@/integrations/supabase/client";

export const checkAuth = async (): Promise<boolean> => {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
};

export const getCurrentUserType = async (): Promise<'customer' | 'restaurant' | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return null;
  }
  
  // Get user type from the profile
  const { data, error } = await supabase
    .from('profiles')
    .select('user_type')
    .eq('id', session.user.id)
    .single();
  
  if (error || !data) {
    console.error('Error getting user type:', error);
    return null;
  }
  
  return data.user_type as 'customer' | 'restaurant';
};
