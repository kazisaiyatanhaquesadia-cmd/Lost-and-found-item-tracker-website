import React from 'react';
import { Header } from '@/components/layout/Header';
import { PostItemForm } from '@/components/items/PostItemForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PostLost: React.FC = () => {
  const navigate = useNavigate();

  const handleSuccess = (itemId?: string) => {
    if (itemId) {
      navigate(`/item/${itemId}`);
    } else {
      navigate('/search');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-warm">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
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
              Report a Lost Item 🔍
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Don't worry! Our community is here to help you find your lost item. 
              The more details you provide, the better chance we have of reuniting you with your belongings.
            </p>
          </div>

          <PostItemForm type="lost" onSuccess={handleSuccess} />
        </div>
      </main>
    </div>
  );
};