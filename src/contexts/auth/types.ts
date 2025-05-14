
import { Session, User } from "@supabase/supabase-js";

export type UserType = "customer" | "restaurant" | null;

export interface AuthContextType {
  session: Session | null;
  user: User | null;
  userType: UserType;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userType: UserType, metadata?: any) => Promise<{ data?: any; error?: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}
