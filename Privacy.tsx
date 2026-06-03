import React from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, Eye, Lock, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Privacy: React.FC = () => {
  const navigate = useNavigate();

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
              Back to Home
            </Button>
          </div>

          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-foreground flex items-center justify-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              Privacy Policy
            </h1>
            <p className="text-lg text-muted-foreground">
              Your privacy is important to us. Learn how we protect your information.
            </p>
          </div>

          <Card className="shadow-gentle">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                Information We Collect
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Personal Information</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Name and email address when you create an account</li>
                  <li>Phone number (optional) for contact purposes</li>
                  <li>Profile information you choose to share</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Item Information</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Details about lost or found items you post</li>
                  <li>Photos and descriptions of items</li>
                  <li>Location information where items were lost or found</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-gentle">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                How We Protect Your Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>All data is encrypted in transit and at rest using industry-standard encryption</li>
                <li>We use secure authentication powered by Supabase</li>
                <li>Your personal information is never sold to third parties</li>
                <li>We implement row-level security to ensure you can only access your own data</li>
                <li>Regular security audits and updates to maintain protection standards</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="shadow-gentle">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" />
                Your Rights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>You can update or delete your account information at any time</li>
                <li>You can request a copy of all data we have about you</li>
                <li>You can delete your posts and associated data</li>
                <li>You can opt out of non-essential communications</li>
                <li>You can request complete account deletion</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="shadow-gentle">
            <CardHeader>
              <CardTitle>Contact Us</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                If you have any questions about this Privacy Policy or how we handle your data, 
                please contact us:
              </p>
              <div className="space-y-2 text-sm">
                <p><strong>Email:</strong> privacy@lostandfound.com</p>
                <p><strong>Phone:</strong> +1 (555) 123-4567</p>
                <p><strong>Last Updated:</strong> {new Date().toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};