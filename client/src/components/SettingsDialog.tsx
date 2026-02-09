import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Scale, Palette, Bell } from "lucide-react";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { user } = useAuth();
  
  const [weightUnit, setWeightUnit] = useState(
    localStorage.getItem("weightUnit") || "lbs"
  );
  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || "light"
  );
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    localStorage.getItem("notificationsEnabled") === "true"
  );

  // Load settings when dialog opens
  useEffect(() => {
    if (open) {
      setWeightUnit(localStorage.getItem("weightUnit") || "lbs");
      setTheme(localStorage.getItem("theme") || "light");
      setNotificationsEnabled(localStorage.getItem("notificationsEnabled") === "true");
    }
  }, [open]);

  const handleSaveSettings = () => {
    localStorage.setItem("weightUnit", weightUnit);
    localStorage.setItem("theme", theme);
    localStorage.setItem("notificationsEnabled", String(notificationsEnabled));
    
    // Apply theme immediately
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (theme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      // System preference
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }

    toast.success("Settings saved successfully!");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-900">Settings</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Weight Units */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-slate-600" />
              <Label className="text-base font-semibold text-slate-900">Weight Units</Label>
            </div>
            <Select value={weightUnit} onValueChange={setWeightUnit}>
              <SelectTrigger className="w-full bg-white border-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200">
                <SelectItem value="lbs">Pounds (lbs)</SelectItem>
                <SelectItem value="kg">Kilograms (kg)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Theme */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-slate-600" />
              <Label className="text-base font-semibold text-slate-900">Theme</Label>
            </div>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger className="w-full bg-white border-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200">
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notifications */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-slate-600" />
              <Label className="text-base font-semibold text-slate-900">Notifications</Label>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div>
                <p className="text-sm font-medium text-slate-900">Enable notifications</p>
                <p className="text-xs text-slate-500">Receive workout reminders and updates</p>
              </div>
              <Switch
                checked={notificationsEnabled}
                onCheckedChange={setNotificationsEnabled}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveSettings}
            className="bg-slate-800 hover:bg-slate-900 text-white"
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
