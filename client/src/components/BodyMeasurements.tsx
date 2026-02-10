import { Card } from "@/components/ui/card";
// Updated 2026-02-09 - Metric cards with sparklines
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface MetricCardProps {
  title: string;
  value: number;
  unit: string;
  trend: "up" | "down" | "neutral";
  change: number | null;
  sparklineData: number[];
  onClick: () => void;
}

function MetricCard({ title, value, unit, trend, change, sparklineData, onClick }: MetricCardProps) {
  const trendColors = {
    up: "text-slate-600",
    down: "text-slate-600",
    neutral: "text-slate-400",
  };

  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  // Generate sparkline path
  const generateSparklinePath = (data: number[]) => {
    if (data.length < 2) return "";
    
    const width = 100;
    const height = 20;
    const padding = 2;
    
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min;
    
    // If all values are the same (no change), draw a flat line
    if (range === 0) {
      const y = height / 2;
      return `M 0,${y} L ${width},${y}`;
    }
    
    const points = data.map((val, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - padding - ((val - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    });
    
    return `M ${points.join(" L ")}`;
  };

  const sparklinePath = generateSparklinePath(sparklineData);
  const hasSparkline = sparklineData.length >= 2;

  return (
    <Card 
      className="card-premium p-6 cursor-pointer hover:shadow-lg transition-all"
      onClick={onClick}
    >
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-slate-600">{title}</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-slate-900">
            {value > 0 ? value : "—"}
          </span>
          {value > 0 && (
            <span className="text-sm text-slate-500">{unit}</span>
          )}
        </div>
        
        {/* Sparkline */}
        {hasSparkline && value > 0 && (
          <div className="relative h-5 -mx-2">
            <svg width="100%" height="20" viewBox="0 0 100 20" preserveAspectRatio="none" className="w-full">
              <defs>
                <linearGradient id={`gradient-${title}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#64748b" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#64748b" stopOpacity="0.03" />
                </linearGradient>
              </defs>
              <path
                d={`${sparklinePath} L 100,20 L 0,20 Z`}
                fill={`url(#gradient-${title})`}
              />
              <path
                d={sparklinePath}
                fill="none"
                stroke="#64748b"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}
        
        {change !== null && value > 0 && (
          <div className={`flex items-center gap-1 text-sm ${trendColors[trend]}`}>
            <TrendIcon className="w-4 h-4" />
            <span>
              {trend === "up" ? "+" : trend === "down" ? "" : ""}
              {Math.abs(change).toFixed(1)} {unit} from last
            </span>
          </div>
        )}
        {change === null && value > 0 && (
          <div className="text-sm text-slate-400">
            <Minus className="w-4 h-4 inline mr-1" />
            No previous data
          </div>
        )}
      </div>
    </Card>
  );
}

export function BodyMeasurements() {
  const [showDialog, setShowDialog] = useState(false);
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
      await utils.workout.getMeasurements.cancel();
      const previousMeasurements = utils.workout.getMeasurements.getData();
      
      utils.workout.getMeasurements.setData(undefined, (old) => {
        const optimisticMeasurement = {
          id: Date.now(),
          userId: 0,
          ...newMeasurement,
          createdAt: new Date(),
        };
        return old ? [...old, optimisticMeasurement] : [optimisticMeasurement];
      });
      
      return { previousMeasurements };
    },
    onError: (err, newMeasurement, context) => {
      if (context?.previousMeasurements) {
        utils.workout.getMeasurements.setData(undefined, context.previousMeasurements);
      }
    },
    onSettled: () => {
      utils.workout.getMeasurements.invalidate();
    },
  });

  const handleSaveMeasurement = async () => {
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
      setShowDialog(false);
    }
  };

  // Sort measurements by date (newest first)
  const sortedMeasurements = [...measurements].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Get latest and previous measurements for trend calculation
  const latestMeasurement = sortedMeasurements[0];
  const previousMeasurement = sortedMeasurements[1];

  // Calculate trends
  const calculateTrend = (current: number, previous: number | undefined): { trend: "up" | "down" | "neutral", change: number | null } => {
    if (!previous || previous === 0) return { trend: "neutral", change: null };
    const change = current - previous;
    if (Math.abs(change) < 0.1) return { trend: "neutral", change: 0 };
    return {
      trend: change > 0 ? "up" : "down",
      change: change,
    };
  };

  const weightTrend = latestMeasurement ? calculateTrend(latestMeasurement.weight, previousMeasurement?.weight) : { trend: "neutral" as const, change: null };
  const chestTrend = latestMeasurement ? calculateTrend(latestMeasurement.chest, previousMeasurement?.chest) : { trend: "neutral" as const, change: null };
  const waistTrend = latestMeasurement ? calculateTrend(latestMeasurement.waist, previousMeasurement?.waist) : { trend: "neutral" as const, change: null };
  const armsTrend = latestMeasurement ? calculateTrend(latestMeasurement.arms, previousMeasurement?.arms) : { trend: "neutral" as const, change: null };
  const thighsTrend = latestMeasurement ? calculateTrend(latestMeasurement.thighs, previousMeasurement?.thighs) : { trend: "neutral" as const, change: null };

  // Generate sparkline data (last 5 measurements)
  const getSparklineData = (metric: 'weight' | 'chest' | 'waist' | 'arms' | 'thighs') => {
    return sortedMeasurements
      .slice(0, 5)
      .reverse()
      .map(m => m[metric])
      .filter(v => v > 0);
  };

  const weightSparkline = getSparklineData('weight');
  const chestSparkline = getSparklineData('chest');
  const waistSparkline = getSparklineData('waist');
  const armsSparkline = getSparklineData('arms');
  const thighsSparkline = getSparklineData('thighs');

  return (
    <div className="space-y-6">
      {/* Date header and Add button */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">
          {latestMeasurement 
            ? new Date(latestMeasurement.date).toLocaleDateString("en-US", { 
                month: "short", 
                day: "numeric", 
                year: "numeric" 
              })
            : "No measurements yet"}
        </h2>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 gap-4">
        <MetricCard
          title="Weight"
          value={latestMeasurement?.weight || 0}
          unit="lbs"
          trend={weightTrend.trend}
          change={weightTrend.change}
          sparklineData={weightSparkline}
          onClick={() => setShowDialog(true)}
        />
        <MetricCard
          title="Chest"
          value={latestMeasurement?.chest || 0}
          unit="in"
          trend={chestTrend.trend}
          change={chestTrend.change}
          sparklineData={chestSparkline}
          onClick={() => setShowDialog(true)}
        />
        <MetricCard
          title="Waist"
          value={latestMeasurement?.waist || 0}
          unit="in"
          trend={waistTrend.trend}
          change={waistTrend.change}
          sparklineData={waistSparkline}
          onClick={() => setShowDialog(true)}
        />
        <MetricCard
          title="Arms"
          value={latestMeasurement?.arms || 0}
          unit="in"
          trend={armsTrend.trend}
          change={armsTrend.change}
          sparklineData={armsSparkline}
          onClick={() => setShowDialog(true)}
        />
        <MetricCard
          title="Thighs"
          value={latestMeasurement?.thighs || 0}
          unit="in"
          trend={thighsTrend.trend}
          change={thighsTrend.change}
          sparklineData={thighsSparkline}
          onClick={() => setShowDialog(true)}
        />
      </div>

      {/* Log New Measurement Button */}
      <div className="mt-8 pb-safe">
        <Button
          onClick={() => setShowDialog(true)}
          className="w-full bg-slate-800 hover:bg-slate-900 text-white h-12"
        >
          <Plus className="w-4 h-4 mr-2" />
          Log New Measurement
        </Button>
      </div>

      {/* Add Measurement Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Log New Measurement</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
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
                Chest (in)
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
                Waist (in)
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
                Arms (in)
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
                Thighs (in)
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
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDialog(false);
                setFormData({
                  weight: "",
                  chest: "",
                  waist: "",
                  arms: "",
                  thighs: "",
                });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveMeasurement}
              className="bg-slate-800 hover:bg-slate-900 text-white"
            >
              Save Measurement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
