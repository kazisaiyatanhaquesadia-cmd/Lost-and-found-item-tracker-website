import React from 'react';
import { Header } from '@/components/layout/Header';
import { CommunityBoard } from '@/components/community/CommunityBoard';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Community: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-warm">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>

          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-foreground">
              Community Board 👥
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See what's happening in our amazing lost and found community. 
              Celebrate success stories and stay updated with recent activity.
            </p>
          </div>

          <CommunityBoard />
        </div>
      </main>
    </div>
  );
};