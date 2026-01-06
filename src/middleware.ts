export { auth as middleware } from '@/lib/auth';

export const config = {
  matcher: ['/((?!api/auth|api/health|api/register|login|register|invite|_next|favicon.ico).*)'],
};
