import { Plus, ChevronDown } from "lucide-react";
import { Exercise } from "@/lib/exercises";

interface ExerciseSidebarProps {
  groupedExercises: Record<string, Exercise[]>;
  customExercises: Exercise[];
  selectedExercises: Exercise[];
  expandedCategories: Record<string, boolean>;
  onToggleCategory: (category: string) => void;
  onSelectExercise: (exercise: Exercise) => void;
  onAddCustom: () => void;
}

export function ExerciseSidebar({
  groupedExercises,
  customExercises,
  selectedExercises,
  expandedCategories,
  onToggleCategory,
  onSelectExercise,
  onAddCustom,
}: ExerciseSidebarProps) {
  return (
    <div className="space-y-3">
      {/* Preset Exercises with Collapsible Categories */}
      {Object.entries(groupedExercises).map(([category, exercises]) => (
        <div key={category} className="border border-slate-200 rounded-lg overflow-hidden">
          <button
            onClick={() => onToggleCategory(category)}
            className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
          >
            <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">
              {category}
            </h3>
            <ChevronDown
              className={`w-4 h-4 text-slate-600 transition-transform ${
                expandedCategories[category] ? "rotate-180" : ""
              }`}
            />
          </button>
          {expandedCategories[category] && (
            <div className="space-y-2 p-3 bg-white max-h-96 overflow-y-auto">
              {exercises.map((exercise) => (
                <button
                  key={exercise.id}
                  onClick={() => onSelectExercise(exercise)}
                  className={`w-full text-left px-3 py-2 rounded-md transition-all text-sm font-medium ${
                    selectedExercises.find((e) => e.id === exercise.id)
                      ? "bg-cyan-500 text-white shadow-md"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-150 border border-slate-200"
                  }`}
                >
                  <span>+ {exercise.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Custom Exercises Section */}
      {customExercises.length > 0 && (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <button
            onClick={() => onToggleCategory("Custom")}
            className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
          >
            <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">
              Custom Exercises
            </h3>
            <ChevronDown
              className={`w-4 h-4 text-slate-600 transition-transform ${
                expandedCategories["Custom"] ? "rotate-180" : ""
              }`}
            />
          </button>
          {expandedCategories["Custom"] && (
            <div className="space-y-2 p-3 bg-white">
              {customExercises.map((exercise) => (
                <button
                  key={exercise.id}
                  onClick={() => onSelectExercise(exercise)}
                  className={`w-full text-left px-3 py-2 rounded-md transition-all text-sm font-medium ${
                    selectedExercises.find((e) => e.id === exercise.id)
                      ? "bg-cyan-500 text-white shadow-md"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-150 border border-slate-200"
                  }`}
                >
                  <span>+ {exercise.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Custom Exercise Button */}
      <button
        onClick={onAddCustom}
        className="w-full flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-cyan-400 to-cyan-500 text-white rounded-lg hover:from-cyan-500 hover:to-cyan-600 transition-all font-medium"
      >
        <Plus className="w-4 h-4" />
        Add Custom Exercise
      </button>
    </div>
  );
}
