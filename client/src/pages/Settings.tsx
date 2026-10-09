import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { SettingsTab } from '@/components/SettingsTab';

export default function Settings() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();
  useEffect(() => { if (!loading && !isAuthenticated) navigate('/sign-in'); }, [loading, isAuthenticated, navigate]);
  if (loading) return <p role="status" className="p-6">Loading settings…</p>;
  if (!isAuthenticated) return null;
  return <main className="mx-auto max-w-2xl p-6 space-y-6">
    <a className="underline" href="/app">Back to FlexTab</a>
    <h1 className="text-3xl font-bold">Settings</h1>
    <SettingsTab user={user} onLogout={() => void logout()} />
  </main>;
}
