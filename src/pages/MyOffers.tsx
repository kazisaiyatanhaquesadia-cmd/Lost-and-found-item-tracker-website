import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, AlertTriangle, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ClaimWithItem {
  id: string;
  item_id: string;
  claimant_id: string;
  message: string | null;
  proof_description: string | null;
  security_answer: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  items: {
    title: string;
    type: string;
    status: string;
  } | null;
  claimant?: {
    full_name: string | null;
  } | null;
}

export const MyOffers: React.FC = () => {
  const [claimsMade, setClaimsMade] = useState<ClaimWithItem[]>([]);
  const [claimsReceived, setClaimsReceived] = useState<ClaimWithItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/'); return; }

      const [madeRes, receivedRes] = await Promise.all([
        supabase
          .from('claims')
          .select('*, items(title, type, status)')
          .eq('claimant_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('claims')
          .select('*, items(title, type, status), claimant:profiles!claims_claimant_id_fkey(full_name)')
          .in('item_id', (
            supabase.from('items').select('id').eq('user_id', user.id) as any
          ))
          .order('created_at', { ascending: false }) as any,
      ]);

      if (madeRes.error) throw madeRes.error;
      setClaimsMade(madeRes.data || []);

      const receivedData = receivedRes.data || [];
      const filtered = receivedData.filter((c: any) => c.claimant_id !== user.id);
      setClaimsReceived(filtered);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (claimId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('claims')
        .update({ status })
        .eq('id', claimId);

      if (error) throw error;
      toast({
        title: "Success",
        description: `Claim ${status} successfully`,
      });
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const formatDate = (date: string) => new Date(date).toLocaleDateString();

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

  return (
    <div className="min-h-screen bg-gradient-warm">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/')} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>

          <Tabs defaultValue="made" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="made">Claims Made ({claimsMade.length})</TabsTrigger>
              <TabsTrigger value="received">Claims Received ({claimsReceived.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="made">
              <Card className="shadow-gentle">
                <CardHeader>
                  <CardTitle>Claims You've Made</CardTitle>
                  <CardDescription>Items you've claimed</CardDescription>
                </CardHeader>
                <CardContent>
                  {claimsMade.length === 0 ? (
                    <div className="text-center py-8">
                      <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">You haven't made any claims yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {claimsMade.map((claim) => (
                        <div key={claim.id} className="p-4 rounded-lg border bg-card">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {claim.items?.type === 'lost' ? (
                                <AlertTriangle className="h-4 w-4 text-warning" />
                              ) : (
                                <Heart className="h-4 w-4 text-secondary" />
                              )}
                              <h4 className="font-medium">{claim.items?.title || 'Unknown Item'}</h4>
                            </div>
                            <Badge variant={
                              claim.status === 'approved' ? 'default' :
                              claim.status === 'rejected' ? 'destructive' : 'outline'
                            }>
                              {claim.status}
                            </Badge>
                          </div>
                          {claim.message && (
                            <p className="text-sm text-muted-foreground mb-1">{claim.message}</p>
                          )}
                          <p className="text-xs text-muted-foreground">{formatDate(claim.created_at)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="received">
              <Card className="shadow-gentle">
                <CardHeader>
                  <CardTitle>Claims on Your Items</CardTitle>
                  <CardDescription>People claiming your items</CardDescription>
                </CardHeader>
                <CardContent>
                  {claimsReceived.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No claims received yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {claimsReceived.map((claim: any) => (
                        <div key={claim.id} className="p-4 rounded-lg border bg-card">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h4 className="font-medium">{claim.items?.title || 'Unknown Item'}</h4>
                              <p className="text-sm text-muted-foreground">
                                Claimant: {claim.claimant?.full_name || 'Anonymous'}
                              </p>
                            </div>
                            <Badge variant={
                              claim.status === 'approved' ? 'default' :
                              claim.status === 'rejected' ? 'destructive' : 'outline'
                            }>
                              {claim.status}
                            </Badge>
                          </div>
                          {claim.message && (
                            <p className="text-sm text-muted-foreground mb-2">{claim.message}</p>
                          )}
                          {claim.status === 'pending' && (
                            <div className="flex gap-2 mt-2">
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleUpdateStatus(claim.id, 'approved')}
                              >
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleUpdateStatus(claim.id, 'rejected')}
                              >
                                Reject
                              </Button>
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">{formatDate(claim.created_at)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};
