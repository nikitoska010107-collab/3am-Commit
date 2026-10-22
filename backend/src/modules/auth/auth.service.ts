import { Injectable, Logger } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { User } from '@prisma/client'
import * as bcrypt from 'bcryptjs'
import { AppError } from '../../common/errors/app-error'
import { UserRole } from '../../common/enums'
import { AppConfig } from '../../config/app-config'
import { PrismaService } from '../../prisma/prisma.service'
import { AuthResponseDto, LoginDto, RegisterDto, UserResponseDto } from './dto/auth.dto'

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: AppConfig,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const email = dto.email.trim().toLowerCase()
    const existing = await this.prisma.user.findUnique({ where: { email } })
    if (existing) {
      throw AppError.conflict('Пользователь с таким e-mail уже зарегистрирован', { email })
    }

    const company = await this.prisma.company.create({
      data: {
        inn: dto.company.inn.trim(),
        ogrn: dto.company.ogrn?.trim(),
        name: dto.company.name.trim(),
        legalForm: dto.company.legalForm,
        industry: dto.company.industry.trim(),
        revenue: dto.company.revenue,
        foundedAt: new Date(dto.company.foundedAt),
      },
    })

    const passwordHash = await bcrypt.hash(dto.password, 10)
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        name: dto.name.trim(),
        role: UserRole.CLIENT,
        companyId: company.id,
      },
      include: { company: true },
    })

    this.logger.log(`Зарегистрирован клиент ${user.email}`)
    return this.buildResponse(user)
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const email = dto.email.trim().toLowerCase()
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { company: true },
    })

    if (!user) {
      throw AppError.unauthorized('Неверный e-mail или пароль')
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash)
    if (!passwordMatches) {
      throw AppError.unauthorized('Неверный e-mail или пароль')
    }

    return this.buildResponse(user)
  }

  async getProfile(userId: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { company: true },
    })
    if (!user) {
      throw AppError.notFound('Пользователь не найден')
    }
    return this.toUserResponse(user)
  }

  private async buildResponse(user: User & { company: unknown }): Promise<AuthResponseDto> {
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      companyId: user.companyId,
    })

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: this.config.jwtExpiresInSeconds,
      user: this.toUserResponse(user as never),
    }
  }

  private toUserResponse(user: User & { company?: unknown }): UserResponseDto {
    const company = user.company as {
      id: string
      inn: string
      name: string
      legalForm: string
      industry: string
      revenue: number
      foundedAt: Date
      status: string
    } | null

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      company: company
        ? {
            id: company.id,
            inn: company.inn,
            name: company.name,
            legalForm: company.legalForm,
            industry: company.industry,
            revenue: company.revenue,
            foundedAt: company.foundedAt.toISOString(),
            status: company.status,
          }
        : null,
    }
  }
}
