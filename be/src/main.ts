import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // 1. Enable CORS so your Angular frontend can talk to this API
  app.enableCors();

  // 2. Use the PORT provided by Cloud Run (default to 8080)
  const port = process.env.PORT || 8080;
  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
