
export type OrderStatus = "pending" | "confirmed" | "completed" | "cancelled";

export interface ScheduleInfo {
  scheduledTime?: string;
  isScheduled: boolean;
}

export interface PreparationTimeInfo {
  estimatedMinutes: number;
}
