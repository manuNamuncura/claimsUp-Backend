import { IsString, IsOptional, IsBoolean, IsMongoId } from 'class-validator';

export class AssignClaimDto {
  @IsMongoId()
  claimId: string;

  @IsMongoId()
  areaId: string;

  @IsOptional()
  @IsMongoId()
  subAreaId?: string;

  @IsString()
  assignedBy: string;

  @IsOptional()
  @IsString()
  notes?: string;
}