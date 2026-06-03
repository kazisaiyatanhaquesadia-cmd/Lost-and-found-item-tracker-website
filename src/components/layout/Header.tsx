import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from '@/components/ui/navigation-menu';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { Heart, Search, Users, Plus, AlertTriangle, LogOut, Menu, X, MessageSquare, Shield } from 'lucide-react';

export const Header: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('user_id', user.id)
          .maybeSingle();
        setIsAdmin(profile?.is_admin || false);
      }
    };

    getCurrentUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase
          .from('profiles')
          .select('is_admin')
          .eq('user_id', session.user.id)
          .maybeSingle()
          .then(({ data }) => setIsAdmin(data?.is_admin || false));
      } else {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
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
            <ThemeToggle />

            {user ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/messages')}
                  className="flex items-center gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span className="hidden lg:inline">Messages</span>
                </Button>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/admin')}
                    className="flex items-center gap-2"
                  >
                    <Shield className="h-4 w-4" />
                    <span className="hidden lg:inline">Admin</span>
                  </Button>
                )}
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
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background animate-slide-up">
          <div className="container mx-auto px-4 py-4 space-y-2">
            <button
              className="flex items-center gap-2 p-2 rounded-md hover:bg-accent text-left w-full"
              onClick={() => { navigate('/search'); setMobileMenuOpen(false); }}
            >
              <Search className="h-4 w-4 text-primary" />
              Browse Items
            </button>
            <button
              className="flex items-center gap-2 p-2 rounded-md hover:bg-accent text-left w-full"
              onClick={() => { navigate('/post-lost'); setMobileMenuOpen(false); }}
            >
              <AlertTriangle className="h-4 w-4 text-warning" />
              Report Lost Item
            </button>
            <button
              className="flex items-center gap-2 p-2 rounded-md hover:bg-accent text-left w-full"
              onClick={() => { navigate('/post-found'); setMobileMenuOpen(false); }}
            >
              <Heart className="h-4 w-4 text-secondary" />
              Post Found Item
            </button>
            <button
              className="flex items-center gap-2 p-2 rounded-md hover:bg-accent text-left w-full"
              onClick={() => { navigate('/community'); setMobileMenuOpen(false); }}
            >
              <Users className="h-4 w-4" />
              Community
            </button>
            {user && (
              <>
                <button
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-accent text-left w-full"
                  onClick={() => { navigate('/messages'); setMobileMenuOpen(false); }}
                >
                  <MessageSquare className="h-4 w-4" />
                  Messages
                </button>
                <button
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-accent text-left w-full"
                  onClick={() => { navigate('/my-offers'); setMobileMenuOpen(false); }}
                >
                  <Heart className="h-4 w-4" />
                  My Offers
                </button>
                {isAdmin && (
                  <button
                    className="flex items-center gap-2 p-2 rounded-md hover:bg-accent text-left w-full"
                    onClick={() => { navigate('/admin'); setMobileMenuOpen(false); }}
                  >
                    <Shield className="h-4 w-4" />
                    Admin Dashboard
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};