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
import { Upload, Heart, AlertTriangle } from 'lucide-react';

const itemSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  location: z.string().optional(),
  category_id: z.string().optional(),
  date_lost_found: z.string().optional(),
  contact_email: z.string().email().optional(),
  contact_phone: z.string().optional(),
  reward_offered: z.string().optional(),
  security_question: z.string().optional(),
  security_answer: z.string().optional(),
  tags: z.string().optional(),
});

type ItemFormData = z.infer<typeof itemSchema>;

interface PostItemFormProps {
  type: 'lost' | 'found';
  onSuccess?: () => void;
}

export const PostItemForm: React.FC<PostItemFormProps> = ({ type, onSuccess }) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const form = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      title: '',
      description: '',
      location: '',
      tags: '',
    },
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (!error && data) {
      setCategories(data);
    }
  };

  const uploadImages = async (): Promise<string[]> => {
    if (imageFiles.length === 0) return [];

    const urls: string[] = [];
    
    for (const file of imageFiles) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `item-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('item-images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('item-images')
        .getPublicUrl(filePath);

      urls.push(publicUrl);
    }

    return urls;
  };

  const onSubmit = async (data: ItemFormData) => {
    try {
      setUploading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to post items",
          variant: "destructive",
        });
        return;
      }

      const imageUrls = await uploadImages();
      
      const itemData = {
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
        security_question: data.security_question || null,
        security_answer: data.security_answer || null,
        image_urls: imageUrls.length > 0 ? imageUrls : null,
        tags: data.tags ? data.tags.split(',').map(tag => tag.trim()) : null,
      };

      const { error } = await supabase
        .from('items')
        .insert([itemData]);

      if (error) throw error;

      toast({
        title: `${type === 'lost' ? 'Lost' : 'Found'} Item Posted! 🎉`,
        description: `Your ${type} item has been posted successfully. We'll help you ${type === 'lost' ? 'find it' : 'reunite it with its owner'}!`,
      });

      form.reset();
      setImageFiles([]);
      onSuccess?.();
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to post item",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setImageFiles(prev => [...prev, ...files].slice(0, 5)); // Max 5 images
  };

  return (
    <Card className="shadow-gentle">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {type === 'lost' ? (
            <AlertTriangle className="h-5 w-5 text-warning" />
          ) : (
            <Heart className="h-5 w-5 text-secondary" />
          )}
          Post {type === 'lost' ? 'Lost' : 'Found'} Item
        </CardTitle>
        <CardDescription>
          Help our community by sharing details about this {type} item
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., iPhone 13 Pro" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
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
                      placeholder="Provide as much detail as possible to help identify the item..."
                      className="min-h-[100px]"
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
                      <Input placeholder="Where was it lost/found?" {...field} />
                    </FormControl>
                    <FormMessage />
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contact_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="your.email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
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
                      <Input placeholder="+1234567890" {...field} />
                    </FormControl>
                    <FormMessage />
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
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
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
                    <Input placeholder="electronics, blue, iPhone, case" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {type === 'lost' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="security_question"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Security Question (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="What's the wallpaper on this device?" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="security_answer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Security Answer</FormLabel>
                      <FormControl>
                        <Input placeholder="Your answer" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="space-y-4">
              <FormLabel>Images (Max 5)</FormLabel>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                <div className="mt-4">
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <span className="text-primary hover:text-primary/80">Click to upload images</span>
                    <input
                      id="image-upload"
                      type="file"
                      className="hidden"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </label>
                </div>
                {imageFiles.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground">
                      {imageFiles.length} image(s) selected
                    </p>
                  </div>
                )}
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={uploading}
              className="w-full"
              variant={type === 'lost' ? 'warning' : 'secondary'}
            >
              {uploading ? 'Posting...' : `Post ${type === 'lost' ? 'Lost' : 'Found'} Item`}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};