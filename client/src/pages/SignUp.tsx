import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/lib/supabase';
import { useEffect } from 'react';
import { useLocation } from 'wouter';

export default function SignUpPage() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setLocation('/dashboard');
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setLocation('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Join FlexTab</h1>
          <p className="text-slate-600">Create an account to start tracking</p>
        </div>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={['google', 'github']}
          redirectTo={`${window.location.origin}/dashboard`}
          view="sign_up"
          showLinks={true}
          theme="light"
        />
      </div>
    </div>
  );
}
