// src/areas/areas.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  DefaultValuePipe,
  ParseBoolPipe,
} from '@nestjs/common';
import { AreasService } from './areas.service';
import { CreateAreaDto } from './dto/create-area.dto';
import { CreateSubAreaDto } from './dto/create-subarea.dto';
import { AssignClaimDto } from './dto/assign-claim.dto';

@Controller('areas')
export class AreasController {
  constructor(private readonly areasService: AreasService) {}

  // ===== ÁREAS =====

  @Post()
  createArea(@Body() createAreaDto: CreateAreaDto) {
    return this.areasService.createArea(createAreaDto);
  }

  @Get()
  findAllAreas(
    @Query('includeSubAreas', new DefaultValuePipe(false), ParseBoolPipe)
    includeSubAreas: boolean,
  ) {
    return this.areasService.findAllAreas(includeSubAreas);
  }

  @Get(':id')
  findAreaById(@Param('id') id: string) {
    return this.areasService.findAreaById(id);
  }

  // ===== SUBÁREAS =====
  // IMPORTANTE: esta ruta coincide con lo que usa el frontend
  // GET /areas/:id/sub-areas
  @Get(':id/sub-areas')
  findSubAreasByArea(@Param('id') id: string) {
    return this.areasService.findSubAreasByArea(id);
  }

  @Post('subareas')
  createSubArea(@Body() createSubAreaDto: CreateSubAreaDto) {
    return this.areasService.createSubArea(createSubAreaDto);
  }

  // ===== ASIGNACIONES =====

  @Post('assign')
  assignClaimToArea(@Body() assignClaimDto: AssignClaimDto) {
    return this.areasService.assignClaimToArea(assignClaimDto);
  }

  @Get('assignments/claim/:claimId')
  getCurrentAssignment(@Param('claimId') claimId: string) {
    return this.areasService.getCurrentAssignment(claimId);
  }

  @Get('assignments/claim/:claimId/history')
  getAssignmentHistory(@Param('claimId') claimId: string) {
    return this.areasService.getAssignmentHistory(claimId);
  }

  @Get('assignments/area/:areaId')
  getClaimsByArea(
    @Param('areaId') areaId: string,
    @Query('includeSubAreas', new DefaultValuePipe(false), ParseBoolPipe)
    includeSubAreas: boolean,
  ) {
    return this.areasService.getClaimsByArea(areaId, includeSubAreas);
  }

  // ===== ESTADÍSTICAS =====

  @Get('stats/assignments')
  getAreaAssignmentStats() {
    return this.areasService.getAreaAssignmentStats();
  }

  // ===== REASIGNACIONES / DESASIGNACIONES =====

  @Post('reassign-subarea')
  reassignToSubArea(
    @Body()
    body: {
      claimId: string;
      subAreaId: string;
      assignedBy: string;
      notes?: string;
    },
  ) {
    return this.areasService.reassignToSubArea(
      body.claimId,
      body.subAreaId,
      body.assignedBy,
      body.notes,
    );
  }

  @Post('unassign')
  unassignClaim(
    @Body()
    body: {
      claimId: string;
      unassignedBy: string;
      reason?: string;
    },
  ) {
    return this.areasService.unassignClaim(
      body.claimId,
      body.unassignedBy,
      body.reason,
    );
  }
}
