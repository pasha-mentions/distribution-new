import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Music, Calendar, Filter, User, Hash } from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";

interface Release {
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
}

export default function Catalog() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

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

  // Fetch releases using new API
  const { data: releases = [], isLoading: releasesLoading, error } = useQuery<Release[]>({
    queryKey: ["/api/releases"],
    retry: false,
  });

  if (error && isUnauthorizedError(error as Error)) {
    return null; // Will redirect via useEffect
  }

  if (isLoading || releasesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  const filteredReleases = releases.filter((release: Release) => {
    const matchesSearch = searchTerm === "" || 
      release.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      release.artist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (release.upc && release.upc.includes(searchTerm));

    const matchesStatus = statusFilter === "all" || 
      release.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const sortedReleases = [...filteredReleases].sort((a: Release, b: Release) => {
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
    switch (status.toLowerCase()) {
      case "accepted":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "validation":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "deleted":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      case "draft":
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

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground">Каталог релізів</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Перегляд та управління вашими музичними релізами
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4 lg:space-y-0 lg:flex lg:items-center lg:gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Пошук за назвою треку, головним артистом або UPC кодом"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11"
              data-testid="catalog-search"
            />
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]" data-testid="status-filter">
              <SelectValue placeholder="Статус" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Всі статуси</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="validation">Validation</SelectItem>
              <SelectItem value="deleted">Deleted</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[200px]" data-testid="sort-filter">
              <SelectValue placeholder="Сортування" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Спочатку нові</SelectItem>
              <SelectItem value="oldest">Спочатку старі</SelectItem>
              <SelectItem value="title">За назвою А-Я</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {sortedReleases.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Music className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {releases.length === 0 ? "Немає релізів" : "Немає результатів"}
                </h3>
                <p className="text-muted-foreground">
                  {releases.length === 0 
                    ? "Створіть ваш перший реліз, щоб побачити його тут" 
                    : "Спробуйте змінити фільтри або пошуковий запит"
                  }
                </p>
                {releases.length === 0 && (
                  <Button 
                    className="mt-4" 
                    onClick={() => window.location.href = "/releases/new"}
                  >
                    Створити новий реліз
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {/* Table Header */}
              <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-4 py-3 bg-muted/30 rounded-lg font-medium text-sm text-muted-foreground">
                <div className="col-span-4 flex items-center gap-2">
                  <Music className="h-4 w-4" />
                  Назва треку
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Головний артист
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  UPC
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Дата публікації
                </div>
                <div className="col-span-2">
                  Статус
                </div>
              </div>

              {/* Release Items */}
              {sortedReleases.map((release: Release) => (
                <Card key={release.id} className="hover:bg-muted/30 transition-colors">
                  <CardContent className="p-4">
                    {/* Desktop Layout */}
                    <div className="hidden lg:grid lg:grid-cols-12 gap-4 items-center">
                      <div className="col-span-4">
                        <div className="flex items-center gap-3">
                          {/* Album Cover Placeholder */}
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                            {release.title.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-foreground truncate">
                              {release.title}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {release.primaryGenre} • {release.language}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="col-span-2">
                        <p className="font-medium text-foreground">{release.artist.name}</p>
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
                      <div className="col-span-2">
                        <Badge className={getStatusColor(release.status)}>
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
        </div>

        {/* Summary */}
        {sortedReleases.length > 0 && (
          <div className="mt-8 flex justify-center">
            <p className="text-sm text-muted-foreground">
              Показано {sortedReleases.length} з {releases.length} релізів
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
