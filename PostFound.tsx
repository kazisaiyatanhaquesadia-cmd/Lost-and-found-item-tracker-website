import React from 'react';
import { Header } from '@/components/layout/Header';
import { PostItemForm } from '@/components/items/PostItemForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PostFound: React.FC = () => {
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
              Post a Found Item ❤️
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Thank you for being a good Samaritan! Help us reunite this item with its owner. 
              Your kindness makes our community stronger.
            </p>
          </div>

          <PostItemForm type="found" onSuccess={handleSuccess} />
        </div>
      </main>
    </div>
  );
};