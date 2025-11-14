import { IsString, IsEnum, IsNotEmpty } from 'class-validator';
import { ProjectType } from '@prisma/client';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(ProjectType)
  type: ProjectType;

  @IsString()
  @IsNotEmpty()
  clientId: string;  // Cambiado: number → string
}