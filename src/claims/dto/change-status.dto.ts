import { ClaimStatus } from "@prisma/client";
import { IsEnum, IsOptional, IsString } from "class-validator";

export class ChangeStatusDto {
    @IsEnum(ClaimStatus)
    newStatus: ClaimStatus;

    @IsOptional()
    @IsString()
    reason?: string;

    @IsOptional()
    @IsString()
    closureNotes?: string;

    @IsOptional()
    @IsString()
    internalNotes?: string;
}