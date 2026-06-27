// Ensure env vars are available at import time. This file builds the Better
// Auth instance during module evaluation — before Nest's ConfigModule loads
// env files — so DATABASE_URL / BETTER_AUTH_SECRET must be read directly here.
// Precedence matches AppModule: `.env.development.local` first, then `.env`.
import { config } from 'dotenv';
config({ path: '.env.development.local' });
config({ path: '.env' });

import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client.js';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    'DATABASE_URL must be set in the environment. See .env for the Prisma Postgres connection string.',
  );
}

// Dedicated, module-scoped Prisma client for Better Auth.
//
// This is the one sanctioned exception to the "no `new PrismaClient()`" rule:
// the @thallesp/nestjs-better-auth library requires a statically-built `auth`
// instance (AuthModule.forRoot({ auth })) that exists before Nest's DI
// container, so the request-scoped PrismaService cannot be injected here.
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  // Credential-based sign-up / sign-in. No social providers or email
  // verification yet (no mail service wired).
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      // Application role. `input: false` makes Better Auth reject `role` in the
      // sign-up / update-user payload, so it can only be changed server-side.
      // Defaults to PARTICIPANT for every new user.
      role: {
        type: 'string',
        required: false,
        defaultValue: 'PARTICIPANT',
        input: false,
      },
    },
  },
});
