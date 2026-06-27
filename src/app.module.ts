import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  ArcjetModule,
  type ArcjetMode,
  fixedWindow,
  shield,
} from '@arcjet/nest';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ArcjetGuard } from './common/guards/arcjet.guard.js';
import { ArcjetLogger } from './lib/arcjet/arcjet-logger.js';
import { PrismaModule } from './lib/database/prisma.module.js';
import { UserModule } from './module/user/user.module.js';
import { auth } from './lib/auth/auth.js';
import { HackathonModule } from './module/hackathon/hackathon.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // `.env.development.local` holds app secrets (ARCJET_KEY); `.env` holds
      // the Prisma Postgres DATABASE_URL. Earlier files take precedence.
      envFilePath: ['.env.development.local', '.env'],
      validate(config) {
        if (typeof config.ARCJET_KEY !== 'string' || config.ARCJET_KEY === '') {
          throw new Error(
            'ARCJET_KEY must be set in the environment. Get your key at https://app.arcjet.com',
          );
        }
        if (
          typeof config.BETTER_AUTH_SECRET !== 'string' ||
          config.BETTER_AUTH_SECRET === ''
        ) {
          throw new Error(
            'BETTER_AUTH_SECRET must be set in the environment. Generate one with `openssl rand -base64 32`.',
          );
        }
        return config;
      },
    }),
    ArcjetModule.forRootAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        // Toggle LIVE vs DRY_RUN enforcement via the ARCJET_MODE env var.
        const mode: ArcjetMode =
          configService.get('ARCJET_MODE') === 'LIVE' ? 'LIVE' : 'DRY_RUN';

        return {
          key: configService.get<string>('ARCJET_KEY')!,
          // Rules here apply to every request via the global ArcjetGuard.
          rules: [
            // Shield WAF — protects against SQL injection, XSS, and other
            // common attacks.
            shield({ mode }),
            // Rate limiting — fixed window of 10 requests per 60s,
            // tracked per client IP by default.
            fixedWindow({
              mode,
              window: '60s',
              max: 10,
            }),
          ],
          // Route Arcjet's internal logs through the NestJS logger.
          log: new ArcjetLogger(),
        };
      },
    }),
    PrismaModule,
    UserModule,
    // Better Auth integration. Registers a global AuthGuard (routes are
    // protected by default; opt out with @AllowAnonymous / @OptionalAuth) and
    // mounts the auth controllers under /api/auth.
    AuthModule.forRoot({ auth }),
    HackathonModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ArcjetGuard,
    },
  ],
})
export class AppModule {}
