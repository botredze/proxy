import dotenv from 'dotenv';

dotenv.config();

export const env = {
  dbUrl: process.env.DATABASE_URL,
  proxyDbUser: process.env.PROXY_DB_USER ,
  proxyDbPassword: process.env.PROXY_DB_PASSWORD,
};
