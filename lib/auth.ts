// lib/auth.ts
import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GitHubProvider from "next-auth/providers/github";
import EmailProvider from "next-auth/providers/email";
import { prisma } from "./db";
import { MemberRole } from "@prisma/client";
import { sendWelcomeEmail } from "./email";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  providers: [
    GitHubProvider({
      clientId:     process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    EmailProvider({
      server: {
        host: "smtp.resend.com",
        port: 465,
        auth: { user: "resend", pass: process.env.RESEND_API_KEY },
      },
      from: process.env.EMAIL_FROM,
    }),
  ],

  session: { strategy: "jwt" },

  pages: {
    signIn:        "/login",
    error:         "/login",
    verifyRequest: "/login?verify=1",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
      }

      const uid = (token.userId ?? token.sub) as string | undefined;
      if (uid && !token.orgId) {
        const membership = await prisma.organizationMember.findFirst({
          where: { userId: uid },
        });
        token.orgId   = membership?.organizationId ?? null;
        token.orgRole = membership?.role ?? null;
        token.hasOrg  = !!membership;
      }

      return token;
    },

    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: (token.userId ?? token.sub) as string,
        },
        orgId:              token.orgId   as string | null,
        orgRole:            token.orgRole as MemberRole | null,
        hasOrg:             token.hasOrg  as boolean ?? false,
        plan:               token.plan    as string | null ?? null,
        subscriptionStatus: token.subscriptionStatus as string | null ?? null,
      };
    },
  },

  events: {
    // Fires once when a brand-new user record is created
    async createUser({ user }) {
      console.log(`New user: ${user.email}`);
      if (user.email) {
        // Fire-and-forget — don't let email failure break sign-in
        sendWelcomeEmail(user.email, user.name).catch((err) =>
          console.error("Welcome email failed:", err)
        );
      }
    },
  },
};

export default authOptions;

export function isAdmin(session: any): boolean {
  return (
    session?.orgRole === MemberRole.OWNER ||
    session?.orgRole === MemberRole.ADMIN
  );
}
