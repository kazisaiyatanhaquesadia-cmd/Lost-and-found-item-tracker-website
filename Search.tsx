import React from 'react';
import { Header } from '@/components/layout/Header';
import { SearchItems } from '@/components/items/SearchItems';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Search: React.FC = () => {
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
              Search Lost & Found Items 🔎
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Browse through lost and found items in our community. 
              Use filters to narrow down your search and find what you're looking for.
            </p>
          </div>

          <SearchItems />
        </div>
      </main>
    </div>
  );
};