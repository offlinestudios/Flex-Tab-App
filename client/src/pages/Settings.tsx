import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { User, Scale, Palette, Bell, Save } from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
  const [weightUnit, setWeightUnit] = useState(
    localStorage.getItem("weightUnit") || "lbs"
  );
  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || "system"
  );
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    localStorage.getItem("notificationsEnabled") === "true"
  );

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
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Settings</h1>
          <p className="text-slate-600">
            Manage your account preferences and app settings
          </p>
        </div>

        {/* Profile Information */}
        <Card className="p-6 bg-white border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <User className="w-5 h-5 text-cyan-600" />
            <h2 className="text-xl font-semibold text-slate-900">
              Profile Information
            </h2>
          </div>
          <div className="space-y-4">
            <div>
              <Label className="text-slate-700">Name</Label>
              <p className="text-lg text-slate-900 mt-1">
                {user?.name || "Not set"}
              </p>
            </div>
            <div>
              <Label className="text-slate-700">Email</Label>
              <p className="text-lg text-slate-900 mt-1">
                {user?.email || "Not set"}
              </p>
            </div>
          </div>
        </Card>

        {/* Units Preference */}
        <Card className="p-6 bg-white border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <Scale className="w-5 h-5 text-cyan-600" />
            <h2 className="text-xl font-semibold text-slate-900">
              Units & Measurements
            </h2>
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="weight-unit" className="text-slate-700 mb-2 block">
                Weight Unit
              </Label>
              <Select value={weightUnit} onValueChange={setWeightUnit}>
                <SelectTrigger id="weight-unit" className="w-full md:w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lbs">Pounds (lbs)</SelectItem>
                  <SelectItem value="kg">Kilograms (kg)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-slate-500 mt-2">
                Choose your preferred unit for weight measurements
              </p>
            </div>
          </div>
        </Card>

        {/* Appearance */}
        <Card className="p-6 bg-white border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <Palette className="w-5 h-5 text-cyan-600" />
            <h2 className="text-xl font-semibold text-slate-900">Appearance</h2>
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="theme" className="text-slate-700 mb-2 block">
                Theme
              </Label>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger id="theme" className="w-full md:w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-slate-500 mt-2">
                Choose how FlexTab looks to you
              </p>
            </div>
          </div>
        </Card>

        {/* Notifications */}
        <Card className="p-6 bg-white border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="w-5 h-5 text-cyan-600" />
            <h2 className="text-xl font-semibold text-slate-900">
              Notifications
            </h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label htmlFor="notifications" className="text-slate-700">
                  Enable Notifications
                </Label>
                <p className="text-sm text-slate-500 mt-1">
                  Receive notifications about your workout progress and reminders
                </p>
              </div>
              <Switch
                id="notifications"
                checked={notificationsEnabled}
                onCheckedChange={setNotificationsEnabled}
              />
            </div>
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSaveSettings}
            className="bg-cyan-500 hover:bg-cyan-600 text-white px-8"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
