import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import { checkRateLimit, getUserByEmail, recordUserLogin } from './db';
import { verifyPassword } from './password';

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().min(3).max(255),
  password: z.string().min(1).max(200),
});

// Hash válido de una contraseña aleatoria: se compara siempre para igualar tiempos
// de respuesta cuando el usuario no existe (evita enumeración de cuentas por timing).
const DUMMY_HASH =
  'scrypt$00000000000000000000000000000000$' + '00'.repeat(64);

export const { handlers, signIn, signOut, auth } = NextAuth({
  // AUTH_SECRET es obligatoria: Auth.js falla si no está definida (sin valor por defecto en código).
  session: { strategy: 'jwt', maxAge: 60 * 60 * 8 },
  providers: [
    Credentials({
      name: 'Salón o Cliente',
      credentials: {
        email: { label: 'Correo', type: 'text' },
        password: { label: 'Contraseña', type: 'password' },
      },
      authorize: async (raw, request) => {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const ip = request?.headers?.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

        // Límite por IP y por cuenta: 8 intentos / 15 min
        const okIp = await checkRateLimit(`login:ip:${ip}`, 8, 900);
        const okEmail = await checkRateLimit(`login:email:${email}`, 8, 900);
        if (!okIp || !okEmail) return null;

        const user = await getUserByEmail(email);
        const valid = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
        if (!user || !user.active || !valid) return null;

        await recordUserLogin(user.email, user.role, ip, request?.headers?.get('user-agent') ?? undefined);

        return { id: String(user.id), name: user.name, email: user.email, role: user.role };
      },
    }),
  ],
  pages: { signIn: '/login' },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        token.uid = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as { role?: unknown }).role = token.role;
        (session.user as { id?: unknown }).id = token.uid;
      }
      return session;
    },
  },
});
