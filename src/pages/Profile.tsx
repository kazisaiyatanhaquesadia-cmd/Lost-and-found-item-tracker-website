import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, Edit3, Save, X, Heart, AlertTriangle, MessageSquare, Trash2, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
}

interface UserItem {
  id: string;
  title: string;
  type: 'lost' | 'found';
  status: string;
  created_at: string;
  description: string;
  location: string | null;
}

export const Profile: React.FC = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userItems, setUserItems] = useState<UserItem[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }

      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Fetch user's items
      const { data: itemsData } = await supabase
        .from('items')
        .select(`
          id,
          title,
          type,
          status,
          created_at,
          description,
          location
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setProfile(profileData);
      setUserItems((itemsData as UserItem[]) || []);
      
      if (profileData) {
        setFormData({
          full_name: profileData.full_name || '',
          phone: profileData.phone || '',
        });
      }
      // Fetch reviews for this user
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('*, reviewer:profiles!reviews_reviewer_id_fkey(full_name, avatar_url)')
        .eq('reviewee_id', user.id)
        .order('created_at', { ascending: false });

      setReviews(reviewsData || []);

      // Fetch my offers/claims
      const { data: offersData } = await supabase
        .from('claims')
        .select('*, items(title, type, status)')
        .eq('claimant_id', user.id)
        .order('created_at', { ascending: false });

      setOffers(offersData || []);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
        })
        .eq('user_id', profile.user_id);

      if (error) throw error;

      setProfile({
        ...profile,
        full_name: formData.full_name,
        phone: formData.phone,
      });
      
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) return;

    setDeletingId(itemId);
    try {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setUserItems(prev => prev.filter(item => item.id !== itemId));
      toast({
        title: "Success",
        description: "Item deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
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

          {/* Profile Header */}
          <Card className="shadow-gentle">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={profile?.avatar_url || ''} />
                    <AvatarFallback className="text-lg">
                      {getInitials(profile?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-2xl">
                      {profile?.full_name || 'Anonymous User'}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {profile?.email}
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant={isEditing ? "outline" : "default"}
                  onClick={() => {
                    if (isEditing) {
                      setIsEditing(false);
                      setFormData({
                        full_name: profile?.full_name || '',
                        phone: profile?.phone || '',
                      });
                    } else {
                      setIsEditing(true);
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  {isEditing ? (
                    <>
                      <X className="h-4 w-4" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <Edit3 className="h-4 w-4" />
                      Edit Profile
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            
            {isEditing && (
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSaveProfile} 
                    disabled={saving}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Profile Content */}
          <Tabs defaultValue="items" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="items">My Items ({userItems.length})</TabsTrigger>
              <TabsTrigger value="offers">My Offers ({offers.length})</TabsTrigger>
              <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="items">
              <Card className="shadow-gentle">
                <CardHeader>
                  <CardTitle>My Posted Items</CardTitle>
                  <CardDescription>
                    Items you've posted to the community
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {userItems.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">
                        You haven't posted any items yet
                      </p>
                      <div className="flex gap-2 justify-center">
                        <Button onClick={() => navigate('/post-lost')} variant="outline">
                          Report Lost Item
                        </Button>
                        <Button onClick={() => navigate('/post-found')}>
                          Post Found Item
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {userItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                          onClick={() => navigate(`/item/${item.id}`)}
                        >
                          <div className="flex items-center gap-3">
                            {item.type === 'lost' ? (
                              <AlertTriangle className="h-5 w-5 text-warning" />
                            ) : (
                              <Heart className="h-5 w-5 text-secondary" />
                            )}
                            <div>
                              <h4 className="font-medium">{item.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                {item.location || 'No location specified'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={item.type === 'lost' ? 'destructive' : 'secondary'}>
                              {item.type}
                            </Badge>
                            <Badge variant="outline">
                              {item.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(item.created_at)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/edit-item/${item.id}`);
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteItem(item.id);
                              }}
                              disabled={deletingId === item.id}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="offers">
              <Card className="shadow-gentle">
                <CardHeader>
                  <CardTitle>My Offers & Claims</CardTitle>
                  <CardDescription>
                    Your claims and offers on items
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {offers.length === 0 ? (
                    <div className="text-center py-8">
                      <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        You haven't made any offers yet
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {offers.map((offer: any) => (
                        <div key={offer.id} className="p-4 rounded-lg border bg-card">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{offer.items?.title || 'Unknown Item'}</h4>
                            <Badge variant={
                              offer.status === 'approved' ? 'default' :
                              offer.status === 'rejected' ? 'destructive' : 'outline'
                            }>
                              {offer.status}
                            </Badge>
                          </div>
                          {offer.message && (
                            <p className="text-sm text-muted-foreground">{offer.message}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            {formatDate(offer.created_at)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="reviews">
              <Card className="shadow-gentle">
                <CardHeader>
                  <CardTitle>Reviews & Ratings</CardTitle>
                  <CardDescription>
                    Feedback from the community
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {reviews.length === 0 ? (
                    <div className="text-center py-8">
                      <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        No reviews yet
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reviews.map((review: any) => (
                        <div key={review.id} className="p-4 rounded-lg border bg-card">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex text-yellow-500">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${i < review.rating ? 'fill-current' : ''}`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-muted-foreground">
                              by {review.reviewer?.full_name || 'Anonymous'}
                            </span>
                          </div>
                          {review.comment && (
                            <p className="text-sm text-muted-foreground">{review.comment}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(review.created_at)}
                          </p>
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