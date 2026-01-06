'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface InviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvite: (email: string) => Promise<void>;
}

export function InviteDialog({ open, onOpenChange, onInvite }: InviteDialogProps) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onInvite(email);
      setSuccess(true);
      setEmail('');
      setTimeout(() => {
        setSuccess(false);
        onOpenChange(false);
      }, 2000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to send invite');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-white">Invite Team Member</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Send an invitation to join this project.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {error && (
              <div className="p-3 text-sm text-red-400 bg-red-900/20 border border-red-900 rounded-md">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 text-sm text-green-400 bg-green-900/20 border border-green-900 rounded-md">
                Invite sent successfully!
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-300">Email address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@example.com"
                required
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !email.trim() || success}>
              {loading ? 'Sending...' : 'Send Invite'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
