import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  let connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not defined in environment variables.');
  }

  // 去除可能包裹在环境变量两端的物理双引号
  connectionString = connectionString.replace(/^"|"$/g, '');

  const dbUrl = new URL(connectionString);

  const adapter = new PrismaMariaDb({
    host: dbUrl.hostname || '127.0.0.1',
    port: Number(dbUrl.port) || 3306,
    user: dbUrl.username,
    password: dbUrl.password,
    database: dbUrl.pathname.replace('/', ''),
    allowPublicKeyRetrieval: true,
    ssl: false,
    connectionLimit: 10,
  });

  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
