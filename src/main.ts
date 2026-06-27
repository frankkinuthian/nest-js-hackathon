import { NestFactory, Reflector } from '@nestjs/core';
import {
  BadRequestException,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';
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
  });

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

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
