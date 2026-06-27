import { type LoggerService, Injectable, Logger } from '@nestjs/common';

/**
 * Bridges the Arcjet SDK's internal logger to the NestJS logger so Arcjet
 * output participates in the application's standard logging pipeline.
 */
@Injectable()
export class ArcjetLogger implements LoggerService {
  private readonly logger = new Logger(ArcjetLogger.name);

  log(message: any, ...optionalParams: any[]) {
    this.logger.log(message, ...optionalParams);
  }

  fatal(message: any, ...optionalParams: any[]) {
    this.logger.error(message, ...optionalParams);
  }

  error(message: any, ...optionalParams: any[]) {
    this.logger.error(message, ...optionalParams);
  }

  warn(message: any, ...optionalParams: any[]) {
    this.logger.warn(message, ...optionalParams);
  }

  debug(message: any, ...optionalParams: any[]) {
    this.logger.debug(message, ...optionalParams);
  }

  info(message: any, ...optionalParams: any[]) {
    this.logger.log(message, ...optionalParams);
  }
}
