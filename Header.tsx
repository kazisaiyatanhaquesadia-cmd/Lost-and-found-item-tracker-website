import React from 'react';
import { Button } from '@/components/ui/button';
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from '@/components/ui/navigation-menu';
import { useAuth } from '@/components/auth/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { Heart, Search, Users, Plus, AlertTriangle, LogOut, Menu } from 'lucide-react';

export const Header: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
  };

  return (
    <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div 
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate('/')}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-hero flex items-center justify-center shadow-glow animate-float">
              <Heart className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl text-foreground">
              Lost & Found
            </span>
          </div>

          {/* Navigation Menu */}
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Browse Items</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid gap-1 p-4 w-[300px]">
                    <NavigationMenuLink asChild>
                      <button
                        className="flex items-center gap-2 p-2 rounded-md hover:bg-accent text-left w-full"
                        onClick={() => navigate('/search')}
                      >
                        <Search className="h-4 w-4 text-primary" />
                        <div>
                          <div className="font-medium">All Items</div>
                          <div className="text-sm text-muted-foreground">Browse all lost & found items</div>
                        </div>
                      </button>
                    </NavigationMenuLink>
                    <NavigationMenuLink asChild>
                      <button
                        className="flex items-center gap-2 p-2 rounded-md hover:bg-accent text-left w-full"
                        onClick={() => navigate('/search?type=lost')}
                      >
                        <AlertTriangle className="h-4 w-4 text-warning" />
                        <div>
                          <div className="font-medium">Lost Items</div>
                          <div className="text-sm text-muted-foreground">Items people are looking for</div>
                        </div>
                      </button>
                    </NavigationMenuLink>
                    <NavigationMenuLink asChild>
                      <button
                        className="flex items-center gap-2 p-2 rounded-md hover:bg-accent text-left w-full"
                        onClick={() => navigate('/search?type=found')}
                      >
                        <Heart className="h-4 w-4 text-secondary" />
                        <div>
                          <div className="font-medium">Found Items</div>
                          <div className="text-sm text-muted-foreground">Items waiting for their owners</div>
                        </div>
                      </button>
                    </NavigationMenuLink>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
              
              <NavigationMenuItem>
                <NavigationMenuTrigger>Post Item</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid gap-1 p-4 w-[280px]">
                    <NavigationMenuLink asChild>
                      <button
                        className="flex items-center gap-2 p-2 rounded-md hover:bg-accent text-left w-full"
                        onClick={() => navigate('/post-lost')}
                      >
                        <AlertTriangle className="h-4 w-4 text-warning" />
                        <div>
                          <div className="font-medium">Report Lost Item</div>
                          <div className="text-sm text-muted-foreground">Let the community help you find it</div>
                        </div>
                      </button>
                    </NavigationMenuLink>
                    <NavigationMenuLink asChild>
                      <button
                        className="flex items-center gap-2 p-2 rounded-md hover:bg-accent text-left w-full"
                        onClick={() => navigate('/post-found')}
                      >
                        <Heart className="h-4 w-4 text-secondary" />
                        <div>
                          <div className="font-medium">Post Found Item</div>
                          <div className="text-sm text-muted-foreground">Help reunite items with owners</div>
                        </div>
                      </button>
                    </NavigationMenuLink>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <button
                    className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent transition-colors"
                    onClick={() => navigate('/community')}
                  >
                    <Users className="h-4 w-4" />
                    Community
                  </button>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/profile')}
                  className="flex items-center gap-2"
                >
                  <span className="text-sm">Profile</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign Out</span>
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => navigate('/?auth=true')}
                size="sm"
              >
                Sign In
              </Button>
            )}

            {/* Mobile menu button */}
            <Button
              variant="outline"
              size="sm"
              className="md:hidden"
              onClick={() => {/* Add mobile menu toggle logic */}}
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};