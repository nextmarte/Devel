import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import bcryptjs from "bcryptjs";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // CredentialsProvider para email/password
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "seu@email.com" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email e senha são obrigatórios");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { role: true, subscription: { include: { plan: true } } },
        });

        if (!user || !user.password_hash) {
          throw new Error("Email ou senha inválidos");
        }

        // Validar senha
        const isPasswordValid = await bcryptjs.compare(
          credentials.password,
          user.password_hash
        );

        if (!isPasswordValid) {
          throw new Error("Email ou senha inválidos");
        }

        if (!user.is_active) {
          throw new Error("Usuário desativado");
        }

        if (!user.email_verified) {
          throw new Error("Email não verificado");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role?.name,
          subscriptionPlan: user.subscription?.plan?.name,
          subscriptionStatus: user.subscription?.status,
        };
      },
    }),

    // OAuth Providers
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      allowDangerousEmailAccountLinking: true,
    }),

    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
      allowDangerousEmailAccountLinking: true,
    }),
  ],

  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },

  callbacks: {
    // Callback do JWT - chamado quando um JWT é criado ou atualizado
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = user.role || "";
        token.subscriptionPlan = user.subscriptionPlan || "";
        token.subscriptionStatus = user.subscriptionStatus || "";
      }

      return token;
    },

    // Callback da sessão - chamado quando a sessão é usada
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.subscriptionPlan = token.subscriptionPlan as string;
        session.user.subscriptionStatus = token.subscriptionStatus as string;
      }

      return session;
    },

    // Callback de signin - validações extras
    async signIn({ user, account, profile, email, credentials }) {
      // Se é OAuth, criar/atualizar usuário
      if (account && account.type === "oauth") {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });

        if (!existingUser) {
          // Criar novo usuário com plano free
          const freeRole = await prisma.role.findUnique({
            where: { name: "free" },
          });

          const freePlan = await prisma.plan.findUnique({
            where: { name: "Free" },
          });

          if (!freeRole || !freePlan) {
            console.error("Role 'free' ou Plan 'Free' não encontrado");
            return false;
          }

          await prisma.user.create({
            data: {
              email: user.email!,
              name: user.name || profile?.name || email,
              image: user.image || profile?.image,
              oauth_provider: account.provider,
              oauth_id: account.providerAccountId,
              email_verified: new Date(),
              is_active: true,
              role_id: freeRole.id,
              subscription: {
                create: {
                  plan_id: freePlan.id,
                  status: "active",
                  current_period_start: new Date(),
                  current_period_end: new Date(
                    new Date().setDate(new Date().getDate() + 30)
                  ),
                },
              },
            },
          });
        } else if (!existingUser.is_active) {
          // Se usuário existe mas está desativado
          return false;
        }
      }

      return true;
    },

    // Callback de redirect
    async redirect({ url, baseUrl }) {
      // Se é uma URL relativa, permite
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Se é na mesma origem, permite
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },

  // Configurações de sessão
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 dias
    updateAge: 24 * 60 * 60, // Atualizar a cada 24 horas
  },

  // Configurações de JWT
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },

    // Events para logging/auditoria
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      // Log do sign in
      if (user.email) {
        await prisma.auditLog.create({
          data: {
            user_id: user.id as string,
            action: isNewUser ? "USER_CREATED_OAUTH" : "USER_SIGNIN",
            resource_type: "auth",
            resource_id: user.id as string,
            ip_address: "unknown", // Será preenchido pela middleware
            user_agent: "unknown", // Será preenchido pela middleware
          },
        });
      }
    },

    async signOut({ token }) {
      // Log do sign out
      if (token.sub) {
        await prisma.auditLog.create({
          data: {
            user_id: token.sub,
            action: "USER_SIGNOUT",
            resource_type: "auth",
            resource_id: token.sub,
            ip_address: "unknown",
            user_agent: "unknown",
          },
        });
      }
    },
  },

  // Debug em desenvolvimento
  debug: process.env.NODE_ENV === "development",
};

// Type extensions para adicionar campos customizados à sessão
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string | null;
      image: string | null;
      role: string;
      subscriptionPlan: string;
      subscriptionStatus: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
    role?: string;
    subscriptionPlan?: string;
    subscriptionStatus?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    subscriptionPlan: string;
    subscriptionStatus: string;
  }
}
