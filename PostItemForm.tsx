import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Upload, Heart, AlertTriangle, MapPin, Calendar } from 'lucide-react';

const itemSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  location: z.string().optional(),
  category_id: z.string().optional(),
  date_lost_found: z.string().optional(),
  contact_email: z.string().optional(),
  contact_phone: z.string().optional(),
  reward_offered: z.string().optional(),
  tags: z.string().optional(),
});

type ItemFormData = z.infer<typeof itemSchema>;

interface PostItemFormProps {
  type: 'lost' | 'found';
  onSuccess?: (itemId: string) => void;
}

export const PostItemForm: React.FC<PostItemFormProps> = ({ type, onSuccess }) => {
  const [categories, setCategories] = useState<{ id: string; name: string; icon: string }[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase.from('categories').select('id, name, icon');
      if (data) setCategories(data.map(c => ({ ...c, icon: c.icon || '📦' })));
    };
    fetchCategories();
  }, []);

  const form = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      title: '',
      description: '',
      location: '',
      tags: '',
    },
  });

  const uploadImages = async (): Promise<string[]> => {
    if (imageFiles.length === 0) return [];
    const imageUrls: string[] = [];
    for (const file of imageFiles) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from('item-images')
        .upload(`item-images/${fileName}`, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage
        .from('item-images')
        .getPublicUrl(data.path);
      imageUrls.push(publicUrl);
    }
    return imageUrls;
  };

  const onSubmit = async (data: ItemFormData) => {
    try {
      setUploading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Please Login First",
          description: "You must be logged in to post items",
          variant: "destructive",
        });
        return;
      }

      const imageUrls = await uploadImages();
      
      const { data: insertedItem, error: insertError } = await supabase
        .from('items')
        .insert({
          title: data.title,
          description: data.description,
          type,
          user_id: user.id,
          category_id: data.category_id || null,
          location: data.location || null,
          date_lost_found: data.date_lost_found || null,
          contact_email: data.contact_email || null,
          contact_phone: data.contact_phone || null,
          reward_offered: data.reward_offered ? parseFloat(data.reward_offered) : null,
          image_urls: imageUrls.length > 0 ? imageUrls : null,
          tags: data.tags ? data.tags.split(',').map(tag => tag.trim()) : null,
          status: 'active',
        })
        .select('id')
        .single();

      if (insertError) throw insertError;

      toast({
        title: `${type === 'lost' ? 'Lost' : 'Found'} Item Posted! 🎉`,
        description: `Your ${type} item has been shared with the community!`,
      });

      form.reset();
      setImageFiles([]);
      onSuccess?.(insertedItem?.id);
      
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to post item. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setImageFiles(prev => [...prev, ...files].slice(0, 5));
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Card className="shadow-gentle">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {type === 'lost' ? (
            <AlertTriangle className="h-5 w-5 text-orange-500" />
          ) : (
            <Heart className="h-5 w-5 text-green-500" />
          )}
          Post {type === 'lost' ? 'Lost' : 'Found'} Item
        </CardTitle>
        <CardDescription>
          Share details to get help from the community
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., iPhone 13 Pro, House Keys" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.icon} {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date_lost_found"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date {type === 'lost' ? 'Lost' : 'Found'}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the item in detail..."
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <MapPin className="h-4 w-4 mt-3 text-muted-foreground" />
                        <Input placeholder="Where was it lost/found?" {...field} />
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contact_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 234 567 8900" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {type === 'lost' && (
              <FormField
                control={form.control}
                name="reward_offered"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reward Offered (Optional)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 50" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags (comma separated)</FormLabel>
                  <FormControl>
                    <Input placeholder="blue, leather, iphone" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <FormLabel>Images (Max 5)</FormLabel>
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-4">
                <div className="flex gap-3 flex-wrap">
                  {imageFiles.map((file, index) => (
                    <div key={index} className="relative w-20 h-20">
                      <img
                        src={URL.createObjectURL(file)}
                        alt=""
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {imageFiles.length < 5 && (
                    <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-50">
                      <Upload className="h-5 w-5 text-gray-400" />
                      <input
                        type="file"
                        className="hidden"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={uploading}
              className="w-full"
            >
              {uploading ? 'Posting...' : `Post ${type === 'lost' ? 'Lost' : 'Found'} Item`}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};