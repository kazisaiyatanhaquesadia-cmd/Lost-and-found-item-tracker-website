import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { PostItemForm } from '@/components/items/PostItemForm';

export const EditItem: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchItem();
  }, [id]);

  const fetchItem = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/'); return; }

      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error || !data || data.user_id !== user.id) {
        navigate('/profile');
        return;
      }
      setItem(data);
    } catch {
      navigate('/profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-warm">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </main>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-gradient-warm">
        <Header />
        <main className="container mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground">Item not found</p>
          <Button onClick={() => navigate('/profile')} className="mt-4">Back to Profile</Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-warm">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <Button
            variant="outline"
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Profile
          </Button>
          <PostItemForm
            type={item.type as 'lost' | 'found'}
            editItem={item}
            onSuccess={() => navigate('/profile')}
          />
        </div>
      </main>
    </div>
  );
};
