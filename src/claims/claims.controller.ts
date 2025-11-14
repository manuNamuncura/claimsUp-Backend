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
  HttpStatus 
} from '@nestjs/common';
import { ClaimsService } from './claims.service';
import { CreateClaimDto } from './dto/create-claim.dto';
import { UpdateClaimDto } from './dto/update-claim.dto';

@Controller('claims')
export class ClaimsController {
  constructor(private readonly claimsService: ClaimsService) {}

  @Post()
  create(@Body() createClaimDto: CreateClaimDto) {
    // TODO: Obtener userId del token JWT una vez implementada la autenticación
    const userId = 'empleado-1'; // Temporal
    return this.claimsService.create(createClaimDto, userId);
  }

  @Post(':id/comment')
addComment(
  @Param('id') id: string,
  @Body() body: { comment: string; userId: string }
) {
  return this.claimsService.addComment(id, body.comment, body.userId);
}

@Post(':id/resolve')
resolveClaim(
  @Param('id') id: string,
  @Body() body: { userId: string; resolutionDetails?: string }
) {
  return this.claimsService.resolveClaim(id, body.userId, body.resolutionDetails);
}

@Post(':id/reopen')
reopenClaim(
  @Param('id') id: string,
  @Body() body: { userId: string; reason?: string }
) {
  return this.claimsService.reopenClaim(id, body.userId, body.reason);
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
  update(
    @Param('id') id: string, 
    @Body() updateClaimDto: UpdateClaimDto
  ) {
    const userId = 'empleado-1'; 
    return this.claimsService.update(id, updateClaimDto, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {  
    return this.claimsService.remove(id);
  }
}