import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, TrendingUp, Users, Shield, Zap, Music } from "lucide-react";
import muzikaLogo from "@assets/Logo_01_1757401362203.png";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10"></div>
        <div className="relative">
          {/* Navigation */}
          <nav className="flex items-center justify-between p-6 lg:px-8">
            <div className="flex items-center space-x-3">
              <img 
                src={muzikaLogo} 
                alt="MUZIKA" 
                className="h-4 w-auto"
              />
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                onClick={() => window.location.href = '/auth/google'}
                data-testid="button-google-login"
                className="flex items-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Увійти через Google
              </Button>
              <Button onClick={handleLogin} variant="outline" data-testid="button-login">
                Replit Sign In
              </Button>
            </div>
          </nav>

          {/* Hero Content */}
          <div className="mx-auto max-w-7xl px-6 pb-24 pt-10 sm:pb-32 lg:flex lg:px-8 lg:py-40">
            <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-xl lg:flex-shrink-0 lg:pt-8">
              <h1 className="mt-10 text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
                Distribute Your Music to the World
              </h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                Get your music on Spotify, Apple Music, and all major streaming platforms. 
                Upload, distribute, and track your revenue with our comprehensive music distribution platform.
              </p>
              <div className="mt-10 flex items-center gap-x-6">
                <Button onClick={handleLogin} size="lg" data-testid="button-get-started">
                  Get Started
                </Button>
                <Button variant="outline" size="lg" data-testid="button-learn-more">
                  Learn More
                </Button>
              </div>
            </div>
            <div className="mx-auto mt-16 flex max-w-2xl sm:mt-24 lg:ml-10 lg:mr-0 lg:mt-0 lg:max-w-none lg:flex-none xl:ml-32">
              <div className="max-w-3xl flex-none sm:max-w-5xl lg:max-w-none">
                <div className="bg-card rounded-xl border border-border p-8 shadow-lg">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-lg"></div>
                      <div>
                        <div className="h-4 bg-muted rounded w-32"></div>
                        <div className="h-3 bg-muted/70 rounded w-24 mt-2"></div>
                      </div>
                      <div className="ml-auto">
                        <div className="px-2 py-1 bg-accent/20 text-accent rounded text-xs">Delivered</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-accent to-primary rounded-lg"></div>
                      <div>
                        <div className="h-4 bg-muted rounded w-28"></div>
                        <div className="h-3 bg-muted/70 rounded w-20 mt-2"></div>
                      </div>
                      <div className="ml-auto">
                        <div className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs">Delivering</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-primary">Everything you need</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Professional music distribution made simple
            </p>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              From upload to royalty collection, we handle everything so you can focus on creating music.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-foreground">
                  <Upload className="h-5 w-5 flex-none text-primary" />
                  Easy Upload
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-muted-foreground">
                  <p className="flex-auto">
                    Drag and drop your tracks, add metadata, and upload artwork with our intuitive interface.
                  </p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-foreground">
                  <TrendingUp className="h-5 w-5 flex-none text-primary" />
                  Revenue Tracking
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-muted-foreground">
                  <p className="flex-auto">
                    Monitor your streams and revenue across all platforms with detailed analytics and reports.
                  </p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-foreground">
                  <Users className="h-5 w-5 flex-none text-primary" />
                  Split Management
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-muted-foreground">
                  <p className="flex-auto">
                    Automatically distribute royalties to collaborators with customizable split percentages.
                  </p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-foreground">
                  <Shield className="h-5 w-5 flex-none text-primary" />
                  Quality Control
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-muted-foreground">
                  <p className="flex-auto">
                    Professional QC review ensures your releases meet all platform requirements.
                  </p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-foreground">
                  <Zap className="h-5 w-5 flex-none text-primary" />
                  Fast Delivery
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-muted-foreground">
                  <p className="flex-auto">
                    Get your music live on all major streaming platforms within days, not weeks.
                  </p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-foreground">
                  <Music className="h-5 w-5 flex-none text-primary" />
                  Global Reach
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-muted-foreground">
                  <p className="flex-auto">
                    Distribute to Spotify, Apple Music, YouTube Music, and 150+ streaming services worldwide.
                  </p>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="py-24 sm:py-32 bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl sm:text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Simple, transparent pricing</h2>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Choose the plan that's right for your music career
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl lg:mx-0 lg:flex lg:max-w-none">
            <div className="flex flex-col gap-6 sm:flex-row lg:gap-8">
              <Card className="flex-1">
                <CardHeader>
                  <CardTitle>Free</CardTitle>
                  <CardDescription>Perfect for getting started</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">$0</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-center">
                      <div className="w-1 h-1 bg-primary rounded-full mr-3"></div>
                      2 releases per month
                    </li>
                    <li className="flex items-center">
                      <div className="w-1 h-1 bg-primary rounded-full mr-3"></div>
                      Basic distribution
                    </li>
                    <li className="flex items-center">
                      <div className="w-1 h-1 bg-primary rounded-full mr-3"></div>
                      Standard delivery time
                    </li>
                  </ul>
                  <Button className="w-full mt-6" variant="outline" onClick={handleLogin} data-testid="button-free-plan">
                    Get Started
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="flex-1 border-primary">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    Pro
                    <span className="ml-2 px-2 py-1 bg-primary text-primary-foreground text-xs rounded">Popular</span>
                  </CardTitle>
                  <CardDescription>For serious musicians</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">$29</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-center">
                      <div className="w-1 h-1 bg-primary rounded-full mr-3"></div>
                      25 releases per month
                    </li>
                    <li className="flex items-center">
                      <div className="w-1 h-1 bg-primary rounded-full mr-3"></div>
                      Priority distribution
                    </li>
                    <li className="flex items-center">
                      <div className="w-1 h-1 bg-primary rounded-full mr-3"></div>
                      Advanced analytics
                    </li>
                    <li className="flex items-center">
                      <div className="w-1 h-1 bg-primary rounded-full mr-3"></div>
                      Custom UPC/ISRC
                    </li>
                  </ul>
                  <Button className="w-full mt-6" onClick={handleLogin} data-testid="button-pro-plan">
                    Start Pro Trial
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary">
        <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
              Ready to share your music with the world?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-primary-foreground/80">
              Join thousands of artists who trust Muzika to distribute their music globally.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button onClick={handleLogin} variant="secondary" size="lg" data-testid="button-start-distributing">
                Start Distributing
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-card border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center">
                <Music className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">Muzika</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 Muzika Distribution. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
