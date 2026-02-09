import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WorkoutCalendarProps {
  workoutDates: string[];
  onDateSelect: (date: string) => void;
  selectedDate?: string;
}

export function WorkoutCalendar({
  workoutDates,
  onDateSelect,
  selectedDate,
}: WorkoutCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const monthName = currentDate.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const days = [];

  // Add empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  // Add days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const formatDateString = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });
  };

  const handlePrevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
    );
  };

  const hasWorkout = (day: number) => {
    const dateStr = formatDateString(day);
    return workoutDates.includes(dateStr);
  };

  return (
    <div className="card-premium p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-slate-900">{monthName}</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevMonth}
            className="border-slate-300"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextMonth}
            className="border-slate-300"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="text-center text-xs font-semibold text-slate-600 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const dateStr = formatDateString(day);
          const hasWorkoutOnDay = hasWorkout(day);
          const isSelected = selectedDate === dateStr;

          return (
            <button
              key={day}
              onClick={() => onDateSelect(dateStr)}
              className={`aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-colors relative ${
                isSelected
                  ? "bg-slate-800 text-white"
                  : hasWorkoutOnDay
                    ? "bg-slate-200 text-slate-900 hover:bg-slate-300"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {day}
              {hasWorkoutOnDay && !isSelected && (
                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-slate-800 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-slate-200 space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-3 h-3 bg-slate-200 rounded" />
          <span className="text-slate-600">Workout logged</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-3 h-3 bg-slate-100 rounded" />
          <span className="text-slate-600">No workout</span>
        </div>
      </div>
    </div>
  );
}
