import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateSubAreaDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  areaId: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}