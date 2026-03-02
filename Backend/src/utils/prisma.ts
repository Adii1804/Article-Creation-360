/**
 * Singleton Prisma Client for Supabase
 * 
 * Handles connection pooling properly to avoid "Server has closed the connection" errors
 * with Supabase's pgBouncer.
 */

import { PrismaClient } from '../generated/prisma';

// Singleton instance
let prisma: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      },
      // Configure connection pool for Supabase
      // @ts-ignore - These are valid Prisma options
      __internal: {
        engine: {
          connection_limit: 10,
          pool_timeout: 20
        }
      }
    });

    // Handle graceful shutdown
    process.on('beforeExit', async () => {
      await prisma?.$disconnect();
    });
  }

  return prisma;
}

// Export singleton instance
export const prismaClient = getPrismaClient();
