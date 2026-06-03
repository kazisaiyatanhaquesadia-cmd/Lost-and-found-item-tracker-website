import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Camera, MapPin, Users, Globe, AlertTriangle, Heart, X, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PostCreatorProps {
  onPostCreated: () => void;
}

export const PostCreator: React.FC<PostCreatorProps> = ({ onPostCreated }) => {
  const [content, setContent] = useState('');
  const [type, setType] = useState<'lost' | 'found'>('lost');
  const [location, setLocation] = useState('');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; profile?: { full_name?: string; avatar_url?: string } } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  React.useEffect(() => {
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      setCurrentUser({ ...user, profile });
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + selectedImages.length > 4) {
      toast({
        title: "Too many images",
        description: "You can only upload up to 4 images per post",
        variant: "destructive",
      });
      return;
    }
    setSelectedImages(prev => [...prev, ...files]);
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (): Promise<string[]> => {
    const imageUrls: string[] = [];
    
    for (const image of selectedImages) {
      const fileExt = image.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from('item-images')
        .upload(`item-images/${fileName}`, image);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('item-images')
        .getPublicUrl(data.path);

      imageUrls.push(publicUrl);
    }

    return imageUrls;
  };

  const handlePost = async () => {
    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create a post",
        variant: "destructive",
      });
      return;
    }

    if (!content.trim()) {
      toast({
        title: "Content Required",
        description: "Please write something about your lost or found item",
        variant: "destructive",
      });
      return;
    }

    setIsPosting(true);
    try {
      let imageUrls: string[] = [];
      if (selectedImages.length > 0) {
        imageUrls = await uploadImages();
      }

      const { data: insertedItem, error } = await supabase
        .from('items')
        .insert({
          title: content.slice(0, 100) + (content.length > 100 ? '...' : ''),
          description: content,
          type,
          location: location || null,
          image_urls: imageUrls.length > 0 ? imageUrls : null,
          user_id: currentUser.id,
          status: 'active'
        })
        .select('id')
        .single();

      if (error) throw error;

      setContent('');
      setLocation('');
      setSelectedImages([]);
      setType('lost');
      onPostCreated();

      if (insertedItem?.id) {
        navigate(`/item/${insertedItem.id}`);
        return;
      }
      
      toast({
        title: "Success",
        description: `Your ${type} item post has been shared with the community!`,
      });
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPosting(false);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (!currentUser) {
    return (
      <Card className="shadow-gentle">
        <CardContent className="p-6 text-center">
          <div className="space-y-4">
            <Users className="h-12 w-12 text-muted-foreground mx-auto" />
            <div>
              <h3 className="font-semibold text-lg">Join the Community</h3>
              <p className="text-muted-foreground">Sign in to share your lost and found items</p>
            </div>
            <Button onClick={() => navigate('/?auth=true')}>
              Sign In to Post
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-gentle">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={currentUser.profile?.avatar_url || ''} />
            <AvatarFallback>
              {getInitials(currentUser.profile?.full_name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h4 className="font-medium">
              {currentUser.profile?.full_name || 'Anonymous'}
            </h4>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Globe className="h-3 w-3" />
              <span>Public</span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <Textarea
            placeholder="Have you lost or found something? Share the details with our community..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[100px] resize-none border-0 p-0 text-lg placeholder:text-muted-foreground focus-visible:ring-0"
          />

          <div className="flex gap-2">
            <Select value={type} onValueChange={(value: 'lost' | 'found') => setType(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lost">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    Lost Item
                  </div>
                </SelectItem>
                <SelectItem value="found">
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-secondary" />
                    Found Item
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Add location (optional)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="flex-1"
            />
          </div>

          {selectedImages.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {selectedImages.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={URL.createObjectURL(image)}
                    alt={`Selected ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-black/70 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {selectedImages.length < 4 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center hover:border-primary/50 transition-colors"
                >
                  <Plus className="h-6 w-6 text-muted-foreground" />
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 text-muted-foreground hover:text-primary"
            >
              <Camera className="h-4 w-4" />
              Photo
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    (position) => {
                      setLocation(`${position.coords.latitude}, ${position.coords.longitude}`);
                      toast({
                        title: "Location Added",
                        description: "Your current location has been added to the post",
                      });
                    },
                    () => {
                      toast({
                        title: "Location Access Denied",
                        description: "Please add location manually",
                        variant: "destructive",
                      });
                    }
                  );
                }
              }}
              className="flex items-center gap-2 text-muted-foreground hover:text-primary"
            >
              <MapPin className="h-4 w-4" />
              Location
            </Button>
          </div>

          <Button 
            onClick={handlePost} 
            disabled={isPosting || !content.trim()}
            className="px-6"
          >
            {isPosting ? 'Posting...' : 'Post'}
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageSelect}
          className="hidden"
        />
      </CardContent>
    </Card>
  );
};