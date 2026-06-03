import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, TrendingUp, Calendar, Heart, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { CommunityFeed } from './CommunityFeed';
import { PostCreator } from './PostCreator';

interface RecentItem {
  id: string;
  title: string;
  type: 'lost' | 'found';
  created_at: string;
  status: string;
  profiles?: { full_name: string };
}

interface ClaimActivity {
  id: string;
  status: string;
  created_at: string;
  items: {
    title: string;
    type: 'lost' | 'found';
  };
  profiles?: { full_name: string };
}

export const CommunityBoard: React.FC = () => {
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [recentClaims, setRecentClaims] = useState<ClaimActivity[]>([]);
  const [stats, setStats] = useState({
    totalItems: 0,
    activeItems: 0,
    successfulReturns: 0,
    communityMembers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCommunityData();
  }, []);

  const fetchCommunityData = async () => {
    setLoading(true);
    try {
      // Fetch recent items
      const { data: itemsData } = await supabase
        .from('items')
        .select(`
          id,
          title,
          type,
          created_at,
          status,
          profiles!items_user_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch recent claims
      const { data: claimsData } = await supabase
        .from('claims')
        .select(`
          id,
          status,
          created_at,
          items(title, type),
          profiles!claims_claimant_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch stats
      const [totalItemsRes, activeItemsRes, returnsRes, membersRes] = await Promise.all([
        supabase.from('items').select('id', { count: 'exact' }),
        supabase.from('items').select('id', { count: 'exact' }).eq('status', 'active'),
        supabase.from('claims').select('id', { count: 'exact' }).eq('status', 'approved'),
        supabase.from('profiles').select('id', { count: 'exact' }),
      ]);

      setRecentItems((itemsData as unknown as RecentItem[]) || []);
      setRecentClaims((claimsData as unknown as ClaimActivity[]) || []);
      setStats({
        totalItems: totalItemsRes.count || 0,
        activeItems: activeItemsRes.count || 0,
        successfulReturns: returnsRes.count || 0,
        communityMembers: membersRes.count || 0,
      });
    } catch (error) {
      console.error('Error fetching community data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Clock className="h-4 w-4" />;
      case 'claimed':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'returned':
        return <CheckCircle className="h-4 w-4 text-success" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Card className="shadow-gentle">
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading community data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Post Creator */}
      <PostCreator onPostCreated={fetchCommunityData} />

      {/* Community Stats */}
      <Card className="shadow-gentle">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Community Overview
          </CardTitle>
          <CardDescription>
            See how our amazing community is helping reunite people with their lost items
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-primary/5 rounded-lg">
              <div className="text-2xl font-bold text-primary">{stats.totalItems}</div>
              <div className="text-sm text-muted-foreground">Total Items</div>
            </div>
            <div className="text-center p-4 bg-warning/5 rounded-lg">
              <div className="text-2xl font-bold text-warning">{stats.activeItems}</div>
              <div className="text-sm text-muted-foreground">Active Items</div>
            </div>
            <div className="text-center p-4 bg-success/5 rounded-lg">
              <div className="text-2xl font-bold text-success">{stats.successfulReturns}</div>
              <div className="text-sm text-muted-foreground">Successful Returns</div>
            </div>
            <div className="text-center p-4 bg-secondary/5 rounded-lg">
              <div className="text-2xl font-bold text-secondary">{stats.communityMembers}</div>
              <div className="text-sm text-muted-foreground">Community Members</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Tabs */}
      <Tabs defaultValue="feed" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="feed">Community Feed</TabsTrigger>
          <TabsTrigger value="recent-items">Recent Items</TabsTrigger>
          <TabsTrigger value="recent-claims">Recent Claims</TabsTrigger>
        </TabsList>

        <TabsContent value="feed">
          <CommunityFeed />
        </TabsContent>

        <TabsContent value="recent-items">
          <Card className="shadow-gentle">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Recent Items Posted
              </CardTitle>
              <CardDescription>
                Latest lost and found items from our community
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentItems.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No recent items to display
                  </p>
                ) : (
                  recentItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {item.type === 'lost' ? (
                          <AlertTriangle className="h-5 w-5 text-warning" />
                        ) : (
                          <Heart className="h-5 w-5 text-secondary" />
                        )}
                        <div>
                          <h4 className="font-medium">{item.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            Posted by {item.profiles?.full_name || 'Anonymous'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={item.type === 'lost' ? 'destructive' : 'secondary'}>
                          {item.type}
                        </Badge>
                        {getStatusIcon(item.status)}
                        <span className="text-xs text-muted-foreground">
                          {formatDate(item.created_at)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent-claims">
          <Card className="shadow-gentle">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success" />
                Recent Claim Activity
              </CardTitle>
              <CardDescription>
                Latest claim attempts and reunions in our community
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentClaims.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No recent claims to display
                  </p>
                ) : (
                  recentClaims.map((claim) => (
                    <div
                      key={claim.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-primary" />
                        <div>
                          <h4 className="font-medium">{claim.items.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            Claimed by {claim.profiles?.full_name || 'Anonymous'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={
                            claim.status === 'approved' ? 'secondary' :
                            claim.status === 'pending' ? 'outline' : 'destructive'
                          }
                        >
                          {claim.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(claim.created_at)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Success Stories */}
      <Card className="bg-gradient-success shadow-warm">
        <CardHeader>
          <CardTitle className="text-success-foreground">
            🎉 This Week's Success Stories
          </CardTitle>
          <CardDescription className="text-success-foreground/90">
            Celebrating our community's amazing achievements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-success-foreground">
            <div className="text-center">
              <div className="text-3xl font-bold">{stats.successfulReturns}</div>
              <div className="text-sm opacity-90">Happy Reunions</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{Math.round(stats.successfulReturns * 0.85)}</div>
              <div className="text-sm opacity-90">Grateful Owners</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{Math.round(stats.successfulReturns * 0.95)}</div>
              <div className="text-sm opacity-90">Kind Finders</div>
            </div>
          </div>
          <div className="mt-6 text-center">
            <Button variant="secondary" className="bg-white/20 hover:bg-white/30 text-success-foreground border-white/30">
              View All Success Stories
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};