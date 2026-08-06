// types/next-auth.d.ts
import { DefaultSession, DefaultJWT } from "next-auth";
import { MemberRole, Plan, SubscriptionStatus } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
    orgId:              string | null;
    orgRole:            MemberRole | null;
    hasOrg:             boolean;
    plan:               Plan | null;
    subscriptionStatus: SubscriptionStatus | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    userId?:            string;
    orgId?:             string | null;
    orgRole?:           MemberRole | null;
    hasOrg?:            boolean;
    plan?:              Plan | null;
    subscriptionStatus?: SubscriptionStatus | null;
  }
}
