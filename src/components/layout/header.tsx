'use client';

import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function Header() {
  const { data: session } = useSession();

  const initials = session?.user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || session?.user?.email?.[0].toUpperCase() || '?';

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-zinc-800 bg-zinc-950/80 px-4 backdrop-blur-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex flex-1"></div>
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-violet-600 text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-zinc-900 border-zinc-800" align="end">
              <DropdownMenuLabel className="text-zinc-300">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{session?.user?.name || 'User'}</p>
                  <p className="text-xs text-zinc-500">{session?.user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-zinc-800" />
              <DropdownMenuItem asChild>
                <a href="/settings" className="text-zinc-300 cursor-pointer">Settings</a>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-zinc-800" />
              <DropdownMenuItem
                className="text-red-400 cursor-pointer"
                onClick={() => signOut({ callbackUrl: '/login' })}
              >
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
