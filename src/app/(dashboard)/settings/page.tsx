'use client';

import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SettingsPage() {
  const { data: session } = useSession();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-zinc-400 mt-1">Manage your account settings</p>
      </div>

      <Card className="bg-zinc-900 border-zinc-800 max-w-2xl">
        <CardHeader>
          <CardTitle className="text-white">Profile</CardTitle>
          <CardDescription className="text-zinc-400">
            Your account information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm text-zinc-400">Name</label>
            <p className="text-white">{session?.user?.name || 'Not set'}</p>
          </div>
          <div>
            <label className="text-sm text-zinc-400">Email</label>
            <p className="text-white">{session?.user?.email}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
