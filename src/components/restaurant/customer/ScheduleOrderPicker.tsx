
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ScheduleOrderPickerProps {
  onScheduleChange: (scheduledDate: Date | null) => void;
  className?: string;
}

const ScheduleOrderPicker = ({ onScheduleChange, className }: ScheduleOrderPickerProps) => {
  const [isScheduled, setIsScheduled] = useState(false);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState("12:00");
  
  // Generate time slots every 15 minutes
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 10; hour < 22; hour++) { // 10 AM to 10 PM
      for (let minute = 0; minute < 60; minute += 15) {
        const formattedHour = hour.toString().padStart(2, '0');
        const formattedMinute = minute.toString().padStart(2, '0');
        slots.push(`${formattedHour}:${formattedMinute}`);
      }
    }
    return slots;
  };
  
  const timeSlots = generateTimeSlots();
  
  const handleScheduleToggle = (toggle: boolean) => {
    setIsScheduled(toggle);
    
    if (!toggle) {
      // If scheduling is turned off, clear the scheduled date
      onScheduleChange(null);
      return;
    }
    
    if (date) {
      const [hours, minutes] = time.split(':').map(Number);
      const scheduledDate = new Date(date);
      scheduledDate.setHours(hours, minutes);
      onScheduleChange(scheduledDate);
    }
  };
  
  const handleDateChange = (newDate: Date | undefined) => {
    setDate(newDate);
    
    if (newDate && isScheduled) {
      const [hours, minutes] = time.split(':').map(Number);
      const scheduledDate = new Date(newDate);
      scheduledDate.setHours(hours, minutes);
      onScheduleChange(scheduledDate);
    }
  };
  
  const handleTimeChange = (newTime: string) => {
    setTime(newTime);
    
    if (date && isScheduled) {
      const [hours, minutes] = newTime.split(':').map(Number);
      const scheduledDate = new Date(date);
      scheduledDate.setHours(hours, minutes);
      onScheduleChange(scheduledDate);
    }
  };
  
  return (
    <div className={cn("mt-4", className)}>
      <div className="flex items-center justify-between mb-2">
        <Label htmlFor="schedule-toggle" className="text-sm font-medium">
          Schedule for later?
        </Label>
        <Button
          variant={isScheduled ? "default" : "outline"}
          size="sm"
          onClick={() => handleScheduleToggle(!isScheduled)}
          className="h-8"
        >
          {isScheduled ? "Scheduled" : "Schedule"}
        </Button>
      </div>
      
      {isScheduled && (
        <div className="space-y-4 mt-3 p-3 bg-muted/50 rounded-md">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date-picker" className="text-sm font-medium mb-1 block">
                Select Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date-picker"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Select a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={handleDateChange}
                    initialFocus
                    disabled={(date) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return date < today;
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <Label htmlFor="time-picker" className="text-sm font-medium mb-1 block">
                Select Time
              </Label>
              <Select value={time} onValueChange={handleTimeChange}>
                <SelectTrigger id="time-picker" className="w-full">
                  <SelectValue placeholder="Select a time" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((slot) => (
                    <SelectItem key={slot} value={slot}>
                      {slot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {date && (
            <div className="text-sm font-medium text-center text-primary">
              Your order will be scheduled for {format(date, "MMMM d")} at {time}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ScheduleOrderPicker;
