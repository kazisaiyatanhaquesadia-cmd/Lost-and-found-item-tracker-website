import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { ChatWindow } from '@/components/messages/ChatWindow';

interface Conversation {
  userId: string;
  userName: string;
  lastMessage: string;
  lastMessageTime: string;
  unread: number;
}

export const Messages: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchConversations();
    subscribeToNewMessages();
  }, []);

  const fetchConversations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/'); return; }

      const { data: messages } = await supabase
        .from('messages')
        .select('*, sender:profiles!messages_sender_id_fkey(full_name), receiver:profiles!messages_receiver_id_fkey(full_name)')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (!messages) return;

      const convMap = new Map<string, Conversation>();
      for (const msg of messages) {
        const otherUserId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        const otherUserName = msg.sender_id === user.id
          ? (msg.receiver?.full_name || 'Unknown')
          : (msg.sender?.full_name || 'Unknown');

        if (!convMap.has(otherUserId)) {
          convMap.set(otherUserId, {
            userId: otherUserId,
            userName: otherUserName,
            lastMessage: msg.content,
            lastMessageTime: msg.created_at,
            unread: msg.receiver_id === user.id && !msg.read ? 1 : 0,
          });
        } else {
          const conv = convMap.get(otherUserId)!;
          if (msg.receiver_id === user.id && !msg.read) {
            conv.unread += 1;
          }
        }
      }
      setConversations(Array.from(convMap.values()));
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const subscribeToNewMessages = () => {
    const subscription = supabase
      .channel('inbox-channel')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        () => fetchConversations()
      )
      .subscribe();

    return () => subscription.unsubscribe();
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
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
            <Button variant="outline" onClick={() => navigate('/')} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <h2 className="text-2xl font-bold">Messages</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Conversation List */}
            <Card className="shadow-gentle md:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Conversations</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {conversations.length === 0 ? (
                  <div className="text-center py-8 px-4">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No conversations yet</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {conversations.map((conv) => (
                      <button
                        key={conv.userId}
                        onClick={() => setSelectedConv(conv)}
                        className={`w-full text-left p-4 hover:bg-accent/50 transition-colors ${
                          selectedConv?.userId === conv.userId ? 'bg-accent' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>{getInitials(conv.userName)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm">{conv.userName}</span>
                              {conv.unread > 0 && (
                                <Badge variant="default" className="ml-2">{conv.unread}</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Chat Window */}
            <Card className="shadow-gentle md:col-span-2">
              {selectedConv ? (
                <div className="h-[500px] flex flex-col">
                  <CardHeader className="border-b border-border py-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{getInitials(selectedConv.userName)}</AvatarFallback>
                      </Avatar>
                      {selectedConv.userName}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 p-0">
                    <ChatWindow
                      conversationPartnerId={selectedConv.userId}
                      partnerName={selectedConv.userName}
                    />
                  </CardContent>
                </div>
              ) : (
                <div className="h-[500px] flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Select a conversation to start chatting</p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};
