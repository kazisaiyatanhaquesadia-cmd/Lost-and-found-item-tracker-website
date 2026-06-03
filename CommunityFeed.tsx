import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ChevronUp, MessageCircle, AlertTriangle, MapPin, Clock, Send, User } from 'lucide-react';

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

export const CommunityFeed: React.FC = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<ItemPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    getCurrentUser();
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Fetch posts with basic info first
      const { data: postsData, error } = await supabase
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
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data to include counts, user interaction, and profile info
      const transformedPosts = await Promise.all(
        (postsData || []).map(async (post) => {
          // Get profile info for the post author
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('user_id', post.user_id)
            .maybeSingle();

          // Get like count
          const { count: likeCount } = await supabase
            .from('item_likes')
            .select('*', { count: 'exact' })
            .eq('item_id', post.id);

          // Get comment count  
          const { count: commentCount } = await supabase
            .from('item_comments')
            .select('*', { count: 'exact' })
            .eq('item_id', post.id);

          // Check if current user has liked
          let userHasLiked = false;
          if (user) {
            const { data: userLike } = await supabase
              .from('item_likes')
              .select('id')
              .eq('item_id', post.id)
              .eq('user_id', user.id)
              .maybeSingle();
            userHasLiked = !!userLike;
          }

          return {
            ...post,
            profiles: profileData,
            like_count: likeCount || 0,
            comment_count: commentCount || 0,
            user_has_liked: userHasLiked,
          };
        })
      );

      setPosts(transformedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast({
        title: "Error",
        description: "Failed to load community posts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (itemId: string) => {
    try {
      const { data: commentsData } = await supabase
        .from('item_comments')
        .select(`
          id,
          content,
          created_at,
          user_id
        `)
        .eq('item_id', itemId)
        .order('created_at', { ascending: true });

      // Get profile info for each comment
      const commentsWithProfiles = await Promise.all(
        (commentsData || []).map(async (comment) => {
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

      setComments(prev => ({
        ...prev,
        [itemId]: (commentsWithProfiles as Comment[]) || []
      }));
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleLike = async (itemId: string) => {
    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to upvote posts",
        variant: "destructive",
      });
      return;
    }

    try {
      const post = posts.find(p => p.id === itemId);
      if (!post) return;

      if (post.user_has_liked) {
        // Unlike
        await supabase
          .from('item_likes')
          .delete()
          .eq('item_id', itemId)
          .eq('user_id', currentUser.id);
        
        setPosts(prev => prev.map(p => 
          p.id === itemId 
            ? { ...p, like_count: p.like_count - 1, user_has_liked: false }
            : p
        ));
      } else {
        // Like
        await supabase
          .from('item_likes')
          .insert({ item_id: itemId, user_id: currentUser.id });
        
        setPosts(prev => prev.map(p => 
          p.id === itemId 
            ? { ...p, like_count: p.like_count + 1, user_has_liked: true }
            : p
        ));
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

  const handleComment = async (itemId: string) => {
    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to comment",
        variant: "destructive",
      });
      return;
    }

    const content = newComment[itemId]?.trim();
    if (!content) return;

    try {
      await supabase
        .from('item_comments')
        .insert({
          item_id: itemId,
          user_id: currentUser.id,
          content: content
        });

      setNewComment(prev => ({ ...prev, [itemId]: '' }));
      setPosts(prev => prev.map(p => 
        p.id === itemId 
          ? { ...p, comment_count: p.comment_count + 1 }
          : p
      ));
      
      // Refresh comments for this item
      if (expandedComments.has(itemId)) {
        fetchComments(itemId);
      }

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

  const toggleComments = (itemId: string) => {
    const newExpanded = new Set(expandedComments);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
      fetchComments(itemId);
    }
    setExpandedComments(newExpanded);
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
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="shadow-gentle">
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-muted rounded-full"></div>
                  <div className="space-y-2">
                    <div className="w-32 h-4 bg-muted rounded"></div>
                    <div className="w-24 h-3 bg-muted rounded"></div>
                  </div>
                </div>
                <div className="w-full h-20 bg-muted rounded"></div>
                <div className="flex gap-4">
                  <div className="w-16 h-8 bg-muted rounded"></div>
                  <div className="w-16 h-8 bg-muted rounded"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {posts.length === 0 ? (
        <Card className="shadow-gentle">
          <CardContent className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No posts yet</h3>
            <p className="text-muted-foreground mb-4">
              Be the first to share a lost or found item with the community!
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline">Report Lost Item</Button>
              <Button>Post Found Item</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        posts.map((post) => (
          <Card key={post.id} className="shadow-gentle hover:shadow-warm transition-shadow">
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
              <div 
                className="cursor-pointer"
                onClick={() => navigate(`/item/${post.id}`)}
              >
                <h3 className="font-semibold text-lg mb-2 hover:text-primary transition-colors">{post.title}</h3>
                <p className="text-muted-foreground">{post.description}</p>
                
                {post.location && (
                  <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {post.location}
                  </div>
                )}
              </div>

              {post.image_urls && post.image_urls.length > 0 && (
                <div 
                  className="cursor-pointer"
                  onClick={() => navigate(`/item/${post.id}`)}
                >
                  {post.image_urls.map((url, index) => (
                    <div key={index} className="aspect-[3/4] max-h-64 rounded-lg overflow-hidden bg-muted mb-2 last:mb-0">
                      <img
                        src={url}
                        alt={`${post.title} ${index + 1}`}
                        className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-4 pt-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleLike(post.id)}
                  className={`flex items-center gap-2 ${
                    post.user_has_liked ? 'text-orange-500' : 'text-muted-foreground'
                  }`}
                >
                  <ChevronUp className={`h-4 w-4 ${post.user_has_liked ? 'fill-current' : ''}`} />
                  {post.like_count}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleComments(post.id)}
                  className="flex items-center gap-2 text-muted-foreground"
                >
                  <MessageCircle className="h-4 w-4" />
                  {post.comment_count}
                </Button>
              </div>

              {expandedComments.has(post.id) && (
                <div className="space-y-4 pt-4 border-t">
                  {/* Add comment form */}
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
                          value={newComment[post.id] || ''}
                          onChange={(e) => setNewComment(prev => ({
                            ...prev,
                            [post.id]: e.target.value
                          }))}
                          className="min-h-[60px] resize-none"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleComment(post.id)}
                          disabled={!newComment[post.id]?.trim()}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Comments list */}
                  <div className="space-y-3">
                    {comments[post.id]?.map((comment) => (
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
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};