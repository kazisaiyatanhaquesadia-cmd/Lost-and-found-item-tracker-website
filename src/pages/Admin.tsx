import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, AlertTriangle, Ban, Users, FileText, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  is_admin: boolean | null;
  is_banned: boolean | null;
  created_at: string;
}

interface Complaint {
  id: string;
  reporter_id: string;
  reported_user_id: string | null;
  item_id: string | null;
  reason: string;
  description: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

interface Warning {
  id: string;
  user_id: string;
  admin_id: string;
  reason: string;
  created_at: string;
}

export const Admin: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [warningReason, setWarningReason] = useState('');
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [complaintDialogOpen, setComplaintDialogOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/'); return; }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!profile?.is_admin) {
        toast({ title: "Access Denied", description: "Admin access required", variant: "destructive" });
        navigate('/');
        return;
      }

      setIsAdmin(true);
      fetchData();
    } catch {
      navigate('/');
    }
  };

  const fetchData = async () => {
    try {
      const [usersRes, complaintsRes, warningsRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('complaints').select('*').order('created_at', { ascending: false }),
        supabase.from('warnings').select('*').order('created_at', { ascending: false }),
      ]);

      if (usersRes.error) throw usersRes.error;
      if (complaintsRes.error) throw complaintsRes.error;
      if (warningsRes.error) throw warningsRes.error;

      setUsers(usersRes.data || []);
      setComplaints(complaintsRes.data || []);
      setWarnings(warningsRes.data || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBan = async (userId: string, currentBanned: boolean | null) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_banned: !currentBanned })
        .eq('user_id', userId);

      if (error) throw error;
      toast({
        title: "Success",
        description: `User ${currentBanned ? 'unbanned' : 'banned'} successfully`,
      });
      fetchData();
      setBanDialogOpen(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleIssueWarning = async () => {
    if (!selectedUserId || !warningReason.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('warnings')
        .insert({
          user_id: selectedUserId,
          admin_id: user!.id,
          reason: warningReason,
        });

      if (error) throw error;
      toast({ title: "Success", description: "Warning issued successfully" });
      setWarningReason('');
      setSelectedUserId(null);
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleUpdateComplaint = async (complaintId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('complaints')
        .update({ status, admin_notes: adminNotes || null })
        .eq('id', complaintId);

      if (error) throw error;
      toast({ title: "Success", description: `Complaint ${status}` });
      setComplaintDialogOpen(false);
      setAdminNotes('');
      setSelectedComplaint(null);
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

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-gradient-warm">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/')} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Shield className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">Admin Dashboard</h2>
          </div>

          <Tabs defaultValue="users" className="space-y-4">
            <TabsList>
              <TabsTrigger value="users">
                <Users className="h-4 w-4 mr-2" />
                Users ({users.length})
              </TabsTrigger>
              <TabsTrigger value="complaints">
                <FileText className="h-4 w-4 mr-2" />
                Complaints ({complaints.length})
              </TabsTrigger>
              <TabsTrigger value="warnings">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Warnings ({warnings.length})
              </TabsTrigger>
            </TabsList>

            {/* Users Tab */}
            <TabsContent value="users">
              <Card className="shadow-gentle">
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>Manage registered users</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {users.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{user.full_name || 'Anonymous'}</span>
                            {user.is_admin && (
                              <Badge variant="default" className="bg-primary">Admin</Badge>
                            )}
                            {user.is_banned && (
                              <Badge variant="destructive">Banned</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          <p className="text-xs text-muted-foreground">Joined: {formatDate(user.created_at)}</p>
                        </div>
                        <div className="flex gap-2">
                          <Dialog open={banDialogOpen && selectedUserId === user.user_id} onOpenChange={(open) => { setBanDialogOpen(open); if (open) setSelectedUserId(user.user_id); }}>
                            <DialogTrigger asChild>
                              <Button variant={user.is_banned ? "outline" : "destructive"} size="sm">
                                <Ban className="h-4 w-4 mr-1" />
                                {user.is_banned ? 'Unban' : 'Ban'}
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>{user.is_banned ? 'Unban' : 'Ban'} User</DialogTitle>
                              </DialogHeader>
                              <p>Are you sure you want to {user.is_banned ? 'unban' : 'ban'} {user.full_name || 'this user'}?</p>
                              <div className="flex gap-2 justify-end mt-4">
                                <Button variant="outline" onClick={() => setBanDialogOpen(false)}>Cancel</Button>
                                <Button
                                  variant={user.is_banned ? "default" : "destructive"}
                                  onClick={() => handleToggleBan(user.user_id, user.is_banned)}
                                >
                                  {user.is_banned ? 'Unban' : 'Ban'}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => setSelectedUserId(user.user_id)}>
                                <AlertTriangle className="h-4 w-4 mr-1" />
                                Warn
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Issue Warning to {user.full_name || 'User'}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label>Reason for warning</Label>
                                  <Textarea
                                    value={warningReason}
                                    onChange={(e) => setWarningReason(e.target.value)}
                                    placeholder="Describe the reason for this warning..."
                                  />
                                </div>
                                <Button
                                  onClick={handleIssueWarning}
                                  disabled={!warningReason.trim()}
                                >
                                  Issue Warning
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Complaints Tab */}
            <TabsContent value="complaints">
              <Card className="shadow-gentle">
                <CardHeader>
                  <CardTitle>Complaint Management</CardTitle>
                  <CardDescription>Review and resolve user complaints</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {complaints.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No complaints</p>
                    ) : (
                      complaints.map((complaint) => (
                        <div key={complaint.id} className="p-4 rounded-lg border bg-card">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant={
                                complaint.status === 'resolved' ? 'default' :
                                complaint.status === 'reviewed' ? 'secondary' : 'destructive'
                              }>
                                {complaint.status}
                              </Badge>
                              <span className="font-medium">{complaint.reason}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">{formatDate(complaint.created_at)}</span>
                          </div>
                          {complaint.description && (
                            <p className="text-sm text-muted-foreground mb-2">{complaint.description}</p>
                          )}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedComplaint(complaint);
                                  setAdminNotes(complaint.admin_notes || '');
                                }}
                              >
                                Review & Resolve
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Review Complaint</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <p><strong>Reason:</strong> {complaint.reason}</p>
                                {complaint.description && <p><strong>Description:</strong> {complaint.description}</p>}
                                <div className="space-y-2">
                                  <Label>Admin Notes</Label>
                                  <Textarea
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    placeholder="Add admin notes..."
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Select
                                    onValueChange={(value) => handleUpdateComplaint(complaint.id, value)}
                                    defaultValue={complaint.status}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Change status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="reviewed">Mark as Reviewed</SelectItem>
                                      <SelectItem value="resolved">Mark as Resolved</SelectItem>
                                      <SelectItem value="dismissed">Dismiss</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Warnings Tab */}
            <TabsContent value="warnings">
              <Card className="shadow-gentle">
                <CardHeader>
                  <CardTitle>Issued Warnings</CardTitle>
                  <CardDescription>All warnings issued to users</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {warnings.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No warnings issued</p>
                    ) : (
                      warnings.map((warning) => (
                        <div key={warning.id} className="p-4 rounded-lg border bg-card">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="destructive">Warning</Badge>
                            <span className="text-xs text-muted-foreground">{formatDate(warning.created_at)}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{warning.reason}</p>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};
