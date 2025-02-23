import { PrismaClient } from "@prisma/client";

const generateRandomPassword = (length: number = 8) => {
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";

  let password = "";
  password += lowercase[Math.floor(Math.random() * lowercase.length)]; // 1 lowercase
  password += uppercase[Math.floor(Math.random() * uppercase.length)]; // 1 uppercase
  password += numbers[Math.floor(Math.random() * numbers.length)]; // 1 number
  password += symbols[Math.floor(Math.random() * symbols.length)]; // 1 symbol

  const allChars = lowercase + uppercase + numbers + symbols;
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
};

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

export { generateRandomPassword };
export default db;
