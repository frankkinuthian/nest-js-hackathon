import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  ArcjetModule,
  type ArcjetMode,
  fixedWindow,
  shield,
} from '@arcjet/nest';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ArcjetGuard } from './common/guards/arcjet.guard.js';
import { ArcjetLogger } from './lib/arcjet/arcjet-logger.js';
import { PrismaModule } from './lib/database/prisma.module.js';

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
