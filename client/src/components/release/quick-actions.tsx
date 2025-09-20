import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Plus, BarChart3, DollarSign } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";

export default function QuickActions() {
  const { user } = useAuth();
  const currentOrg = user?.organizations?.[0];
  
  // Mock data for account status
  const monthlyReleases = 3;
  const releaseLimit = currentOrg?.monthlyReleaseLimit || 2;
  const progressPercentage = Math.min((monthlyReleases / releaseLimit) * 100, 100);

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Link href="/releases/new">
            <Button className="w-full" data-testid="button-new-release">
              <Plus className="w-4 h-4 mr-2" />
              New Release
            </Button>
          </Link>
          
          <Link href="/reports">
            <Button variant="outline" className="w-full" data-testid="button-view-reports">
              <BarChart3 className="w-4 h-4 mr-2" />
              View Reports
            </Button>
          </Link>
          
          <Link href="/payouts">
            <Button variant="outline" className="w-full" data-testid="button-request-payout">
              <DollarSign className="w-4 h-4 mr-2" />
              Request Payout
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Account Status */}
      <Card>
        <CardHeader>
          <CardTitle>Account Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">KYC Status</span>
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" data-testid="badge-kyc-status">
              Verified
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Payment Setup</span>
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" data-testid="badge-payment-status">
              Connected
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Monthly Releases</span>
            <span className="text-sm text-foreground" data-testid="text-monthly-releases">
              {monthlyReleases} / {releaseLimit}
            </span>
          </div>
          
          <div className="space-y-2">
            <Progress value={progressPercentage} className="w-full" data-testid="progress-releases" />
            <p className="text-xs text-muted-foreground">
              {releaseLimit - monthlyReleases > 0 
                ? `${releaseLimit - monthlyReleases} releases remaining this month`
                : 'Monthly limit reached'
              }
            </p>
          </div>

          {currentOrg?.planType !== 'PRO' && monthlyReleases >= releaseLimit && (
            <div className="pt-2">
              <Link href="/settings">
                <Button variant="outline" size="sm" className="w-full" data-testid="button-upgrade-plan">
                  Upgrade Plan
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
