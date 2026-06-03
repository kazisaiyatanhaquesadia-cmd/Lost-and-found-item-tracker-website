import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Search, Heart, CheckCircle, Users } from 'lucide-react';

export const DashboardStats: React.FC = () => {
  const [stats, setStats] = useState({
    totalItems: 0,
    activeItems: 0,
    returnedItems: 0,
    communityMembers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch total items count
      const { count: totalItems } = await supabase
        .from('items')
        .select('*', { count: 'exact', head: true });

      // Fetch active items count
      const { count: activeItems } = await supabase
        .from('items')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Fetch returned/claimed items count
      const { count: returnedItems } = await supabase
        .from('items')
        .select('*', { count: 'exact', head: true })
        .in('status', ['claimed', 'returned']);

      // Fetch community members count
      const { count: communityMembers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalItems: totalItems || 0,
        activeItems: activeItems || 0,
        returnedItems: returnedItems || 0,
        communityMembers: communityMembers || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsData = [
    {
      title: "Total Items",
      value: loading ? "..." : stats.totalItems.toLocaleString(),
      description: "Items posted in our community",
      icon: Search,
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      title: "Active Items",
      value: loading ? "..." : stats.activeItems.toLocaleString(),
      description: "Currently looking for owners",
      icon: Heart,
      color: "text-warning",
      bgColor: "bg-warning/10"
    },
    {
      title: "Items Reunited",
      value: loading ? "..." : stats.returnedItems.toLocaleString(),
      description: "Successfully returned to owners",
      icon: CheckCircle,
      color: "text-success",
      bgColor: "bg-success/10"
    },
    {
      title: "Community Members",
      value: loading ? "..." : stats.communityMembers.toLocaleString(),
      description: "People helping each other",
      icon: Users,
      color: "text-secondary",
      bgColor: "bg-secondary/10"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsData.map((stat, index) => (
        <Card key={index} className="shadow-gentle hover:shadow-warm transition-all duration-300 animate-fade-in" style={{animationDelay: `${index * 100}ms`}}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground mb-1">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};