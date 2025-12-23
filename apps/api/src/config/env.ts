import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string(),
  ENCRYPTION_KEY_32B: z.string().length(32),
  BASE_URL: z.string().url().optional(),
  WEBHOOK_BASE_URL: z.string().url().optional(),
  REDIS_URL: z.string().optional(),
  DEFAULT_BOT_TOKEN: z.string().optional(),
  ADMIN_SEED_EMAIL: z.string().email().optional(),
  ADMIN_SEED_PASSWORD: z.string().optional()
});

export const env = envSchema.parse(process.env);
