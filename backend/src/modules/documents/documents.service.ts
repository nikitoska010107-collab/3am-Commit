import { Injectable, Logger } from '@nestjs/common'
import { createHash, randomUUID } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { mkdir, stat, unlink, writeFile } from 'node:fs/promises'
import { dirname, extname, join, resolve } from 'node:path'
import { AppError } from '../../common/errors/app-error'
import { DocumentKind } from '../../common/enums'
import { PrismaService } from '../../prisma/prisma.service'

export interface StoredFile {
  filename: string
  mimeType: string
  buffer: Buffer
}

export interface DocumentRecord {
  id: string
  applicationId: string | null
  userId: string
  filename: string
  storedName: string
  mimeType: string
  size: number
  kind: string
  storagePath: string
  checksum: string
  createdAt: string
}

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name)
  private readonly storageRoot: string

  constructor(private readonly prisma: PrismaService) {
    this.storageRoot = resolve(
      process.env.DOCUMENT_STORAGE_PATH ?? join(process.cwd(), 'storage', 'documents'),
    )
  }

  get root(): string {
    return this.storageRoot
  }

  async save(
    file: StoredFile,
    userId: string,
    applicationId: string | null,
    kind: DocumentKind,
  ): Promise<DocumentRecord> {
    const extension = extname(file.filename).toLowerCase()
    const storedName = `${randomUUID()}${extension}`
    const targetPath = join(this.storageRoot, storedName)

    await mkdir(dirname(targetPath), { recursive: true })
    await writeFile(targetPath, file.buffer)

    const checksum = createHash('sha256').update(file.buffer).digest('hex')

    const document = await this.prisma.document.create({
      data: {
        userId,
        applicationId,
        filename: file.filename,
        storedName,
        mimeType: file.mimeType,
        size: file.buffer.length,
        kind,
        storagePath: targetPath,
        checksum,
      },
    })

    this.logger.log(`Документ ${document.id} сохранён в ${this.storageRoot}`)

    return this.toRecord(document)
  }

  async listByApplication(applicationId: string): Promise<DocumentRecord[]> {
    const documents = await this.prisma.document.findMany({
      where: { applicationId },
      orderBy: { createdAt: 'desc' },
    })
    return documents.map((document) => this.toRecord(document))
  }

  async listByUser(userId: string): Promise<DocumentRecord[]> {
    const documents = await this.prisma.document.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
    return documents.map((document) => this.toRecord(document))
  }

  async findById(id: string): Promise<DocumentRecord> {
    const document = await this.prisma.document.findUnique({ where: { id } })
    if (!document) {
      throw AppError.notFound('Документ не найден')
    }
    return this.toRecord(document)
  }

  async readStream(id: string) {
    const document = await this.findById(id)
    const fileStat = await stat(document.storagePath).catch(() => null)
    if (!fileStat) {
      throw AppError.notFound('Файл документа не найден на диске')
    }
    return {
      document,
      stream: createReadStream(document.storagePath),
      size: fileStat.size,
    }
  }

  async remove(id: string): Promise<void> {
    const document = await this.prisma.document.findUnique({ where: { id } })
    if (!document) {
      throw AppError.notFound('Документ не найден')
    }
    await this.prisma.document.delete({ where: { id } })
    await unlink(document.storagePath).catch(() => undefined)
    this.logger.log(`Документ ${id} удалён`)
  }

  private toRecord(document: {
    id: string
    applicationId: string | null
    userId: string
    filename: string
    storedName: string
    mimeType: string
    size: number
    kind: string
    storagePath: string
    checksum: string
    createdAt: Date
  }): DocumentRecord {
    return {
      id: document.id,
      applicationId: document.applicationId,
      userId: document.userId,
      filename: document.filename,
      storedName: document.storedName,
      mimeType: document.mimeType,
      size: document.size,
      kind: document.kind,
      storagePath: document.storagePath,
      checksum: document.checksum,
      createdAt: document.createdAt.toISOString(),
    }
  }
}
