import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Search, AlertTriangle, Users, Heart } from 'lucide-react';

interface QuickActionsProps {
  onPostLost: () => void;
  onPostFound: () => void;
  onSearchItems: () => void;
  onViewCommunity: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onPostLost,
  onPostFound,
  onSearchItems,
  onViewCommunity,
}) => {
  const actions = [
    {
      title: "Report Lost Item 🔍",
      description: "Help us help you find your missing treasures",
      icon: AlertTriangle,
      action: onPostLost,
      variant: "warning" as const,
      bgClass: "bg-gradient-to-br from-warning/10 to-warning/5 hover:from-warning/20 hover:to-warning/10"
    },
    {
      title: "Post Found Item 💝",
      description: "Help someone reunite with their lost treasure",
      icon: Heart,
      action: onPostFound,
      variant: "secondary" as const,
      bgClass: "bg-gradient-to-br from-secondary/10 to-secondary/5 hover:from-secondary/20 hover:to-secondary/10"
    },
    {
      title: "Search Items 🔮",
      description: "Browse magical lost and found items in our community",
      icon: Search,
      action: onSearchItems,
      variant: "primary" as const,
      bgClass: "bg-gradient-to-br from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10"
    },
    {
      title: "Community Board ✨",
      description: "See recent magic and success stories",
      icon: Users,
      action: onViewCommunity,
      variant: "success" as const,
      bgClass: "bg-gradient-to-br from-success/10 to-success/5 hover:from-success/20 hover:to-success/10"
    }
  ];

  return (
    <Card className="shadow-magic border-2 border-primary/10 hover:border-primary/30 transition-all duration-300">
      <CardHeader className="bg-gradient-primary/5">
        <CardTitle className="flex items-center gap-2">
          <PlusCircle className="h-5 w-5 text-primary animate-pulse" />
          Quick Magic Actions ⚡
        </CardTitle>
        <CardDescription className="text-muted-foreground/80">
          Take magical action to help build our connected community ✨
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {actions.map((action, index) => (
            <div
              key={index}
              className={`p-5 rounded-xl border-2 border-transparent transition-all duration-300 cursor-pointer ${action.bgClass} hover:shadow-warm hover:border-primary/20 transform hover:scale-105 animate-scale-in group`}
              style={{animationDelay: `${index * 150}ms`}}
              onClick={action.action}
            >
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-xl bg-gradient-${action.variant === 'warning' ? 'hope' : action.variant === 'secondary' ? 'hope' : action.variant === 'primary' ? 'primary' : 'success'} shadow-gentle group-hover:shadow-glow transition-all duration-300`}>
                  <action.icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-foreground mb-2 group-hover:text-primary transition-colors duration-300">{action.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{action.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};