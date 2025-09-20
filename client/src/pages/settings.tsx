import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Shield, CreditCard, Users, Key, Bell, Globe } from "lucide-react";

export default function Settings() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: false,
  });

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

  const handleSaveProfile = () => {
    toast({
      title: "Profile Updated",
      description: "Your profile information has been saved successfully",
    });
  };

  const handleNotificationChange = (type: string, enabled: boolean) => {
    setNotifications(prev => ({
      ...prev,
      [type]: enabled,
    }));
    toast({
      title: "Notification Settings Updated",
      description: `${type} notifications ${enabled ? 'enabled' : 'disabled'}`,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  const currentOrg = user?.organizations?.[0];
  const userInitials = user?.firstName && user?.lastName 
    ? `${user.firstName[0]}${user.lastName[0]}` 
    : user?.email?.[0]?.toUpperCase() || 'U';

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="profile" data-testid="tab-profile">
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="organization" data-testid="tab-organization">
              <Users className="w-4 h-4 mr-2" />
              Organization
            </TabsTrigger>
            <TabsTrigger value="security" data-testid="tab-security">
              <Shield className="w-4 h-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger value="billing" data-testid="tab-billing">
              <CreditCard className="w-4 h-4 mr-2" />
              Billing
            </TabsTrigger>
            <TabsTrigger value="notifications" data-testid="tab-notifications">
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="api" data-testid="tab-api">
              <Key className="w-4 h-4 mr-2" />
              API
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-4">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={user?.profileImageUrl || undefined} alt="Profile" />
                    <AvatarFallback className="text-lg font-semibold">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Button variant="outline" size="sm" data-testid="button-change-photo">
                      Change Photo
                    </Button>
                    <p className="text-sm text-muted-foreground mt-2">
                      JPG, PNG or GIF. Max size 2MB.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input 
                      id="firstName" 
                      defaultValue={user?.firstName || ""} 
                      data-testid="input-first-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input 
                      id="lastName" 
                      defaultValue={user?.lastName || ""} 
                      data-testid="input-last-name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    defaultValue={user?.email || ""} 
                    disabled
                    data-testid="input-email"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed. Contact support if you need to update it.
                  </p>
                </div>

                <Button onClick={handleSaveProfile} data-testid="button-save-profile">
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="organization">
            <Card>
              <CardHeader>
                <CardTitle>Organization Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="orgName">Organization Name</Label>
                  <Input 
                    id="orgName" 
                    defaultValue={currentOrg?.name || ""} 
                    data-testid="input-org-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="orgType">Organization Type</Label>
                  <Select defaultValue={currentOrg?.type || "ARTIST_ORG"}>
                    <SelectTrigger data-testid="select-org-type">
                      <SelectValue placeholder="Select organization type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ARTIST_ORG">Individual Artist</SelectItem>
                      <SelectItem value="LABEL">Record Label</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Current Plan</Label>
                    <p className="text-sm text-muted-foreground">
                      {currentOrg?.planType || 'FREE'} Plan
                    </p>
                  </div>
                  <Badge variant="secondary" data-testid="badge-plan-type">
                    {currentOrg?.planType || 'FREE'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Monthly Release Limit</Label>
                    <p className="text-sm text-muted-foreground">
                      {currentOrg?.monthlyReleaseLimit || 2} releases per month
                    </p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-sm font-medium mb-3">Team Members</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={user?.profileImageUrl || undefined} />
                          <AvatarFallback className="text-sm">
                            {userInitials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            {user?.firstName} {user?.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {user?.email}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">Owner</Badge>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full mt-3" data-testid="button-invite-member">
                    Invite Team Member
                  </Button>
                </div>

                <Button data-testid="button-save-org">Save Organization Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium mb-3">Two-Factor Authentication</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add an extra layer of security to your account
                  </p>
                  <Button variant="outline" data-testid="button-setup-2fa">
                    Setup 2FA
                  </Button>
                </div>

                <Separator />

                <div>
                  <h4 className="text-sm font-medium mb-3">Active Sessions</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    These are the devices currently logged into your account
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="text-sm font-medium">Current Session</p>
                        <p className="text-xs text-muted-foreground">
                          Browser • {new Date().toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="secondary">Active</Badge>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-sm font-medium mb-3">Account Actions</h4>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start" data-testid="button-download-data">
                      <Globe className="w-4 h-4 mr-2" />
                      Download Your Data
                    </Button>
                    <Button variant="destructive" className="w-full justify-start" data-testid="button-delete-account">
                      <User className="w-4 h-4 mr-2" />
                      Delete Account
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing">
            <Card>
              <CardHeader>
                <CardTitle>Billing & Subscription</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Current Plan</h4>
                    <p className="text-sm text-muted-foreground">
                      {currentOrg?.planType === 'PRO' ? 'Pro Plan - $29/month' : 'Free Plan - $0/month'}
                    </p>
                  </div>
                  <Badge className={currentOrg?.planType === 'PRO' ? 'bg-primary' : 'bg-secondary'}>
                    {currentOrg?.planType || 'FREE'}
                  </Badge>
                </div>

                {currentOrg?.planType !== 'PRO' && (
                  <div className="p-4 border border-primary/20 bg-primary/5 rounded-lg">
                    <h4 className="font-medium text-primary mb-2">Upgrade to Pro</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Get 25 releases per month, priority distribution, and advanced analytics.
                    </p>
                    <Button data-testid="button-upgrade-pro">
                      Upgrade to Pro - $29/month
                    </Button>
                  </div>
                )}

                <Separator />

                <div>
                  <h4 className="text-sm font-medium mb-3">Payment Methods</h4>
                  <div className="text-sm text-muted-foreground mb-4">
                    No payment methods configured
                  </div>
                  <Button variant="outline" data-testid="button-add-payment">
                    Add Payment Method
                  </Button>
                </div>

                <Separator />

                <div>
                  <h4 className="text-sm font-medium mb-3">Billing History</h4>
                  <div className="text-center py-8 text-muted-foreground">
                    No billing history available
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium mb-4">Release Notifications</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified about release status updates via email
                        </p>
                      </div>
                      <Switch
                        checked={notifications.email}
                        onCheckedChange={(checked) => handleNotificationChange('email', checked)}
                        data-testid="switch-email-notifications"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Push Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive push notifications in your browser
                        </p>
                      </div>
                      <Switch
                        checked={notifications.push}
                        onCheckedChange={(checked) => handleNotificationChange('push', checked)}
                        data-testid="switch-push-notifications"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>SMS Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Get text messages for important updates
                        </p>
                      </div>
                      <Switch
                        checked={notifications.sms}
                        onCheckedChange={(checked) => handleNotificationChange('sms', checked)}
                        data-testid="switch-sms-notifications"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-sm font-medium mb-4">Revenue Notifications</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Monthly Reports</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive monthly revenue reports
                        </p>
                      </div>
                      <Switch defaultChecked data-testid="switch-monthly-reports" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Payout Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified when payouts are processed
                        </p>
                      </div>
                      <Switch defaultChecked data-testid="switch-payout-notifications" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api">
            <Card>
              <CardHeader>
                <CardTitle>API Access</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Use API keys to integrate with third-party applications and automate your workflow.
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-3">API Keys</h4>
                  <div className="text-center py-8 text-muted-foreground">
                    No API keys generated yet
                  </div>
                  <Button variant="outline" className="w-full" data-testid="button-generate-api-key">
                    Generate API Key
                  </Button>
                </div>

                <Separator />

                <div>
                  <h4 className="text-sm font-medium mb-3">API Documentation</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Learn how to integrate with our API for bulk uploads and automation.
                  </p>
                  <Button variant="outline" data-testid="button-view-docs">
                    View API Documentation
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
