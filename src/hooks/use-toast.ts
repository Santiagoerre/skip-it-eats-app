
import { useState, useEffect, useMemo } from "react";
import * as React from "react";
import {
  type ToastActionElement,
  ToastProps
} from "@/components/ui/toast";

// Create separate types to avoid circular references
interface ToastOptions {
  title?: string;
  description?: string;
  action?: ToastActionElement;
  variant?: "default" | "destructive";
  [key: string]: any;
}

// Create a context for the toast state
type ToastContextValue = {
  toasts: ToastWithId[];
  toast: (opts: ToastOptions) => void;
  dismiss: (id: string) => void;
};

// Define toast with ID type
type ToastWithId = ToastOptions & {
  id: string;
};

// Create a toast context
const ToastContext = React.createContext<ToastContextValue | null>(null);

// Generate unique IDs
function generateUniqueId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// Toast provider component
export function ToastProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [toasts, setToasts] = useState<ToastWithId[]>([]);
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

  // Actual toast function with rate limiting
  const toast = useMemo(() => {
    return (options: ToastOptions) => {
      const toastKey = `${options.title || ''}-${options.description || ''}`;
      const now = Date.now();
      
      // Prevent duplicate toasts within 5 seconds
      if (recentToasts.has(toastKey) && now - recentToasts.get(toastKey)! < 5000) {
        return;
      }
      
      // Add this toast to recent toasts
      setRecentToasts(new Map(recentToasts).set(toastKey, now));
      
      // Create unique ID and add toast
      const id = generateUniqueId();
      setToasts((prev) => [...prev, { id, ...options }]);
      return id;
    };
  }, [recentToasts]);

  // Function to dismiss a toast
  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  // Create context value
  const contextValue: ToastContextValue = {
    toasts,
    toast,
    dismiss
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
    </ToastContext.Provider>
  );
}

// Hook to use toast
export function useToast() {
  const context = React.useContext(ToastContext);
  
  if (!context) {
    // Return a dummy implementation instead of throwing
    return {
      toasts: [],
      toast: () => {},
      dismiss: () => {},
    };
  }
  
  return context;
}

// Export direct toast function for non-hook usage
export const toast = (options: ToastOptions) => {
  // This is just a placeholder that will be properly initialized
  // when the actual toast is rendered by the ToastProvider
  console.log("Toast called outside of provider:", options);
};
