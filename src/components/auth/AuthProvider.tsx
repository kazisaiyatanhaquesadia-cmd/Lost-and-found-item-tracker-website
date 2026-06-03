import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isBlocked: boolean;
  signOut: () => Promise<void>;
  checkBlocked: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);

  const checkBlocked = async (): Promise<boolean> => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return false;

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_banned')
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (profile?.is_banned) {
        setIsBlocked(true);
        await supabase.auth.signOut();
        return true;
      }
      setIsBlocked(false);
      return false;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('is_banned')
            .eq('user_id', session.user.id)
            .maybeSingle();
          if (profile?.is_banned) {
            setIsBlocked(true);
            await supabase.auth.signOut();
            setUser(null);
            setSession(null);
          }
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_banned')
          .eq('user_id', session.user.id)
          .maybeSingle();
        if (profile?.is_banned) {
          setIsBlocked(true);
          await supabase.auth.signOut();
          setUser(null);
          setSession(null);
        }
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    loading,
    isBlocked,
    signOut,
    checkBlocked,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};