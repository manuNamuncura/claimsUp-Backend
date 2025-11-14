import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateAreaDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}