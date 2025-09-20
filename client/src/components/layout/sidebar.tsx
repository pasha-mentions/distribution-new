import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { 
  LayoutDashboard, 
  Music4, 
  Plus, 
  BarChart3, 
  DollarSign, 
  Settings,
  LogOut,
  ShieldCheck,
  TestTube
} from "lucide-react";
import muzikaLogo from "@assets/Logo_01_1757401362203.png";
import type { User } from "@shared/schema";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Catalog", href: "/catalog", icon: Music4 },
  { name: "New Release", href: "/releases/new", icon: Plus },
  { name: "Test Release", href: "/test-release", icon: TestTube },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Payouts", href: "/payouts", icon: DollarSign },
];

export default function Sidebar() {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const typedUser = user as User | undefined;

  const userInitials = typedUser?.firstName && typedUser?.lastName 
    ? `${typedUser.firstName[0]}${typedUser.lastName[0]}` 
    : typedUser?.email?.[0]?.toUpperCase() || 'U';

  const displayName = typedUser?.firstName && typedUser?.lastName
    ? `${typedUser.firstName} ${typedUser.lastName}`
    : typedUser?.email || 'User';

  // Add admin link for admin users
  const allNavigation = typedUser?.role === 'ADMIN' 
    ? [...navigation, { name: "Admin", href: "/admin", icon: ShieldCheck }]
    : navigation;

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/auth/logout');
      return response.json();
    },
    onSuccess: (data) => {
      // Clear all cached data
      queryClient.clear();
      
      // If there's a redirect URL (for Replit Auth), use it
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        // For Google Auth or simple logout, navigate to home
        navigate('/');
      }
      
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      });
    },
    onError: (error) => {
      console.error("Logout failed:", error);
      toast({
        title: "Logout failed",
        description: "There was an error logging you out. Please try again.",
        variant: "destructive",
      });
      
      // Clear cache anyway and redirect to be safe
      queryClient.clear();
      navigate('/');
    }
  });
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
      <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto bg-sidebar border-r border-sidebar-border">
        {/* Logo */}
        <div className="flex items-center flex-shrink-0 px-4">
          <img 
            src={muzikaLogo} 
            alt="MUZIKA" 
            className="h-4 w-auto"
          />
        </div>

        {/* Navigation */}
        <nav className="mt-8 flex-1 px-2 space-y-1" data-testid="sidebar-navigation">
          {allNavigation.map((item) => {
            const isActive = location === item.href || (item.href !== '/' && location.startsWith(item.href));
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={cn(
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors"
                )}
                data-testid={`nav-link-${item.name.toLowerCase().replace(' ', '-')}`}
              >
                <item.icon
                  className={cn(
                    "mr-3 flex-shrink-0 h-5 w-5",
                    isActive ? "text-sidebar-accent-foreground" : "text-sidebar-foreground"
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="flex-shrink-0 border-t border-sidebar-border p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full p-2 h-auto justify-start hover:bg-sidebar-accent"
                data-testid="profile-menu-trigger"
              >
                <div className="flex items-center w-full">
                  <div className="flex-shrink-0">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={typedUser?.profileImageUrl || undefined} alt="Profile" />
                      <AvatarFallback className="text-sm font-medium bg-sidebar-accent text-sidebar-accent-foreground">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="ml-3 min-w-0 flex-1 text-left">
                    <p className="text-sm font-medium text-sidebar-foreground truncate" data-testid="user-display-name">
                      {displayName}
                    </p>
                    <p className="text-xs text-sidebar-foreground/70 truncate" data-testid="user-email">
                      {typedUser?.email}
                    </p>
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-56 mb-2"
              data-testid="profile-dropdown-menu"
            >
              <DropdownMenuItem asChild>
                <Link 
                  href="/settings" 
                  className="flex items-center w-full cursor-pointer"
                  data-testid="menu-item-settings"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
                className="flex items-center cursor-pointer text-destructive focus:text-destructive"
                data-testid="menu-item-logout"
              >
                <LogOut className="mr-2 h-4 w-4" />
                {logoutMutation.isPending ? "Logging out..." : "Logout"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
