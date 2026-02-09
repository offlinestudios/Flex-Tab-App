import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { useState } from "react";
import { formatDateFull } from "@/lib/dateUtils";
import { trpc } from "@/lib/trpc";

export function BodyMeasurements() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    weight: "",
    chest: "",
    waist: "",
    arms: "",
    thighs: "",
  });

  // Load measurements from API
  const { data: measurements = [] } = trpc.workout.getMeasurements.useQuery();
  const utils = trpc.useUtils();

  // Mutations
  const addMeasurementMutation = trpc.workout.addMeasurement.useMutation({
    onMutate: async (newMeasurement) => {
      // Cancel outgoing refetches
      await utils.workout.getMeasurements.cancel();
      
      // Snapshot previous value
      const previousMeasurements = utils.workout.getMeasurements.getData();
      
      // Optimistically update to the new value
      utils.workout.getMeasurements.setData(undefined, (old) => {
        const optimisticMeasurement = {
          id: Date.now(), // Temporary ID
          userId: 0, // Will be set by server
          ...newMeasurement,
          createdAt: new Date(),
        };
        return old ? [...old, optimisticMeasurement] : [optimisticMeasurement];
      });
      
      // Return context with previous value
      return { previousMeasurements };
    },
    onError: (err, newMeasurement, context) => {
      // Rollback on error
      if (context?.previousMeasurements) {
        utils.workout.getMeasurements.setData(undefined, context.previousMeasurements);
      }
    },
    onSettled: () => {
      // Refetch to ensure server state
      utils.workout.getMeasurements.invalidate();
    },
  });

  const updateMeasurementMutation = trpc.workout.updateMeasurement.useMutation({
    onMutate: async (updatedMeasurement) => {
      // Cancel outgoing refetches
      await utils.workout.getMeasurements.cancel();
      
      // Snapshot previous value
      const previousMeasurements = utils.workout.getMeasurements.getData();
      
      // Optimistically update
      utils.workout.getMeasurements.setData(undefined, (old) => {
        if (!old) return old;
        return old.map((measurement) =>
          measurement.id === updatedMeasurement.id
            ? { ...measurement, ...updatedMeasurement }
            : measurement
        );
      });
      
      return { previousMeasurements };
    },
    onError: (err, updatedMeasurement, context) => {
      // Rollback on error
      if (context?.previousMeasurements) {
        utils.workout.getMeasurements.setData(undefined, context.previousMeasurements);
      }
    },
    onSettled: () => {
      utils.workout.getMeasurements.invalidate();
    },
  });

  const deleteMeasurementMutation = trpc.workout.deleteMeasurement.useMutation({
    onMutate: async (deletedMeasurement) => {
      // Cancel outgoing refetches
      await utils.workout.getMeasurements.cancel();
      
      // Snapshot previous value
      const previousMeasurements = utils.workout.getMeasurements.getData();
      
      // Optimistically remove from list
      utils.workout.getMeasurements.setData(undefined, (old) => {
        if (!old) return old;
        return old.filter((measurement) => measurement.id !== deletedMeasurement.id);
      });
      
      return { previousMeasurements };
    },
    onError: (err, deletedMeasurement, context) => {
      // Rollback on error
      if (context?.previousMeasurements) {
        utils.workout.getMeasurements.setData(undefined, context.previousMeasurements);
      }
      alert(`Failed to delete measurement: ${err.message}`);
    },
    onSettled: () => {
      utils.workout.getMeasurements.invalidate();
    },
  });

  const handleAddMeasurement = async () => {
    // All fields are optional - save any combination of measurements
    const hasAnyMeasurement = formData.weight || formData.chest || formData.waist || formData.arms || formData.thighs;
    
    if (hasAnyMeasurement) {
      const today = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
      });

      await addMeasurementMutation.mutateAsync({
        date: today,
        weight: formData.weight ? parseFloat(formData.weight) : 0,
        chest: formData.chest ? parseFloat(formData.chest) : 0,
        waist: formData.waist ? parseFloat(formData.waist) : 0,
        arms: formData.arms ? parseFloat(formData.arms) : 0,
        thighs: formData.thighs ? parseFloat(formData.thighs) : 0,
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

  const handleEditMeasurement = (measurement: typeof measurements[0]) => {
    setEditingId(measurement.id);
    setFormData({
      weight: measurement.weight.toString(),
      chest: measurement.chest.toString(),
      waist: measurement.waist.toString(),
      arms: measurement.arms.toString(),
      thighs: measurement.thighs.toString(),
    });
  };

  const handleSaveEdit = async (measurementId: number) => {
    // All fields are optional - save any combination of measurements
    const hasAnyMeasurement = formData.weight || formData.chest || formData.waist || formData.arms || formData.thighs;
    
    if (hasAnyMeasurement) {
      await updateMeasurementMutation.mutateAsync({
        id: measurementId,
        weight: formData.weight ? parseFloat(formData.weight) : 0,
        chest: formData.chest ? parseFloat(formData.chest) : 0,
        waist: formData.waist ? parseFloat(formData.waist) : 0,
        arms: formData.arms ? parseFloat(formData.arms) : 0,
        thighs: formData.thighs ? parseFloat(formData.thighs) : 0,
      });

      setEditingId(null);
      setFormData({
        weight: "",
        chest: "",
        waist: "",
        arms: "",
        thighs: "",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({
      weight: "",
      chest: "",
      waist: "",
      arms: "",
      thighs: "",
    });
  };

  const handleDeleteMeasurement = async (id: number) => {
    await deleteMeasurementMutation.mutateAsync({ id });
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
      {!showForm && editingId === null ? (
        <Button
          onClick={() => setShowForm(true)}
          className="w-full bg-slate-800 hover:bg-slate-900 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Body Measurement
        </Button>
      ) : showForm ? (
        <Card className="card-premium p-6 animate-scale-in">
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
              disabled={addMeasurementMutation.isPending}
              className="flex-1 bg-slate-800 hover:bg-slate-900 text-white"
            >
              {addMeasurementMutation.isPending ? "Saving..." : "Save Measurement"}
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
      ) : null}

      {/* Progress Summary */}
      {progress && (
        <Card className="data-card bg-gradient-to-br from-slate-50 to-slate-100 animate-fade-in">
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
          <Card className="card-premium p-8 text-center animate-fade-in">
            <p className="text-slate-600">No measurements recorded yet</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {sortedMeasurements.map((measurement) => (
              editingId === measurement.id ? (
                <Card key={measurement.id} className="card-premium p-6 animate-scale-in">
                  <h4 className="text-lg font-bold text-slate-900 mb-4">
                    Edit Measurement - {formatDateFull(measurement.date)}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-weight" className="text-sm font-medium">
                        Weight (lbs)
                      </Label>
                      <Input
                        id="edit-weight"
                        type="number"
                        step="0.1"
                        value={formData.weight}
                        onChange={(e) =>
                          setFormData({ ...formData, weight: e.target.value })
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-chest" className="text-sm font-medium">
                        Chest (inches)
                      </Label>
                      <Input
                        id="edit-chest"
                        type="number"
                        step="0.1"
                        value={formData.chest}
                        onChange={(e) =>
                          setFormData({ ...formData, chest: e.target.value })
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-waist" className="text-sm font-medium">
                        Waist (inches)
                      </Label>
                      <Input
                        id="edit-waist"
                        type="number"
                        step="0.1"
                        value={formData.waist}
                        onChange={(e) =>
                          setFormData({ ...formData, waist: e.target.value })
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-arms" className="text-sm font-medium">
                        Arms (inches)
                      </Label>
                      <Input
                        id="edit-arms"
                        type="number"
                        step="0.1"
                        value={formData.arms}
                        onChange={(e) =>
                          setFormData({ ...formData, arms: e.target.value })
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-thighs" className="text-sm font-medium">
                        Thighs (inches)
                      </Label>
                      <Input
                        id="edit-thighs"
                        type="number"
                        step="0.1"
                        value={formData.thighs}
                        onChange={(e) =>
                          setFormData({ ...formData, thighs: e.target.value })
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <Button
                      onClick={() => handleSaveEdit(measurement.id)}
                      disabled={updateMeasurementMutation.isPending}
                      className="flex-1 bg-slate-800 hover:bg-slate-900 text-white"
                    >
                      {updateMeasurementMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button
                      onClick={handleCancelEdit}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </Card>
              ) : (
                <Card
                  key={measurement.id}
                  className="data-card p-4"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">
                        {formatDateFull(measurement.date)}
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
                    <div className="flex gap-2 md:flex-col">
                      <button
                        onClick={() => handleEditMeasurement(measurement)}
                        className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteMeasurement(measurement.id)}
                        disabled={deleteMeasurementMutation.isPending}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600 disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              )
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
