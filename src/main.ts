// main.ts
import * as dotenv from 'dotenv';
dotenv.config({ path: `.env.${process.env.NODE_ENV || 'development'}` });

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,            // Elimina propiedades no declaradas en el DTO
      forbidNonWhitelisted: true, // Si llega una propiedad extra, lanza 400 con nombre exacto
      transform: true,            // Convierte tipos automáticamente (ej: "27015" → 27015)
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('CS2 Dedicated Server API')
    .setDescription('Backend para gestión de servidores dedicados de CS2 con MatchZy Enhanced')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'matchzy-webhook-token', // Nombre del esquema, se referencia en los decoradores
    )
    .addTag('rcon', 'Ejecución de comandos RCON en el servidor CS2')
    .addTag('lifecycle', 'Gestión del ciclo de vida de partidos y eventos de MatchZy')
    .addTag('admin', 'Gestión de administradores del servidor')
    .addTag('demos', 'Archivos demos de los mapas jugados en las distintas series.')
    .addTag('stats', 'Estadísticas de mapas y series generadas por MatchZy')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();