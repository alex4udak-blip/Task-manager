import 'next-auth';
import '@auth/core/jwt';

declare module 'next-auth' {
  interface User {
    id: string;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
    };
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    id: string;
  }
}
