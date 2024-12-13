import { PrismaClient } from "@prisma/client";

const isProd = import.meta.env.PROD;

const createPrismaClient = () =>
  new PrismaClient({
    omit: {
      user: {
        password: true,
        oneTimePassword: true,
      },
    },
  });

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

const db = globalForPrisma.prisma ?? createPrismaClient();

if (!isProd) globalForPrisma.prisma = db;

export default db;
