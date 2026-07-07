import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Local Login",
      credentials: {
        nip: { label: "NIP", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.nip || !credentials?.password) {
          throw new Error("NIP dan Password wajib diisi");
        }

        const user = await prisma.user.findUnique({
          where: { nip: credentials.nip }
        });

        if (!user || !user.password) {
          throw new Error("NIP tidak ditemukan atau tidak memiliki akses lokal");
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error("Password salah");
        }

        return {
          id: user.nip,
          name: user.name,
          email: user.email,
          role: user.role
        };
      }
    }),
    {
      id: "siasn",
      name: "SSO SIASN",
      type: "oauth",
      wellKnown: process.env.SIASN_WELL_KNOWN, // URL Konfigurasi OIDC
      authorization: { params: { scope: "openid profile email" } },
      idToken: true,
      checks: ["pkce", "state"],
      profile(profile) {
        return {
          id: profile.nip || profile.sub,
          name: profile.name,
          email: profile.email,
          role: profile.role || "STUDENT",
        };
      },
      clientId: process.env.SIASN_CLIENT_ID,
      clientSecret: process.env.SIASN_CLIENT_SECRET,
    },
    {
      id: "plasma",
      name: "SSO Plasma",
      type: "oauth",
      wellKnown: process.env.PLASMA_WELL_KNOWN,
      authorization: { params: { scope: "openid profile email" } },
      idToken: true,
      checks: ["pkce", "state"],
      profile(profile) {
        return {
          id: profile.nip || profile.sub,
          name: profile.name,
          email: profile.email,
          role: profile.role || "STUDENT",
        };
      },
      clientId: process.env.PLASMA_CLIENT_ID,
      clientSecret: process.env.PLASMA_CLIENT_SECRET,
    }
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "siasn" || account?.provider === "plasma") {
        // Logika untuk mencocokkan atau membuat user di database lokal berdasarkan NIP
        const nip = (profile as any).nip || user.id;
        
        let localUser = await prisma.user.findUnique({
          where: { nip: nip }
        });

        if (!localUser) {
          // Jika belum ada, buat user baru
          localUser = await prisma.user.create({
            data: {
              nip: nip,
              name: user.name || "User SSO",
              email: user.email || `${nip}@instansi.go.id`,
              role: "STUDENT",
              authMethod: "SSO", // Valid enum: LOCAL, SSO, BOTH
            }
          });
        }
        
        // Update user info from SSO if needed
        (user as any).role = localUser.role;
        (user as any).id = localUser.nip;
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 2 * 60 * 60, // 2 jam (dalam detik)
  },
  secret: process.env.NEXTAUTH_SECRET,
};
