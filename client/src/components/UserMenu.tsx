import { useState } from "react";
import { LogOut, Settings } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { SettingsDialog } from "@/components/SettingsDialog";
import { useLocation } from "wouter";

export function UserMenu() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast.error("Failed to logout");
        console.error("Logout error:", error);
      } else {
        toast.success("Logged out successfully");
        // Redirect to sign-in page
        setLocation("/sign-in");
      }
    } catch (err) {
      toast.error("Failed to logout");
      console.error("Logout error:", err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="w-full flex items-center gap-3 justify-start hover:bg-slate-100 h-auto py-3 px-3"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white font-semibold text-lg shadow-sm flex-shrink-0">
              {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="flex flex-col items-start flex-1 min-w-0">
              <span className="text-slate-900 font-medium truncate w-full text-left text-sm">
                {user.name || "User"}
              </span>
              <span className="text-xs text-slate-500 truncate w-full text-left">
                {user.email}
              </span>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" className="w-56 bg-white border-slate-200 mb-2">
          <DropdownMenuItem 
            onClick={() => setSettingsOpen(true)}
            className="cursor-pointer text-slate-700 focus:bg-slate-100"
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-slate-200" />
          <DropdownMenuItem
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {isLoggingOut ? "Logging out..." : "Logout"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Settings Dialog */}
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
}
