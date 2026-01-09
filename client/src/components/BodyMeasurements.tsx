import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { useState } from "react";

interface Measurement {
  id: string;
  date: string;
  weight: number;
  chest: number;
  waist: number;
  arms: number;
  thighs: number;
}

interface BodyMeasurementsProps {
  measurements: Measurement[];
  onAddMeasurement: (measurement: Measurement) => void;
  onDeleteMeasurement: (id: string) => void;
}

export function BodyMeasurements({
  measurements,
  onAddMeasurement,
  onDeleteMeasurement,
}: BodyMeasurementsProps) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    weight: "",
    chest: "",
    waist: "",
    arms: "",
    thighs: "",
  });

  const handleAddMeasurement = () => {
    if (
      formData.weight &&
      formData.chest &&
      formData.waist &&
      formData.arms &&
      formData.thighs
    ) {
      const today = new Date().toISOString().split("T")[0];
      onAddMeasurement({
        id: Date.now().toString(),
        date: today,
        weight: parseFloat(formData.weight),
        chest: parseFloat(formData.chest),
        waist: parseFloat(formData.waist),
        arms: parseFloat(formData.arms),
        thighs: parseFloat(formData.thighs),
      });
      setFormData({
        weight: "",
        chest: "",
        waist: "",
        arms: "",
        thighs: "",
      });
      setShowForm(false);
    }
  };

  const sortedMeasurements = [...measurements].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const calculateProgress = () => {
    if (sortedMeasurements.length < 2) return null;

    const latest = sortedMeasurements[0];
    const oldest = sortedMeasurements[sortedMeasurements.length - 1];

    return {
      weightChange: latest.weight - oldest.weight,
      chestChange: latest.chest - oldest.chest,
      waistChange: latest.waist - oldest.waist,
      armsChange: latest.arms - oldest.arms,
      thighsChange: latest.thighs - oldest.thighs,
    };
  };

  const progress = calculateProgress();

  return (
    <div className="space-y-6">
      {/* Add Measurement Form */}
      {!showForm ? (
        <Button
          onClick={() => setShowForm(true)}
          className="w-full bg-cyan-500 hover:bg-cyan-600 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Body Measurement
        </Button>
      ) : (
        <Card className="p-6 bg-white border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-4">
            New Measurement
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="weight" className="text-sm font-medium">
                Weight (lbs)
              </Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                value={formData.weight}
                onChange={(e) =>
                  setFormData({ ...formData, weight: e.target.value })
                }
                placeholder="0"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="chest" className="text-sm font-medium">
                Chest (inches)
              </Label>
              <Input
                id="chest"
                type="number"
                step="0.1"
                value={formData.chest}
                onChange={(e) =>
                  setFormData({ ...formData, chest: e.target.value })
                }
                placeholder="0"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="waist" className="text-sm font-medium">
                Waist (inches)
              </Label>
              <Input
                id="waist"
                type="number"
                step="0.1"
                value={formData.waist}
                onChange={(e) =>
                  setFormData({ ...formData, waist: e.target.value })
                }
                placeholder="0"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="arms" className="text-sm font-medium">
                Arms (inches)
              </Label>
              <Input
                id="arms"
                type="number"
                step="0.1"
                value={formData.arms}
                onChange={(e) =>
                  setFormData({ ...formData, arms: e.target.value })
                }
                placeholder="0"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="thighs" className="text-sm font-medium">
                Thighs (inches)
              </Label>
              <Input
                id="thighs"
                type="number"
                step="0.1"
                value={formData.thighs}
                onChange={(e) =>
                  setFormData({ ...formData, thighs: e.target.value })
                }
                placeholder="0"
                className="mt-1"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Button
              onClick={handleAddMeasurement}
              className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white"
            >
              Save Measurement
            </Button>
            <Button
              onClick={() => setShowForm(false)}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Progress Summary */}
      {progress && (
        <Card className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-4">
            Progress Since Start
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <p className="text-sm text-slate-600 font-medium">Weight</p>
              <p
                className={`text-2xl font-bold mt-2 ${
                  progress.weightChange < 0
                    ? "text-green-600"
                    : "text-slate-900"
                }`}
              >
                {progress.weightChange > 0 ? "+" : ""}
                {progress.weightChange.toFixed(1)} lbs
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600 font-medium">Chest</p>
              <p
                className={`text-2xl font-bold mt-2 ${
                  progress.chestChange > 0 ? "text-green-600" : "text-slate-900"
                }`}
              >
                {progress.chestChange > 0 ? "+" : ""}
                {progress.chestChange.toFixed(1)}"
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600 font-medium">Waist</p>
              <p
                className={`text-2xl font-bold mt-2 ${
                  progress.waistChange < 0
                    ? "text-green-600"
                    : "text-slate-900"
                }`}
              >
                {progress.waistChange > 0 ? "+" : ""}
                {progress.waistChange.toFixed(1)}"
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600 font-medium">Arms</p>
              <p
                className={`text-2xl font-bold mt-2 ${
                  progress.armsChange > 0 ? "text-green-600" : "text-slate-900"
                }`}
              >
                {progress.armsChange > 0 ? "+" : ""}
                {progress.armsChange.toFixed(1)}"
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600 font-medium">Thighs</p>
              <p
                className={`text-2xl font-bold mt-2 ${
                  progress.thighsChange > 0
                    ? "text-green-600"
                    : "text-slate-900"
                }`}
              >
                {progress.thighsChange > 0 ? "+" : ""}
                {progress.thighsChange.toFixed(1)}"
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Measurements History */}
      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-4">
          Measurement History
        </h3>
        {sortedMeasurements.length === 0 ? (
          <Card className="p-8 text-center bg-white border-slate-200">
            <p className="text-slate-600">No measurements recorded yet</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {sortedMeasurements.map((measurement) => (
              <Card
                key={measurement.id}
                className="p-4 bg-white border-slate-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">
                      {new Date(measurement.date).toLocaleDateString()}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-3 text-sm">
                      <div>
                        <p className="text-slate-600">Weight</p>
                        <p className="font-medium text-slate-900">
                          {measurement.weight} lbs
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-600">Chest</p>
                        <p className="font-medium text-slate-900">
                          {measurement.chest}"
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-600">Waist</p>
                        <p className="font-medium text-slate-900">
                          {measurement.waist}"
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-600">Arms</p>
                        <p className="font-medium text-slate-900">
                          {measurement.arms}"
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-600">Thighs</p>
                        <p className="font-medium text-slate-900">
                          {measurement.thighs}"
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => onDeleteMeasurement(measurement.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors ml-4"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
