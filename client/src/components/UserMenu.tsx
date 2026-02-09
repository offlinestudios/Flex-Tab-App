import { LogOut, Settings } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { toast } from "sonner";

export function UserMenu() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      toast.success("Logged out successfully");
      window.location.href = "/";
    },
    onError: () => {
      toast.error("Failed to logout");
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (!user) return null;

  return (
    <div className="space-y-3">
      {/* User Profile Display */}
      <div className="flex items-center gap-3 px-3 py-2">
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
      </div>

      {/* Settings Button */}
      <Button
        variant="ghost"
        onClick={() => setLocation("/settings")}
        className="w-full flex items-center gap-3 justify-start hover:bg-slate-100 text-slate-700 h-auto py-2.5 px-3"
      >
        <Settings className="w-4 h-4" />
        <span className="text-sm font-medium">Settings</span>
      </Button>

      {/* Logout Button */}
      <Button
        variant="ghost"
        onClick={handleLogout}
        disabled={logoutMutation.isPending}
        className="w-full flex items-center gap-3 justify-start hover:bg-red-50 text-red-600 hover:text-red-700 h-auto py-2.5 px-3"
      >
        <LogOut className="w-4 h-4" />
        <span className="text-sm font-medium">
          {logoutMutation.isPending ? "Logging out..." : "Logout"}
        </span>
      </Button>
    </div>
  );
}
