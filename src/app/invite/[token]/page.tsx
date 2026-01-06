'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const { data: session, status } = useSession();
  const [invite, setInvite] = useState<{ email: string; project: { id: string; name: string; description?: string } } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    fetchInvite();
  }, [token]);

  async function fetchInvite() {
    try {
      const res = await fetch(`/api/invite/${token}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Invalid invite');
      } else {
        setInvite(data);
      }
    } catch {
      setError('Failed to load invite');
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept() {
    setAccepting(true);
    try {
      const res = await fetch(`/api/invite/${token}`, { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to accept invite');
      } else {
        router.push(`/projects/${data.projectId}`);
      }
    } catch {
      setError('Failed to accept invite');
    } finally {
      setAccepting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
        <div className="text-zinc-400">Loading invite...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
        <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Invalid Invite</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-zinc-400">{error}</p>
          </CardContent>
          <CardFooter>
            <Link href="/projects">
              <Button>Go to Projects</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!invite) return null;

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
        <div className="text-zinc-400">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
        <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Project Invite</CardTitle>
            <CardDescription className="text-zinc-400">
              You&apos;ve been invited to join {invite.project.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-zinc-400 mb-4">
              Please sign in or create an account with the email <strong className="text-white">{invite.email}</strong> to accept this invite.
            </p>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Link href="/login">
              <Button variant="outline">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button>Create Account</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
      <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Join {invite.project.name}</CardTitle>
          {invite.project.description && (
            <CardDescription className="text-zinc-400">
              {invite.project.description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <p className="text-zinc-400">
            You&apos;ve been invited to join this project. Click accept to become a team member.
          </p>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Link href="/projects">
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button onClick={handleAccept} disabled={accepting}>
            {accepting ? 'Accepting...' : 'Accept Invite'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
