import React from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { AuthForm } from '@/components/auth/AuthForm';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { Header } from '@/components/layout/Header';

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-warm">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="text-center animate-pulse">
            <div className="mb-4 p-4 bg-gradient-hero rounded-full w-20 h-20 mx-auto flex items-center justify-center shadow-glow">
              <div className="h-10 w-10 bg-white/30 rounded-full"></div>
            </div>
            <p className="text-lg text-muted-foreground">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-warm">
        <Header />
        <AuthForm onAuthSuccess={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-warm">
      <Header />
      <Dashboard />
    </div>
  );
};

export default Index;
