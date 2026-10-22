import { NestFactory } from '@nestjs/core'
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { dump } from 'js-yaml'
import { AppModule } from '../src/app.module'

async function exportOpenApi(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(), {
    preview: true,
    logger: false,
  })

  const config = new DocumentBuilder()
    .setTitle('API умного кредитного кабинета предпринимателя')
    .setDescription(
      'Контракт кредитного конвейера: клиентский путь и кабинет банка. Все данные синтетические, внешние источники — моки.',
    )
    .setVersion('1.0.0')
    .addServer('http://localhost:3000', 'Локальный стенд')
    .addBearerAuth()
    .build()

  app.setGlobalPrefix('api')
  const document = SwaggerModule.createDocument(app, config)
  const root = resolve(process.cwd(), '..')

  writeFileSync(resolve(root, 'openapi.json'), `${JSON.stringify(document, null, 2)}\n`, 'utf8')
  writeFileSync(
    resolve(root, 'openapi.yaml'),
    dump(document, { lineWidth: 120, noRefs: true }),
    'utf8',
  )

  await app.close()

  console.info('Контракт выгружен: openapi.json, openapi.yaml')
}

exportOpenApi().catch((error: unknown) => {
  console.error('Не удалось выгрузить контракт:', error)
  process.exitCode = 1
})
