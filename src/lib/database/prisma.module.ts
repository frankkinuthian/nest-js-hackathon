import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

/**
 * Global infrastructure module exposing a singleton PrismaService.
 *
 * Marked @Global() and imported once in AppModule so any feature module can
 * inject PrismaService via the constructor without re-importing this module.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
