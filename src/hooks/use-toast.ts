
import { useState, useEffect, useMemo } from "react";
import { useToast as useShadcnToast } from "@/components/ui/use-toast";

type ToastOptions = Parameters<ReturnType<typeof useShadcnToast>["toast"]>[0];

/**
 * Enhanced toast hook with rate limiting and stabilization
 */
export function useToast() {
  const shadcnToast = useShadcnToast();
  const [recentToasts, setRecentToasts] = useState<Map<string, number>>(new Map());
  
  // Clean up old toasts every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const newRecentToasts = new Map(recentToasts);
      
      for (const [key, timestamp] of recentToasts.entries()) {
        if (now - timestamp > 10000) { // 10 seconds
          newRecentToasts.delete(key);
        }
      }
      
      setRecentToasts(newRecentToasts);
    }, 10000);
    
    return () => clearInterval(interval);
  }, [recentToasts]);
  
  // Rate-limited toast function
  const toast = useMemo(() => {
    return (options: ToastOptions) => {
      const toastKey = `${options.title}-${options.description}`;
      const now = Date.now();
      
      // Prevent duplicate toasts within 5 seconds
      if (recentToasts.has(toastKey) && now - recentToasts.get(toastKey)! < 5000) {
        return;
      }
      
      // Add this toast to recent toasts
      setRecentToasts(new Map(recentToasts).set(toastKey, now));
      
      // Call the actual toast function
      return shadcnToast.toast(options);
    };
  }, [shadcnToast, recentToasts]);
  
  return {
    ...shadcnToast,
    toast
  };
}

// Export a direct toast function for non-component usage
export const toast = (options: ToastOptions) => {
  // This will use the default toast function from shadcn/ui
  // Import this in components that don't have access to hooks
  return useShadcnToast().toast(options);
};
