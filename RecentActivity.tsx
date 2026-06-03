import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

interface ActivityItem {
  id: string;
  type: 'lost' | 'found' | 'claimed' | 'returned';
  title: string;
  location: string;
  user: string;
  timestamp: Date;
  status: 'active' | 'pending' | 'completed';
  item_id?: string;
}

export const RecentActivity: React.FC = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentActivity();
  }, []);

  const fetchRecentActivity = async () => {
    try {
      // Fetch recent items (lost/found)
      const { data: itemsData, error: itemsError } = await supabase
        .from('items')
        .select(`
          id,
          title,
          type,
          location,
          status,
          created_at,
          user_id
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(3);

      // Fetch user profiles for items
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name');

      // Fetch recent claims
      const { data: claimsData, error: claimsError } = await supabase
        .from('claims')
        .select(`
          id,
          status,
          created_at,
          item_id,
          claimant_id
        `)
        .order('created_at', { ascending: false })
        .limit(2);

      // Fetch items for claims
      const { data: claimItemsData } = await supabase
        .from('items')
        .select('id, title, location');

      if (itemsError) {
        console.error('Error fetching items:', itemsError);
      }

      if (claimsError) {
        console.error('Error fetching claims:', claimsError);
      }

      const activities: ActivityItem[] = [];

      // Create profile lookup map
      const profileMap = new Map();
      if (profilesData) {
        profilesData.forEach(profile => {
          profileMap.set(profile.user_id, profile.full_name);
        });
      }

      // Create item lookup map
      const itemMap = new Map();
      if (claimItemsData) {
        claimItemsData.forEach(item => {
          itemMap.set(item.id, item);
        });
      }

      // Add item activities
      if (itemsData) {
        itemsData.forEach(item => {
          activities.push({
            id: item.id,
            type: item.type as 'lost' | 'found',
            title: item.title,
            location: item.location || 'Unknown location',
            user: profileMap.get(item.user_id) || 'Anonymous',
            timestamp: new Date(item.created_at),
            status: 'active',
            item_id: item.id
          });
        });
      }

      // Add claim activities
      if (claimsData) {
        claimsData.forEach(claim => {
          const claimItem = itemMap.get(claim.item_id);
          if (claimItem) {
            activities.push({
              id: claim.id,
              type: claim.status === 'approved' ? 'returned' : 'claimed',
              title: claimItem.title,
              location: claimItem.location || 'Unknown location',
              user: profileMap.get(claim.claimant_id) || 'Anonymous',
              timestamp: new Date(claim.created_at),
              status: claim.status === 'pending' ? 'pending' : claim.status === 'approved' ? 'completed' : 'active',
              item_id: claimItem.id
            });
          }
        });
      }

      // Sort by timestamp and take latest 5
      activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      setActivities(activities.slice(0, 5));

    } catch (error) {
      console.error('Error fetching activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleActivityClick = (activity: ActivityItem) => {
    if (activity.item_id) {
      navigate(`/item/${activity.item_id}`);
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'lost':
        return 'warning';
      case 'found':
        return 'secondary';
      case 'claimed':
        return 'primary';
      case 'returned':
        return 'success';
      default:
        return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-primary/10 text-primary';
      case 'pending':
        return 'bg-warning/10 text-warning';
      case 'completed':
        return 'bg-success/10 text-success';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className="shadow-gentle">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Recent Community Activity
        </CardTitle>
        <CardDescription className="text-muted-foreground/80">
          Latest magical updates from our lost and found community ✨
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {loading ? (
            // Loading skeleton
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="flex items-start space-x-4 p-4 rounded-lg bg-muted/30">
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                    <div className="h-3 bg-muted rounded w-1/3"></div>
                  </div>
                </div>
              </div>
            ))
          ) : activities.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-16 w-16 mx-auto mb-4 opacity-30 animate-pulse" />
              <p className="text-lg">No recent activity to show</p>
              <p className="text-sm opacity-75 mt-2">Check back soon for community updates! ✨</p>
            </div>
          ) : (
            activities.map((activity, index) => (
              <div
                key={activity.id}
                onClick={() => handleActivityClick(activity)}
                className="group flex items-start space-x-4 p-5 rounded-xl bg-gradient-to-r from-muted/20 to-muted/40 hover:from-primary/10 hover:to-secondary/10 transition-all duration-300 animate-slide-up cursor-pointer border border-transparent hover:border-primary/20 shadow-gentle hover:shadow-warm transform hover:scale-[1.02]"
                style={{animationDelay: `${index * 100}ms`}}
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-foreground">{activity.title}</h4>
                    <Badge 
                      variant={getActivityColor(activity.type) as any}
                      className="text-xs"
                    >
                      {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-2">
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3" />
                      <span>{activity.location}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <User className="h-3 w-3" />
                      <span>{activity.user}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(activity.status)}`}>
                      {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};