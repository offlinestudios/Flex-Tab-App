import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { WorkoutCalendar } from "@/components/WorkoutCalendar";

interface CalendarModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workoutDates: string[];
  selectedDate?: string;
  onDateSelect: (date: string | undefined) => void;
}

export function CalendarModal({
  open,
  onOpenChange,
  workoutDates,
  selectedDate,
  onDateSelect,
}: CalendarModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Workout Calendar</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <WorkoutCalendar
            workoutDates={workoutDates}
            selectedDate={selectedDate}
            onDateSelect={onDateSelect}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
