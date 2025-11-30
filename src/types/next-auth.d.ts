import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: 'CLIENT' | 'WASHER' | 'ADMIN';
    } & DefaultSession['user'];
  }

  interface User {
    role: 'CLIENT' | 'WASHER' | 'ADMIN';
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: 'CLIENT' | 'WASHER' | 'ADMIN';
  }
}
