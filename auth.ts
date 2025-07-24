import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import { z } from 'zod';
import type { User } from '@/app/lib/definitions';
import bcrypt from 'bcrypt';
import postgres from 'postgres';
 
// 1. Connexion à la base de données PostgreSQL
const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });
 
// 2. Fonction utilitaire pour récupérer un utilisateur par email
async function getUser(email: string): Promise<User | undefined> {
  try {
    // On cherche l'utilisateur dans la table users par son email
    const user = await sql<User[]>`SELECT * FROM users WHERE email=${email}`;
    return user[0]; // Retourne le premier utilisateur trouvé (ou undefined si aucun)
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw new Error('Failed to fetch user.');
  }
}
 
// 3. Configuration de NextAuth avec le provider Credentials
export const { auth, signIn, signOut } = NextAuth({
  ...authConfig, // On importe la config générale (pages, callbacks, etc.)
  providers: [
    Credentials({
      // 4. Fonction appelée lors de la tentative de connexion
      async authorize(credentials) {
        // a. Validation des credentials reçus (email et password) avec Zod
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);
 
        // b. Si la validation réussit
        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
 
          // c. On récupère l'utilisateur correspondant à l'email
          const user = await getUser(email);
          if (!user) return null; // Si l'utilisateur n'existe pas, échec
 
          // d. On compare le mot de passe fourni avec le hash stocké en base
          const passwordsMatch = await bcrypt.compare(password, user.password);
 
          // e. Si le mot de passe est correct, on retourne l'utilisateur (connexion réussie)
          if (passwordsMatch) return user;
        }
 
        // f. Si la validation échoue ou le mot de passe est incorrect, on log et retourne null (échec)
        console.log('Invalid credentials');
        return null;
      },
    }),
  ],
});