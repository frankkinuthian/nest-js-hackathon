import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Required by @thallesp/nestjs-better-auth: Nest's built-in body parser is
    // disabled so Better Auth can read the raw request body. The library
    // re-adds JSON/urlencoded parsers for all non-auth routes.
    bodyParser: false,
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
