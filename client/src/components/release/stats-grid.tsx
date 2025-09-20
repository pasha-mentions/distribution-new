import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, Music, Play, Clock } from "lucide-react";

interface OrgStats {
  totalRevenue: number;
  activeReleases: number;
  totalStreams: number;
  pendingReview: number;
}

export default function StatsGrid() {
  const { user } = useAuth();
  const currentOrgId = user?.organizations?.[0]?.id;

    const { data: stats, isLoading } = useQuery<OrgStats>({
    queryKey: ["/api/organizations", currentOrgId, "stats"],
    enabled: !!currentOrgId,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="animate-pulse">
                <div className="h-8 w-8 bg-muted rounded-lg mb-3"></div>
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-6 bg-muted rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const {
    totalRevenue = 0,
    activeReleases = 0,
    totalStreams = 0,
    pendingReview = 0,
  } = stats || {};

  const statCards = [
    {
      title: "Total Revenue",
      value: `$${totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: "bg-green-500",
      testId: "stats-total-revenue"
    },
    {
      title: "Active Releases",
      value: activeReleases.toString(),
      icon: Music,
      color: "bg-blue-500",
      testId: "stats-active-releases"
    },
    {
      title: "Total Streams",
      value: totalStreams.toLocaleString(),
      icon: Play,
      color: "bg-purple-500",
      testId: "stats-total-streams"
    },
    {
      title: "Pending Review",
      value: pendingReview.toString(),
      icon: Clock,
      color: "bg-orange-500",
      testId: "stats-pending-review"
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => (
        <Card key={stat.title}>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <stat.icon className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-muted-foreground truncate">
                    {stat.title}
                  </dt>
                  <dd className="text-lg font-medium text-foreground" data-testid={stat.testId}>
                    {stat.value}
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
