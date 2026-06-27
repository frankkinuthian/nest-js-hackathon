import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ResponseInterceptor } from './common/interceptors/response.interceptor.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Required by @thallesp/nestjs-better-auth: Nest's built-in body parser is
    // disabled so Better Auth can read the raw request body. The library
    // re-adds JSON/urlencoded parsers for all non-auth routes.
    bodyParser: false,
  });

  app.useGlobalInterceptors(new ResponseInterceptor(app.get(Reflector)));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
