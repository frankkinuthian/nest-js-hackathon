import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ARCJET, type ArcjetNest } from '@arcjet/nest';
import type { Request } from 'express';

/**
 * Global guard that runs Arcjet protection on every incoming request using the
 * root rules configured in `ArcjetModule` (Shield + rate limiting).
 *
 * Arcjet is designed to fail open, so transient errors are logged and the
 * request is allowed through rather than blocking all traffic.
 */
@Injectable()
export class ArcjetGuard implements CanActivate {
  private readonly logger = new Logger(ArcjetGuard.name);

  constructor(@Inject(ARCJET) private readonly arcjet: ArcjetNest) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const decision = await this.arcjet.protect(request);

    // Fail open: log any rule errors but don't block the request.
    for (const { reason } of decision.results) {
      if (reason.isError()) {
        this.logger.error(`Arcjet rule error: ${reason.message}`);
      }
    }

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        throw new HttpException(
          'Too many requests',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }

    return true;
  }
}
