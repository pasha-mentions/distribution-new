import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import StatsGrid from "@/components/release/stats-grid";
import RecentReleases from "@/components/release/recent-releases";
import QuickActions from "@/components/release/quick-actions";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Stats Grid */}
        <StatsGrid />

        {/* Main Grid */}
        <div className="mt-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Recent Releases */}
            <div className="lg:col-span-2">
              <RecentReleases />
            </div>

            {/* Quick Actions & Account Status */}
            <div className="space-y-6">
              <QuickActions />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
