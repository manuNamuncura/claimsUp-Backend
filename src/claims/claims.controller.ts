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
} from '@nestjs/common';
import { ClaimsService } from './claims.service';
import { CreateClaimDto } from './dto/create-claim.dto';
import { UpdateClaimDto } from './dto/update-claim.dto';
import { ChangeStatusDto } from './dto/change-status.dto';

@Controller('claims')
export class ClaimsController {
  constructor(private readonly claimsService: ClaimsService) {}

  @Post()
  create(@Body() createClaimDto: CreateClaimDto) {
    // TODO: Obtener userId del token JWT una vez implementada la autenticación
    // Temporal
    //const userId = 'empleado-1'; 
    return this.claimsService.create(createClaimDto);
  }

  @Post(':id/comment')
  addComment(
    @Param('id') id: string,
    @Body() body: { comment: string; userId: string },
  ) {
    return this.claimsService.addComment(id, body.comment, body.userId);
  }

  @Get()
  findAll() {
    return this.claimsService.findAll();
  }

  @Get('client/:clientId')
  findByClient(@Param('clientId') clientId: string) {
    return this.claimsService.getClaimsByClient(clientId);
  }

  @Get('project/:projectId')
  findByProject(@Param('projectId') projectId: string) {
    return this.claimsService.getClaimsByProject(projectId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.claimsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateClaimDto: UpdateClaimDto) {
    const userId = 'empleado-1';
    return this.claimsService.update(id, updateClaimDto, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.claimsService.remove(id);
  }

  // Cambiar estado de un reclamo
  @Post(':id/status')
  changeStatus(
    @Param('id') id: string,
    @Body() changeStatusDto: ChangeStatusDto,
  ) {
    const userId = 'usuario-actual'; // TODO: Obtener del JWT
    return this.claimsService.changeStatus(id, changeStatusDto, userId);
  }

  // Validar si una accion es permitida en el reclamo
  @Get(':id/validate-action/:action')
  validateAction(@Param('id') id: string, @Param('action') action: string) {
    return this.claimsService.validateAction(id, action);
  }

  // Obtener transiciones posibles para el reclamo
  @Get(':id/transitions')
  getAvailableTransitions(@Param('id') id: string) {
    return this.claimsService.getAvailableTransitions(id);
  }

  // Resolver reclamo (shortcut para estado RESUELTO)
  @Post(':id/resolve')
  resolveClaim(
    @Param('id') id: string,
    @Body() body: { resolutionDetails: string; internalNotes?: string },
  ) {
    const userId = 'usuario-actual'; // TODO: Obtener del JWT
    return this.claimsService.changeStatus(
      id,
      {
        newStatus: 'RESUELTO',
        reason: body.resolutionDetails,
        internalNotes: body.internalNotes,
      },
      userId,
    );
  }

  // Cerrar reclamo (shortcut para estado CERRADO)
  @Post(':id/close')
  closeClaim(
    @Param('id') id: string,
    @Body() body: { closureNotes: string }
  ) {
    const userId = 'usuario-actual'; // TODO: Obtener del JWT
    return this.claimsService.changeStatus(id, {
      newStatus: 'CERRADO',
      closureNotes: body.closureNotes,
    }, userId);
  }


  @Post(':id/reopen')
  reopenClaim(
    @Param('id') id: string,
    @Body() body: { reason: string; targetStatus?: 'ABIERTO' | 'EN_PROCESO' }
  ) {
    const userId = 'usuario-actual'; // TODO: Obtener del JWT
    return this.claimsService.changeStatus(id, {
      newStatus: body.targetStatus || 'ABIERTO',
      reason: body.reason,
    }, userId);
  }
}
