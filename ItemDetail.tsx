import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ChevronUp, MessageCircle, AlertTriangle, MapPin, Clock, Send, User, ArrowLeft } from 'lucide-react';

interface ItemPost {
  id: string;
  title: string;
  description: string;
  type: 'lost' | 'found';
  location: string | null;
  created_at: string;
  image_urls: string[] | null;
  status: string;
  user_id: string;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  like_count: number;
  comment_count: number;
  user_has_liked: boolean;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

export default function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<ItemPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      getCurrentUser();
      fetchPost();
      fetchComments();
    }
  }, [id]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const fetchPost = async () => {
    if (!id) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: postData, error } = await supabase
        .from('items')
        .select(`
          id,
          title,
          description,
          type,
          location,
          created_at,
          image_urls,
          status,
          user_id
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!postData) {
        navigate('/community');
        return;
      }

      // Get profile info
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('user_id', postData.user_id)
        .maybeSingle();

      // Get like count
      const { count: likeCount } = await supabase
        .from('item_likes')
        .select('*', { count: 'exact' })
        .eq('item_id', id);

      // Get comment count  
      const { count: commentCount } = await supabase
        .from('item_comments')
        .select('*', { count: 'exact' })
        .eq('item_id', id);

      // Check if current user has liked
      let userHasLiked = false;
      if (user) {
        const { data: userLike } = await supabase
          .from('item_likes')
          .select('id')
          .eq('item_id', id)
          .eq('user_id', user.id)
          .maybeSingle();
        userHasLiked = !!userLike;
      }

      setPost({
        ...postData,
        type: postData.type as 'lost' | 'found',
        profiles: profileData,
        like_count: likeCount || 0,
        comment_count: commentCount || 0,
        user_has_liked: userHasLiked,
      });
    } catch (error) {
      console.error('Error fetching post:', error);
      toast({
        title: "Error",
        description: "Failed to load post",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    if (!id) return;
    
    try {
      const { data: commentsData } = await supabase
        .from('item_comments')
        .select(`
          id,
          content,
          created_at,
          user_id
        `)
        .eq('item_id', id)
        .order('created_at', { ascending: true });

      const commentsWithProfiles = await Promise.all(
        (commentsData || []).map(async (comment: any) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('user_id', comment.user_id)
            .maybeSingle();
          
          return {
            ...comment,
            profiles: profileData
          };
        })
      );

      setComments(commentsWithProfiles);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleLike = async () => {
    if (!currentUser || !post) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to upvote posts",
        variant: "destructive",
      });
      return;
    }

    try {
      if (post.user_has_liked) {
        await supabase
          .from('item_likes')
          .delete()
          .eq('item_id', post.id)
          .eq('user_id', currentUser.id);
        
        setPost(prev => prev ? { 
          ...prev, 
          like_count: prev.like_count - 1, 
          user_has_liked: false 
        } : null);
      } else {
        await supabase
          .from('item_likes')
          .insert({ item_id: post.id, user_id: currentUser.id });
        
        setPost(prev => prev ? { 
          ...prev, 
          like_count: prev.like_count + 1, 
          user_has_liked: true 
        } : null);
      }
    } catch (error) {
      console.error('Error handling like:', error);
      toast({
        title: "Error",
        description: "Failed to update upvote",
        variant: "destructive",
      });
    }
  };

  const handleComment = async () => {
    if (!currentUser || !post) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to comment",
        variant: "destructive",
      });
      return;
    }

    const content = newComment.trim();
    if (!content) return;

    try {
      await supabase
        .from('item_comments')
        .insert({
          item_id: post.id,
          user_id: currentUser.id,
          content: content
        });

      setNewComment('');
      setPost(prev => prev ? { 
        ...prev, 
        comment_count: prev.comment_count + 1 
      } : null);
      
      fetchComments();

      toast({
        title: "Success",
        description: "Comment added successfully",
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-gentle">
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-muted rounded-full"></div>
                  <div className="space-y-2">
                    <div className="w-32 h-4 bg-muted rounded"></div>
                    <div className="w-24 h-3 bg-muted rounded"></div>
                  </div>
                </div>
                <div className="w-full h-60 bg-muted rounded"></div>
                <div className="flex gap-4">
                  <div className="w-16 h-8 bg-muted rounded"></div>
                  <div className="w-16 h-8 bg-muted rounded"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Post not found</h2>
          <Button onClick={() => navigate('/community')}>
            Back to Community
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/community')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Community
        </Button>

        <Card className="shadow-gentle">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={post.profiles?.avatar_url || ''} />
                  <AvatarFallback>
                    {getInitials(post.profiles?.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-medium">
                    {post.profiles?.full_name || 'Anonymous'}
                  </h4>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatDate(post.created_at)}
                  </div>
                </div>
              </div>
              <Badge variant={post.type === 'lost' ? 'destructive' : 'secondary'}>
                {post.type === 'lost' ? (
                  <AlertTriangle className="h-3 w-3 mr-1" />
                ) : (
                  <ChevronUp className="h-3 w-3 mr-1" />
                )}
                {post.type}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-xl mb-3">{post.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{post.description}</p>
              
              {post.location && (
                <div className="flex items-center gap-1 mt-3 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {post.location}
                </div>
              )}
            </div>

            {post.image_urls && post.image_urls.length > 0 && (
              <div className="space-y-2">
                {post.image_urls.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`${post.title} ${index + 1}`}
                    className="w-full rounded-lg border"
                    style={{ maxHeight: 'none', height: 'auto' }}
                  />
                ))}
              </div>
            )}

            <div className="flex items-center gap-4 pt-4 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                className={`flex items-center gap-2 ${
                  post.user_has_liked ? 'text-orange-500' : 'text-muted-foreground'
                }`}
              >
                <ChevronUp className={`h-4 w-4 ${post.user_has_liked ? 'fill-current' : ''}`} />
                {post.like_count}
              </Button>
              
              <div className="flex items-center gap-2 text-muted-foreground">
                <MessageCircle className="h-4 w-4" />
                {post.comment_count}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              {currentUser && (
                <div className="flex gap-2">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 flex gap-2">
                    <Textarea
                      placeholder="Write a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="min-h-[60px] resize-none"
                    />
                    <Button
                      size="sm"
                      onClick={handleComment}
                      disabled={!newComment.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-2">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={comment.profiles?.avatar_url || ''} />
                      <AvatarFallback>
                        {getInitials(comment.profiles?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 bg-muted rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {comment.profiles?.full_name || 'Anonymous'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(comment.created_at)}
                        </span>
                      </div>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}