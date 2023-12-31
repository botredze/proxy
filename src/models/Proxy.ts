import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: env.dbUrl,
    },
  },
});

export async function getProxies() {
  return prisma.proxy.findMany();
}

export async function updateProxyRetryCount(proxyId: number, retryCount: number) {
  await prisma.proxy.update({
    where: { id: proxyId },
    data: { retryCount },
  });
}
