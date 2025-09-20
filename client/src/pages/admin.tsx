import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Music, FileText, BarChart3, Search, Calendar, User, Hash, Building2 } from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";
import ReleasesTab from "@/components/admin/releases-tab";

interface AdminRelease {
  id: string;
  title: string;
  upc?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  originalReleaseDate?: string;
  releaseDate?: string;
  primaryGenre?: string;
  language?: string;
  artist: {
    name: string;
  };
  organization: {
    name: string;
    type: string;
  };
}

export default function Admin() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();

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

  // Check if user has admin role
  const isAdmin = (user as any)?.role === "ADMIN";
  const [activeTab, setActiveTab] = useState("catalog");
  
  // Admin catalog state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  
  // Notification state for new releases
  const [previousReleaseCount, setPreviousReleaseCount] = useState<number>(0);
  const [latestReleaseId, setLatestReleaseId] = useState<string>("");

  // Fetch ALL releases using admin API with real-time updates
  const { data: adminReleases = [], isLoading: adminReleasesLoading, error: adminReleasesError } = useQuery<AdminRelease[]>({
    queryKey: ["/api/admin/releases"],
    retry: false,
    enabled: isAdmin, // Only fetch if user is admin
    refetchInterval: activeTab === "catalog" ? 5000 : false, // Auto-refresh every 5 seconds when on catalog tab
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
  });

  // Filter and sort admin releases
  const filteredReleases = adminReleases.filter((release: AdminRelease) => {
    const matchesSearch = searchTerm === "" || 
      release.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      release.artist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      release.organization.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (release.upc && release.upc.includes(searchTerm));

    const matchesStatus = statusFilter === "all" || 
      release.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const sortedReleases = [...filteredReleases].sort((a: AdminRelease, b: AdminRelease) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime();
      case "oldest":
        return new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime();
      case "title":
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "IN_REVIEW":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "DELIVERING":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "DELIVERED":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "TAKEDOWN":
      case "REJECTED":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      case "DRAFT":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("uk-UA", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Notification effect for new releases
  useEffect(() => {
    if (!isAdmin || !adminReleases.length) return;

    // Initialize on first load
    if (previousReleaseCount === 0) {
      setPreviousReleaseCount(adminReleases.length);
      if (adminReleases.length > 0) {
        setLatestReleaseId(adminReleases[0].id);
      }
      return;
    }

    // Check for new releases
    const currentCount = adminReleases.length;
    if (currentCount > previousReleaseCount) {
      const newReleasesCount = currentCount - previousReleaseCount;
      const latestRelease = adminReleases[0]; // Assuming sorted by newest first
      
      // Show notification only if we have a new release ID
      if (latestRelease.id !== latestReleaseId) {
        toast({
          title: "🎵 Новий реліз надіслано!",
          description: `"${latestRelease.artist.name}" надіслав новий реліз "${latestRelease.title}". Біжи відправляй в дистрибуцію!`,
          duration: 8000, // Show for 8 seconds
        });
        
        setLatestReleaseId(latestRelease.id);
      }
      
      setPreviousReleaseCount(currentCount);
    }
  }, [adminReleases, previousReleaseCount, latestReleaseId, isAdmin, toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-8 w-8 text-destructive" />
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Access Denied</h3>
                  <p className="text-muted-foreground">
                    You need administrator privileges to access this page.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-destructive rounded-lg flex items-center justify-center">
                <AlertCircle className="w-4 h-4 text-destructive-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-foreground">Admin Panel</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Manage catalog, releases, and reports
                </p>
              </div>
            </div>
            <Badge variant="destructive" data-testid="badge-admin-only">
              Admin Only
            </Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="catalog" className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Catalog</span>
            </TabsTrigger>
            <TabsTrigger value="releases" className="flex items-center space-x-2">
              <Music className="w-4 h-4" />
              <span>Releases</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Reports</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="catalog" className="space-y-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-foreground mb-2">🛠️ Адміністративний каталог</h2>
              <p className="text-sm text-muted-foreground">
                Перегляд та управління всіма релізами платформи ({adminReleases.length} релізів)
              </p>
            </div>

            {/* Search and Filters */}
            <div className="mb-6 space-y-4 lg:space-y-0 lg:flex lg:items-center lg:gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Пошук за назвою треку, артистом, організацією або UPC кодом"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11"
                  data-testid="admin-catalog-search"
                />
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[200px]" data-testid="admin-status-filter">
                  <SelectValue placeholder="Статус" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Всі статуси</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="IN_REVIEW">In Review</SelectItem>
                  <SelectItem value="DELIVERING">Delivering</SelectItem>
                  <SelectItem value="DELIVERED">Delivered</SelectItem>
                  <SelectItem value="TAKEDOWN">Takedown</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[200px]" data-testid="admin-sort-filter">
                  <SelectValue placeholder="Сортування" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Спочатку нові</SelectItem>
                  <SelectItem value="oldest">Спочатку старі</SelectItem>
                  <SelectItem value="title">За назвою А-Я</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Loading state */}
            {adminReleasesLoading && (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
              </div>
            )}

            {/* Results */}
            {!adminReleasesLoading && (
              <div className="space-y-4">
                {sortedReleases.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Music className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">
                        {adminReleases.length === 0 ? "Немає релізів" : "Немає результатів"}
                      </h3>
                      <p className="text-muted-foreground">
                        {adminReleases.length === 0 
                          ? "Поки що немає релізів в системі" 
                          : "Спробуйте змінити фільтри або пошуковий запит"
                        }
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {/* Table Header */}
                    <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-4 py-3 bg-muted/30 rounded-lg font-medium text-sm text-muted-foreground">
                      <div className="col-span-3 flex items-center gap-2">
                        <Music className="h-4 w-4" />
                        Назва треку
                      </div>
                      <div className="col-span-2 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Головний артист
                      </div>
                      <div className="col-span-2 flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Організація
                      </div>
                      <div className="col-span-2 flex items-center gap-2">
                        <Hash className="h-4 w-4" />
                        UPC
                      </div>
                      <div className="col-span-2 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Дата публікації
                      </div>
                      <div className="col-span-1">
                        Статус
                      </div>
                    </div>

                    {/* Release Items */}
                    {sortedReleases.map((release: AdminRelease) => (
                      <Card key={release.id} className="hover:bg-muted/30 transition-colors" data-testid={`admin-release-card-${release.id}`}>
                        <CardContent className="p-4">
                          {/* Desktop Layout */}
                          <div className="hidden lg:grid lg:grid-cols-12 gap-4 items-center">
                            <div className="col-span-3">
                              <div className="flex items-center gap-3">
                                {/* Album Cover Placeholder */}
                                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                                  {release.title.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-medium text-foreground truncate" data-testid={`admin-release-title-${release.id}`}>
                                    {release.title}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {release.primaryGenre} • {release.language}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="col-span-2">
                              <p className="font-medium text-foreground" data-testid={`admin-release-artist-${release.id}`}>{release.artist.name}</p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-sm text-foreground" data-testid={`admin-release-organization-${release.id}`}>{release.organization.name}</p>
                              <p className="text-xs text-muted-foreground">{release.organization.type}</p>
                            </div>
                            <div className="col-span-2">
                              <p className="font-mono text-sm text-muted-foreground">
                                {release.upc || "—"}
                              </p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-sm text-muted-foreground">
                                {formatDate(release.createdAt)}
                              </p>
                            </div>
                            <div className="col-span-1">
                              <Badge className={getStatusColor(release.status)} data-testid={`admin-release-status-${release.id}`}>
                                {release.status}
                              </Badge>
                            </div>
                          </div>

                          {/* Mobile Layout */}
                          <div className="lg:hidden space-y-3">
                            <div className="flex items-start gap-3">
                              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-semibold">
                                {release.title.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-foreground">{release.title}</p>
                                <p className="text-sm text-muted-foreground">{release.artist.name}</p>
                                <p className="text-xs text-muted-foreground">{release.organization.name} ({release.organization.type})</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge className={getStatusColor(release.status)}>
                                    {release.status}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">UPC</p>
                                <p className="font-mono">{release.upc || "—"}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Дата</p>
                                <p>{formatDate(release.createdAt)}</p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Summary */}
                {sortedReleases.length > 0 && (
                  <div className="mt-8 flex justify-center">
                    <p className="text-sm text-muted-foreground">
                      Показано {sortedReleases.length} з {adminReleases.length} релізів
                    </p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="releases" className="space-y-6">
            <ReleasesTab />
          </TabsContent>
          
          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Reports & Analytics</h3>
                  <p className="text-muted-foreground">
                    View detailed reports and analytics data
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
