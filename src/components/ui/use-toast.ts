
// This file now simply re-exports the toast implementation from shadcn/ui
import { toast, useToast as useToastOriginal } from "@/hooks/use-toast";

export { toast, useToastOriginal as useToast };
