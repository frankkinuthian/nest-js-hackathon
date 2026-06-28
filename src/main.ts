import { NestFactory, Reflector } from '@nestjs/core';
import {
  BadRequestException,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module.js';
import { ResponseInterceptor } from './common/interceptors/response.interceptor.js';

function formatErrors(errors: ValidationError[]) {
  return errors.flatMap((error) => {
    if (error.children?.length) {
      return formatErrors(error.children);
    }
    return {
      property: error.property,
      message: Object.values(error.constraints ?? {})[0],
    };
  });
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Required by @thallesp/nestjs-better-auth: Nest's built-in body parser is
    // disabled so Better Auth can read the raw request body. The library
    // re-adds JSON/urlencoded parsers for all non-auth routes.
    bodyParser: false,
    // Buffer logs until Pino logger is attached below.
    bufferLogs: true,
  });

  // Replace NestJS's default logger with Pino.
  app.useLogger(app.get(Logger));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: (errors: ValidationError[]) => {
        return new BadRequestException(formatErrors(errors));
      },
    }),
  );

  app.useGlobalInterceptors(new ResponseInterceptor(app.get(Reflector)));

  const config = new DocumentBuilder()
    .setTitle('Hackathon API')
    .setDescription('Hackathon platform REST API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
