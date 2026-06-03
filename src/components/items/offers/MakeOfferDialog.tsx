import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Heart } from 'lucide-react';

interface MakeOfferDialogProps {
  itemId: string;
  itemOwnerId: string;
  hasSecurityQuestion?: boolean;
  securityQuestion?: string;
  onSuccess?: () => void;
}

export const MakeOfferDialog: React.FC<MakeOfferDialogProps> = ({
  itemId,
  itemOwnerId,
  hasSecurityQuestion,
  securityQuestion,
  onSuccess,
}) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [proofDescription, setProofDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Error", description: "You must be logged in", variant: "destructive" });
        return;
      }

      if (user.id === itemOwnerId) {
        toast({ title: "Error", description: "You cannot claim your own item", variant: "destructive" });
        return;
      }

      const { error } = await supabase
        .from('claims')
        .insert({
          item_id: itemId,
          claimant_id: user.id,
          message: message || null,
          proof_description: proofDescription || null,
          security_answer: securityAnswer || null,
        });

      if (error) throw error;

      toast({
        title: "Offer Submitted! 🎉",
        description: "The item owner will review your claim.",
      });

      setOpen(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit offer",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full flex items-center gap-2">
          <Heart className="h-4 w-4" />
          Make an Offer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Claim This Item</DialogTitle>
          <DialogDescription>
            Explain why you believe this item belongs to you
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="message">Message to the owner</Label>
            <Textarea
              id="message"
              placeholder="Describe how this item belongs to you..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="proof">Proof Description</Label>
            <Textarea
              id="proof"
              placeholder="Provide any proof of ownership..."
              value={proofDescription}
              onChange={(e) => setProofDescription(e.target.value)}
              className="min-h-[60px]"
            />
          </div>
          {hasSecurityQuestion && securityQuestion && (
            <div className="space-y-2">
              <Label htmlFor="security">Security Question</Label>
              <p className="text-sm text-muted-foreground">{securityQuestion}</p>
              <Input
                id="security"
                placeholder="Your answer..."
                value={securityAnswer}
                onChange={(e) => setSecurityAnswer(e.target.value)}
              />
            </div>
          )}
          <DialogFooter>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Submitting...' : 'Submit Claim'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
