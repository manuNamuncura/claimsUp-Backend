import { IsString, IsInt, IsOptional, IsEnum, IsArray } from 'class-validator';

export enum ClaimType {
  ERROR = 'error',
  FEATURE = 'feature',
  CONSULTA = 'consulta',
  INCIDENTE = 'incidente',
  MEJORA = 'mejora',
  OTRO = 'otro'
}

export enum Priority {
  ALTA = 'alta',
  MEDIA = 'media',
  BAJA = 'baja'
}

export enum Severity {
  CRITICA = 'critica',
  ALTA = 'alta',
  MEDIA = 'media',
  BAJA = 'baja'
}

export class CreateClaimDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsEnum(ClaimType)
  type: ClaimType;

  @IsEnum(Priority)
  priority: Priority;

  @IsEnum(Severity)
  severity: Severity;

  @IsString()  // Cambiado: IsInt → IsString
  clientId: string;

  @IsOptional()
  @IsString()  // Cambiado: IsInt → IsString
  projectId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[]; // URLs o paths de archivos
}