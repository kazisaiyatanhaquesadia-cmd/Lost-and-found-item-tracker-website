import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Heart, MapPin, Calendar, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RecentItem {
  id: string;
  title: string;
  description: string;
  type: 'lost' | 'found';
  location?: string;
  date_lost_found?: string;
  image_urls?: string[];
  created_at: string;
  categories?: { name: string };
}

export const RecentItemsFeed: React.FC = () => {
  const [items, setItems] = useState<RecentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRecentItems();
  }, []);

  const fetchRecentItems = async () => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select(`
          id,
          title,
          description,
          type,
          location,
          date_lost_found,
          image_urls,
          created_at,
          categories(name)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(2);

      if (error) throw error;
      setItems((data as unknown as RecentItem[]) || []);
    } catch (error) {
      console.error('Error fetching recent items:', error);
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

  const truncateText = (text: string, maxLength: number = 80) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  if (loading) {
    return (
      <Card className="shadow-gentle">
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading recent items...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-gentle">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            Recent Lost & Found Items
          </span>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/search')}
          >
            View All
          </Button>
        </CardTitle>
        <CardDescription>
          See what's been recently posted in our community
        </CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">No items posted yet</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => navigate('/post-lost')}>
                Post Lost Item
              </Button>
              <Button variant="outline" onClick={() => navigate('/post-found')}>
                Post Found Item
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="group relative rounded-lg border bg-card overflow-hidden hover:shadow-gentle transition-all duration-300 cursor-pointer"
                onClick={() => navigate('/search')}
              >
                {/* Image Section */}
                <div className="aspect-video bg-muted relative overflow-hidden">
                  {item.image_urls && item.image_urls.length > 0 ? (
                    <img
                      src={item.image_urls[0]}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.currentTarget;
                        const fallback = target.parentElement?.querySelector('.absolute') as HTMLElement;
                        if (fallback) {
                          target.style.display = 'none';
                          fallback.style.display = 'flex';
                        }
                      }}
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-primary/20 flex items-center justify-center" style={{ display: item.image_urls && item.image_urls.length > 0 ? 'none' : 'flex' }}>
                    {item.type === 'lost' ? (
                      <AlertTriangle className="h-12 w-12 text-warning opacity-50" />
                    ) : (
                      <Heart className="h-12 w-12 text-secondary opacity-50" />
                    )}
                  </div>
                  
                  {/* Type Badge */}
                  <div className="absolute top-2 left-2">
                    <Badge variant={item.type === 'lost' ? 'destructive' : 'secondary'}>
                      {item.type}
                    </Badge>
                  </div>
                  
                  {/* Time Badge */}
                  <div className="absolute top-2 right-2">
                    <Badge variant="outline" className="bg-background/80 backdrop-blur-sm">
                      {formatDate(item.created_at)}
                    </Badge>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-4 space-y-2">
                  <h3 className="font-semibold text-foreground line-clamp-1">
                    {item.title}
                  </h3>
                  
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {truncateText(item.description)}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 text-xs">
                    {item.location && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate max-w-20">{item.location}</span>
                      </div>
                    )}
                    
                    {item.date_lost_found && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(item.date_lost_found).toLocaleDateString()}</span>
                      </div>
                    )}
                    
                    {item.categories?.name && (
                      <Badge variant="outline" className="text-xs">
                        {item.categories.name}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {items.length > 0 && (
          <div className="mt-6 text-center">
            <Button 
              variant="outline" 
              onClick={() => navigate('/search')}
              className="w-full md:w-auto"
            >
              Browse All Items →
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};