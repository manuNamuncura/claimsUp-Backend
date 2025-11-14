import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class AssignClaimDto {
  @IsString()
  claimId: string;

  @IsString()
  areaId: string;

  @IsOptional()
  @IsString()
  subAreaId?: string;

  @IsString()
  assignedBy: string;

  @IsOptional()
  @IsString()
  notes?: string;
}