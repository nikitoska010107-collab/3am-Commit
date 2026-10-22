import 'reflect-metadata'
import { Logger, ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { NestFastifyApplication, FastifyAdapter } from '@nestjs/platform-fastify'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import { AppModule } from './app.module'
import { AppConfig } from './config/app-config'

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap')
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(), {
    logger: ['error', 'warn', 'log'],
  })

  const config = app.get(AppConfig)

  await app.register(cors, {
    origin: config.corsOrigins,
    credentials: true,
  })

  await app.register(multipart, {
    limits: { fileSize: 20 * 1024 * 1024, files: 10 },
  })

  app.setGlobalPrefix('api')
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  )

  const swaggerConfig = new DocumentBuilder()
    .setTitle('API умного кредитного кабинета предпринимателя')
    .setDescription(
      'Контракт кредитного конвейера: клиентский путь и кабинет банка. Данные синтетические.',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .build()

  const document = SwaggerModule.createDocument(app, swaggerConfig)
  SwaggerModule.setup('api/docs', app, document, {
    jsonDocumentUrl: 'api/docs/openapi.json',
  })

  await app.listen({ host: config.host, port: config.port })

  logger.log(`API запущено на http://${config.host}:${config.port}/api`)
  logger.log(`Swagger UI: http://${config.host}:${config.port}/api/docs`)
}

void bootstrap()
