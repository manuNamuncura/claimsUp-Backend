import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query,
  HttpCode,
  HttpStatus,
  ParseBoolPipe,
  DefaultValuePipe
} from '@nestjs/common';
import { AreasService } from './areas.service';
import { CreateAreaDto } from './dto/create-area.dto';
import { CreateSubAreaDto } from './dto/create-subarea.dto';
import { AssignClaimDto } from './dto/assign-claim.dto';

@Controller('areas')
export class AreasController {
  constructor(private readonly areasService: AreasService) {}

  // ===== ENDPOINTS DE ÁREAS =====

  @Post()
  createArea(@Body() createAreaDto: CreateAreaDto) {
    return this.areasService.createArea(createAreaDto);
  }

  @Get()
  findAllAreas(
    @Query('includeSubAreas', new DefaultValuePipe(false), ParseBoolPipe) includeSubAreas: boolean
  ) {
    return this.areasService.findAllAreas(includeSubAreas);
  }

  @Get(':id')
  findAreaById(@Param('id') id: string) {
    return this.areasService.findAreaById(id);
  }

  // ===== ENDPOINTS DE SUB-ÁREAS =====

  @Post('subareas')
  createSubArea(@Body() createSubAreaDto: CreateSubAreaDto) {
    return this.areasService.createSubArea(createSubAreaDto);
  }

  @Get('subareas/area/:areaId')
  findSubAreasByArea(@Param('areaId') areaId: string) {
    return this.areasService.findSubAreasByArea(areaId);
  }

  // ===== ENDPOINTS DE ASIGNACIÓN =====

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
    @Query('includeSubAreas', new DefaultValuePipe(false), ParseBoolPipe) includeSubAreas: boolean
  ) {
    return this.areasService.getClaimsByArea(areaId, includeSubAreas);
  }

  // ===== ENDPOINTS DE ESTADÍSTICAS =====

  @Get('stats/assignments')
  async getAssignmentStats() {
    // Obtener estadísticas de asignaciones por área
    const areas = await this.areasService.findAllAreas(true);
    
    const stats = await Promise.all(
      areas.map(async (area) => {
        const currentAssignments = await this.areasService.getClaimsByArea(area.id, true);
        
        return {
          area: {
            id: area.id,
            name: area.name,
          },
          totalAssignments: currentAssignments.length,
          subAreas: area.subAreas.map(subArea => ({
            id: subArea.id,
            name: subArea.name,
            assignmentCount: currentAssignments.filter(a => a.subAreaId === subArea.id).length,
          })),
        };
      })
    );

    return stats;
  }

  // ===== NUEVOS ENDPOINTS =====
  @Post('reassign-subarea')
reassignToSubArea(@Body() body: {
  claimId: string;
  subAreaId: string;
  assignedBy: string;
  notes?: string;
}) {
  return this.areasService.reassignToSubArea(
    body.claimId, 
    body.subAreaId, 
    body.assignedBy, 
    body.notes
  );
}

@Post('unassign')
unassignClaim(@Body() body: {
  claimId: string;
  unassignedBy: string;
  reason?: string;
}) {
  return this.areasService.unassignClaim(
    body.claimId, 
    body.unassignedBy, 
    body.reason
  );
}

@Get('stats/assignments')
getAreaAssignmentStats() {
  return this.areasService.getAreaAssignmentStats();
}
}