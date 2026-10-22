import { Controller, Delete, Get, Headers, Param, Post, Query, Req, Res } from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { FastifyReply, FastifyRequest } from 'fastify'
import { AppError } from '../../common/errors/app-error'
import { DocumentKind, UserRole } from '../../common/enums'
import { AuthenticatedUser, CurrentUser } from '../../common/decorators/current-user.decorator'
import { ApplicationsService } from '../applications/applications.service'
import { DocumentDto } from './dto/document.dto'
import { DocumentsService } from './documents.service'

const MAX_FILE_SIZE = 20 * 1024 * 1024

@ApiTags('documents')
@ApiBearerAuth()
@Controller()
export class DocumentsController {
  constructor(
    private readonly documents: DocumentsService,
    private readonly applications: ApplicationsService,
  ) {}

  @Post('applications/:id/documents')
  @ApiOperation({ summary: 'Загрузить документ к заявке' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        kind: { type: 'string', enum: Object.values(DocumentKind) },
      },
      required: ['file'],
    },
  })
  @ApiResponse({ status: 201, type: DocumentDto })
  async upload(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() request: FastifyRequest,
    @Query('kind') kind?: string,
  ): Promise<DocumentDto> {
    const application = await this.applications.getAccessible(user, id)

    const part = await request.file({ limits: { fileSize: MAX_FILE_SIZE } })
    if (!part) {
      throw AppError.badRequest('Файл не передан')
    }

    const buffer = await part.toBuffer()

    const documentKind = Object.values(DocumentKind).includes(kind as DocumentKind)
      ? (kind as DocumentKind)
      : DocumentKind.OTHER

    const saved = await this.documents.save(
      {
        filename: part.filename,
        mimeType: part.mimetype,
        buffer,
      },
      user.id,
      application.id,
      documentKind,
    )

    return this.toDto(saved)
  }

  @Get('applications/:id/documents')
  @ApiOperation({ summary: 'Документы заявки' })
  @ApiResponse({ status: 200, type: [DocumentDto] })
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<DocumentDto[]> {
    await this.applications.getAccessible(user, id)
    const documents = await this.documents.listByApplication(id)
    return documents.map((document) => this.toDto(document))
  }

  @Get('documents/:id')
  @ApiOperation({ summary: 'Скачать документ' })
  @ApiResponse({ status: 200, description: 'Файл документа' })
  async download(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Res() reply: FastifyReply,
    @Headers('accept') accept?: string,
  ): Promise<void> {
    const document = await this.documents.findById(id)

    if (user.role === UserRole.CLIENT && document.userId !== user.id) {
      throw AppError.forbidden('Нет доступа к документу')
    }

    const { stream, size } = await this.documents.readStream(id)

    reply.header('Content-Type', document.mimeType)
    reply.header('Content-Length', size)
    if (!accept?.includes('application/json')) {
      reply.header('Content-Disposition', `attachment; filename="${document.filename}"`)
    }
    await reply.send(stream)
  }

  @Delete('documents/:id')
  @ApiOperation({ summary: 'Удалить документ' })
  @ApiResponse({ status: 204, description: 'Документ удалён' })
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<{ deleted: boolean }> {
    const document = await this.documents.findById(id)

    if (user.role === UserRole.CLIENT && document.userId !== user.id) {
      throw AppError.forbidden('Нет доступа к документу')
    }

    await this.documents.remove(id)
    return { deleted: true }
  }

  private toDto(document: {
    id: string
    applicationId: string | null
    userId: string
    filename: string
    mimeType: string
    size: number
    kind: string
    checksum: string
    createdAt: string
  }): DocumentDto {
    return {
      id: document.id,
      applicationId: document.applicationId,
      userId: document.userId,
      filename: document.filename,
      kind: document.kind,
      mimeType: document.mimeType,
      size: document.size,
      checksum: document.checksum,
      createdAt: document.createdAt,
    }
  }
}
