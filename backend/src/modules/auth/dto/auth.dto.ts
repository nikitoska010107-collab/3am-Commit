import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsEmail,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator'
import { LEGAL_FORMS, UserRole } from '../../../common/enums'

export class CompanyInputDto {
  @ApiProperty({ example: 'ООО «Восход»' })
  @IsString()
  @MinLength(2)
  name: string

  @ApiProperty({ example: '7701234567' })
  @IsString()
  @MinLength(10)
  inn: string

  @ApiPropertyOptional({ example: '1107746000012' })
  @IsOptional()
  @IsString()
  ogrn?: string

  @ApiProperty({ example: 'ООО', enum: LEGAL_FORMS })
  @IsIn(LEGAL_FORMS)
  legalForm: string

  @ApiProperty({ example: 'Строительство' })
  @IsString()
  @MinLength(2)
  industry: string

  @ApiProperty({ example: 8500000 })
  @IsInt()
  @Min(0)
  revenue: number

  @ApiProperty({ example: '2019-04-12T00:00:00.000Z' })
  @IsISO8601()
  foundedAt: string
}

export class RegisterDto {
  @ApiProperty({ example: 'anna@demo.local' })
  @IsEmail()
  email: string

  @ApiProperty({ example: 'demo', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string

  @ApiProperty({ example: 'Анна Смирнова' })
  @IsString()
  @MinLength(2)
  name: string

  @ApiProperty({ type: CompanyInputDto })
  company: CompanyInputDto
}

export class LoginDto {
  @ApiProperty({ example: 'client.approve@demo.local' })
  @IsEmail()
  email: string

  @ApiProperty({ example: 'demo' })
  @IsString()
  @MinLength(1)
  password: string
}

export class CompanyResponseDto {
  @ApiProperty() id: string
  @ApiProperty() inn: string
  @ApiProperty() name: string
  @ApiProperty() legalForm: string
  @ApiProperty() industry: string
  @ApiProperty() revenue: number
  @ApiProperty() foundedAt: string
  @ApiProperty() status: string
}

export class UserResponseDto {
  @ApiProperty() id: string
  @ApiProperty() email: string
  @ApiProperty() name: string
  @ApiProperty({ enum: UserRole }) role: string
  @ApiProperty({ type: CompanyResponseDto, nullable: true })
  company: CompanyResponseDto | null
}

export class AuthResponseDto {
  @ApiProperty() accessToken: string
  @ApiProperty({ example: 'Bearer' }) tokenType: string
  @ApiProperty({ example: 86400 }) expiresIn: number
  @ApiProperty({ type: UserResponseDto }) user: UserResponseDto
}
