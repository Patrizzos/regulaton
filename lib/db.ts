// lib/db.ts
// Prisma client singleton. In dev, Next.js hot-reload creates new module
// instances on every change — without this pattern you'd exhaust the
// connection pool very quickly.
//
// DATABASE_URL should point at Neon's pooled (PgBouncer) endpoint in all
// environments — see .env.local. That, plus the retry below, is what keeps
// long-idle instances from surfacing "57P01 terminating connection due to
// administrator command" the first time a query runs after Neon's compute
// auto-suspends.

import { PrismaClient, Prisma } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

  // Transparently retry a query once if it fails because the underlying
  // connection was terminated (e.g. Neon waking up from auto-suspend).
  // Prisma's connection pool will open a fresh connection on the retry.
  return client.$extends({
    query: {
      async $allOperations({ args, query }) {
        try {
          return await query(args);
        } catch (err) {
          const isDroppedConnection =
            (err instanceof Prisma.PrismaClientKnownRequestError &&
              (err.code === "P1017" || err.code === "P1001")) ||
            (err instanceof Error && /administrator command|Connection terminated|57P01/.test(err.message));

          if (!isDroppedConnection) throw err;

          return await query(args);
        }
      },
    },
  });
}

export const prisma = globalForPrisma.prisma ?? (createPrismaClient() as unknown as PrismaClient);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

