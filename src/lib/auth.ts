import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
// @ts-ignore - Incompatibilidad de tipos conocida entre @auth/prisma-adapter y next-auth
import { PrismaAdapter } from '@auth/prisma-adapter';
import prisma from '@/lib/prisma';
import { verifyCredentials } from '@/services/user.service';
import type { AuthOptions } from 'next-auth';

export const authOptions: AuthOptions = {
  // @ts-ignore - Incompatibilidad de tipos conocida entre @auth/prisma-adapter y next-auth
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' as const },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials) return null;
        const user = await verifyCredentials(credentials.email, credentials.password);
        if (!user) return null;
        return { 
          id: user.id, 
          name: user.name, 
          email: user.email,
          role: user.role, // Incluir rol en la sesión
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: any) {
      // Incluir rol en el token JWT
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }: any) {
      // Incluir rol en la sesión
      if (session.user) {
        session.user.role = token.role;
        session.user.id = token.id;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
};

export default NextAuth(authOptions);
