import React, { useState } from 'react';
import { DashboardStats } from './DashboardStats';
import { QuickActions } from './QuickActions';
import { RecentActivity } from './RecentActivity';
import { RecentItemsFeed } from './RecentItemsFeed';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const handlePostLost = () => {
    navigate('/post-lost');
  };

  const handlePostFound = () => {
    navigate('/post-found');
  };

  const handleSearchItems = () => {
    navigate('/search');
  };

  const handleViewCommunity = () => {
    navigate('/community');
  };

  return (
    <div className="min-h-screen bg-gradient-warm">
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="text-center animate-fade-in">
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Welcome to Your Dashboard! 🏠
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Your central hub for managing lost and found items. Together, we're building a more connected community where nothing stays lost for long.
            </p>
          </div>

          {/* Stats Overview */}
          <DashboardStats />

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <QuickActions
              onPostLost={handlePostLost}
              onPostFound={handlePostFound}
              onSearchItems={handleSearchItems}
              onViewCommunity={handleViewCommunity}
            />
            <RecentActivity />
          </div>

          {/* Recent Items Feed */}
          <RecentItemsFeed />

          {/* Magical Success Stories Section */}
          <div className="bg-gradient-success rounded-2xl p-8 text-center shadow-magic animate-scale-in relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
            <h3 className="text-3xl font-bold text-success-foreground mb-4 relative z-10">
              ✨ Community Magic Stories
            </h3>
            <p className="text-success-foreground/90 mb-6 max-w-3xl mx-auto leading-relaxed relative z-10">
              This week, our magical community helped reunite 23 people with their lost treasures! 
              From lost phones to treasured jewelry, every return brings sparkles of joy to someone's day.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-success-foreground relative z-10">
              <div className="bg-white/15 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-all duration-300 hover:scale-105">
                <div className="text-3xl font-bold mb-1">156</div>
                <div className="text-sm opacity-90">Magical Returns</div>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-all duration-300 hover:scale-105">
                <div className="text-3xl font-bold mb-1">89</div>
                <div className="text-sm opacity-90">Community Heroes</div>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-all duration-300 hover:scale-105">
                <div className="text-3xl font-bold mb-1">98%</div>
                <div className="text-sm opacity-90">Happy Reunions</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};