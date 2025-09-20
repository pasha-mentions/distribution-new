import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, TrendingUp, DollarSign, Play, Calendar } from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";
import RevenueChart from "@/components/reports/revenue-chart";
import type { ReportRow } from "@shared/schema";

interface ReportsData {
  reportRows: ReportRow[];
  summary: { totalRevenue: number; streams: number };
}

export default function Reports() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [period, setPeriod] = useState("6months");

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

  const currentOrgId = user?.organizations?.[0]?.id;

    const { data: reportsData, isLoading: reportsLoading, error } = useQuery<ReportsData>({
    queryKey: ["/api/organizations", currentOrgId, "reports"],
    enabled: !!currentOrgId,
    retry: false,
  });

  if (error && isUnauthorizedError(error as Error)) {
    return null; // Will redirect via useEffect
  }

  if (isLoading || reportsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  const reportRows = reportsData?.reportRows ?? [];
  const summary = reportsData?.summary ?? { totalRevenue: 0, streams: 0 };

  const handleExportCSV = () => {
    if (!reportRows || reportRows.length === 0) {
      toast({
        title: "No Data",
        description: "No report data available to export",
        variant: "destructive",
      });
      return;
    }

    const csvHeaders = ["Period", "Platform", "Territory", "UPC", "ISRC", "Streams", "Revenue"];
    const csvData = reportRows.map((row: ReportRow) => [
      row.period,
      row.source,
      row.territory,
      row.upc || "",
      row.isrc || "",
      row.units ?? 0,
      ((row.revenueCents ?? 0) / 100).toFixed(2)
    ]);

    const csvContent = [csvHeaders, ...csvData]
      .map((row: (string | number)[]) => row.map(cell => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `revenue-report-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    toast({
      title: "Export Complete",
      description: "Revenue report has been downloaded",
    });
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Revenue Reports</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Track your streaming revenue and performance metrics
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-48" data-testid="select-period">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6months">Last 6 months</SelectItem>
                  <SelectItem value="12months">Last 12 months</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleExportCSV} data-testid="button-export-csv">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-muted-foreground truncate">Total Revenue</dt>
                    <dd className="text-lg font-medium text-foreground" data-testid="text-total-revenue">
                      ${summary.totalRevenue.toFixed(2)}
                    </dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Play className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-muted-foreground truncate">Total Streams</dt>
                    <dd className="text-lg font-medium text-foreground" data-testid="text-total-streams">
                      {summary.streams.toLocaleString()}
                    </dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-muted-foreground truncate">Avg. Per Stream</dt>
                    <dd className="text-lg font-medium text-foreground" data-testid="text-avg-per-stream">
                      ${summary.streams > 0 ? (summary.totalRevenue / summary.streams).toFixed(4) : "0.0000"}
                    </dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-muted-foreground truncate">Reporting Period</dt>
                    <dd className="text-lg font-medium text-foreground" data-testid="text-reporting-period">
                      {reportRows.length > 0 ? reportRows[0].period : "No data"}
                    </dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Chart */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={reportRows} />
          </CardContent>
        </Card>

        {/* Detailed Reports Table */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed Revenue Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {reportRows.length === 0 ? (
              <div className="text-center py-12">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Revenue Data</h3>
                <p className="text-muted-foreground">
                  Revenue reports will appear here once your releases start generating streams
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead>Platform</TableHead>
                      <TableHead>Territory</TableHead>
                      <TableHead>UPC</TableHead>
                      <TableHead>ISRC</TableHead>
                      <TableHead className="text-right">Streams</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportRows.map((row: ReportRow) => (
                      <TableRow key={row.id} data-testid={`row-report-${row.id}`}>
                        <TableCell className="font-medium" data-testid={`text-period-${row.id}`}>
                          {row.period}
                        </TableCell>
                        <TableCell data-testid={`text-platform-${row.id}`}>
                          {row.source}
                        </TableCell>
                        <TableCell data-testid={`text-territory-${row.id}`}>
                          {row.territory}
                        </TableCell>
                        <TableCell className="font-mono text-sm" data-testid={`text-upc-${row.id}`}>
                          {row.upc || "-"}
                        </TableCell>
                        <TableCell className="font-mono text-sm" data-testid={`text-isrc-${row.id}`}>
                          {row.isrc || "-"}
                        </TableCell>
                        <TableCell className="text-right" data-testid={`text-streams-${row.id}`}>
                          {(row.units ?? 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-green-600" data-testid={`text-revenue-${row.id}`}>
                          ${((row.revenueCents ?? 0) / 100).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
