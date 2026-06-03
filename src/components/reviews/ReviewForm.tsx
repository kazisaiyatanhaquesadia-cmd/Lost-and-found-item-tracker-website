import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Star } from 'lucide-react';

interface ReviewFormProps {
  revieweeId: string;
  itemId?: string;
  onSuccess?: () => void;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({ revieweeId, itemId, onSuccess }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast({ title: "Error", description: "Please select a rating", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Error", description: "You must be logged in", variant: "destructive" });
        return;
      }

      const { error } = await supabase
        .from('reviews')
        .insert({
          reviewer_id: user.id,
          reviewee_id: revieweeId,
          item_id: itemId || null,
          rating,
          comment: comment || null,
        });

      if (error) throw error;

      toast({ title: "Review Submitted! 🎉", description: "Thank you for your feedback" });
      setRating(0);
      setComment('');
      onSuccess?.();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className="transition-colors"
          >
            <Star
              className={`h-6 w-6 ${
                star <= (hoverRating || rating)
                  ? 'text-yellow-500 fill-yellow-500'
                  : 'text-muted-foreground'
              }`}
            />
          </button>
        ))}
      </div>
      <Textarea
        placeholder="Write your review (optional)..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="min-h-[80px]"
      />
      <Button type="submit" disabled={loading}>
        {loading ? 'Submitting...' : 'Submit Review'}
      </Button>
    </form>
  );
};
