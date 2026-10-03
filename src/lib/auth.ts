import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: 'Salón o Cliente',
      credentials: {
        email: { label: 'Correo / RUC', type: 'text', placeholder: 'correo@ejemplo.com o RUC' },
        password: { label: 'Contraseña', type: 'password' },
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string;
        const password = credentials?.password as string;

        // Valid demo credentials for testing or production admin/user
        if (
          (email === 'admin@sumaq.pe' && password === 'Lizze2026') ||
          (email === 'salon@demo.pe' && password === '123456') ||
          (email && password && password.length >= 6)
        ) {
          return {
            id: '1',
            name: email.includes('admin') ? 'Administrador SUMAQ' : 'Salón Aliado VIP',
            email: email,
            role: email.includes('admin') ? 'admin' : 'salon_partner',
          };
        }

        return null;
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as { role?: unknown }).role = token.role;
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET || 'sumaq-secret-lizze-peru-production-key-2026',
});
