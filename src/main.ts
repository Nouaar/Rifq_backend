import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder, OpenAPIObject } from '@nestjs/swagger';
import { ValidationPipe, Logger } from '@nestjs/common';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // Step 1: Build Swagger configuration
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Rifq Backend API')
    .setDescription('API documentation for Rifq backend')
    .setVersion('1.0')
    .addBearerAuth()
    .build() as OpenAPIObject;

  const swaggerDocument: OpenAPIObject = SwaggerModule.createDocument(
    app,
    swaggerConfig,
  );

  // Step 3: Setup Swagger
  SwaggerModule.setup('api', app, swaggerDocument);

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);

  Logger.log(`Server running on http://localhost:${port}`);
}

bootstrap().catch((err: unknown) => {
  if (err instanceof Error) {
    Logger.error('Error starting server', err.message, err.stack);
  } else {
    Logger.error('Unknown error starting server', JSON.stringify(err));
  }
});
