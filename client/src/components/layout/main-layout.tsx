import { ReactNode, useState } from "react";
import Sidebar from "./sidebar";
import SupportChat from "../support-chat";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Menu, Bell } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();

  const currentOrg = (user as any)?.organizations?.[0];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="md:pl-64 flex flex-col flex-1 overflow-hidden">
        {/* Top Bar */}
        <div className="bg-card border-b border-border px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {/* Mobile Menu Button */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="md:hidden"
                    data-testid="mobile-menu-button"
                  >
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-64">
                  <Sidebar />
                </SheetContent>
              </Sheet>
            </div>

            <div className="flex items-center space-x-3">
              {currentOrg?.planType && (
                <Badge 
                  variant={currentOrg.planType === 'PRO' ? 'default' : 'secondary'}
                  data-testid="plan-badge"
                >
                  {currentOrg.planType} Plan
                </Badge>
              )}
              <SupportChat />
              <Button 
                variant="ghost" 
                size="sm"
                className="p-2"
                data-testid="notifications-button"
              >
                <Bell className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
