import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, ActionType, ClaimStatus } from '@prisma/client';
import { TracingService } from '../tracing/tracing.service';
import { CreateClaimDto } from './dto/create-claim.dto';
import { UpdateClaimDto } from './dto/update-claim.dto';
import { StatusService } from 'src/status/status.service';
import { ChangeStatusDto } from './dto/change-status.dto';

@Injectable()
export class ClaimsService {
  constructor(
    private prisma: PrismaService, 
    @Inject(TracingService) private tracingService: TracingService,
    @Inject(StatusService) private statusService: StatusService,
  ) {}

  async create(createClaimDto: CreateClaimDto, userId: string = 'system') {
    // Validar clientId
    if (!this.isValidObjectId(createClaimDto.clientId)) {
      throw new BadRequestException('ID de cliente no válido');
    }

    // Verificar que el cliente existe
    const client = await this.prisma.client.findUnique({
      where: { id: createClaimDto.clientId },
    });

    if (!client) {
      throw new NotFoundException(`Cliente con ID ${createClaimDto.clientId} no encontrado`);
    }

    // Verificar que el proyecto existe si se proporciona
    if (createClaimDto.projectId) {
      if (!this.isValidObjectId(createClaimDto.projectId)) {
        throw new BadRequestException('ID de proyecto no válido');
      }

      const project = await this.prisma.project.findUnique({
        where: { id: createClaimDto.projectId },
      });

      if (!project) {
        throw new NotFoundException(`Proyecto con ID ${createClaimDto.projectId} no encontrado`);
      }

      // Verificar que el proyecto pertenece al cliente
      if (project.clientId !== createClaimDto.clientId) {
        throw new BadRequestException('El proyecto no pertenece al cliente especificado');
      }
    }

    // Crear el reclamo
    const claim = await this.prisma.claim.create({
      data: {
        title: createClaimDto.title,
        description: createClaimDto.description,
        type: createClaimDto.type,
        priority: createClaimDto.priority,
        severity: createClaimDto.severity,
        status: 'ABIERTO',
        clientId: createClaimDto.clientId,
        projectId: createClaimDto.projectId,
        // Crear historial automáticamente
        claimHistory: {
          create: {
            actionType: 'creado',
            actionLabel: `Reclamo creado por ${userId}`,
            user: userId,
            details: 'Reclamo creado inicialmente',
          },
        },
        // Crear attachments si existen
        attachments: createClaimDto.attachments ? {
          create: createClaimDto.attachments.map(filename => ({
            filename,
            path: `/uploads/claims/${filename}`,
            mimetype: this.getMimeType(filename),
            size: 0,
          })),
        } : undefined,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        attachments: true,
        claimHistory: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    // REGISTRAR EVENTO DE TRAZABILIDAD - CREACIÓN
    await this.tracingService.recordEvent({
      claimId: claim.id,
      actionType: ActionType.CREADO,
      user: userId,
      details: 'Reclamo creado inicialmente',
      metadata: {
        clientId: createClaimDto.clientId,
        projectId: createClaimDto.projectId,
        type: createClaimDto.type,
        priority: createClaimDto.priority,
        severity: createClaimDto.severity,
      },
    });

    return claim;
  }

  async findAll() {
    return this.prisma.claim.findMany({
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        attachments: true,
        _count: {
          select: {
            claimHistory: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    // Validar ObjectId
    if (!this.isValidObjectId(id)) {
      throw new BadRequestException('ID de reclamo no válido');
    }

    const claim = await this.prisma.claim.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            contact: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        attachments: true,
        claimHistory: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!claim) {
      throw new NotFoundException(`Reclamo con ID ${id} no encontrado`);
    }

    return claim;
  }

  async update(
  id: string,
  updateClaimDto: UpdateClaimDto,
  userId: string = 'system',
) {
  if (!this.isValidObjectId(id)) {
    throw new BadRequestException('ID de reclamo no válido');
  }

  const currentClaim = await this.findOne(id);

  const {
    clientId,
    projectId,
    status,
    priority,
    severity,
    ...rest
  } = updateClaimDto as any;

  const data: any = {
    ...rest,

    ...(status ? { status } : {}),
    ...(priority ? { priority } : {}),
    ...(severity ? { severity } : {}),

    ...(clientId
      ? { client: { connect: { id: clientId } } }
      : {}),

    ...(projectId
      ? { project: { connect: { id: projectId } } }
      : {}),
  };

  const updatedClaim = await this.prisma.claim.update({
    where: { id },
    data,
    include: {
      client: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      project: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
    },
  });

  const events: Array<{
    claimId: string;
    actionType: ActionType;
    user: string;
    oldValue?: string;
    newValue?: string;
    details?: string;
    metadata?: Record<string, any>;
  }> = [];

  if (status && status !== currentClaim.status) {
    events.push({
      claimId: id,
      actionType: ActionType.ESTADO_CAMBIADO,
      user: userId,
      oldValue: currentClaim.status,
      newValue: status,
      details: `Estado cambiado de "${currentClaim.status}" a "${status}"`,
    });
  }

  if (priority && priority !== currentClaim.priority) {
    events.push({
      claimId: id,
      actionType: ActionType.PRIORIDAD_CAMBIADA,
      user: userId,
      oldValue: currentClaim.priority,
      newValue: priority,
      details: `Prioridad cambiada de "${currentClaim.priority}" a "${priority}"`,
    });
  }

  if (severity && severity !== currentClaim.severity) {
    events.push({
      claimId: id,
      actionType: ActionType.CRITICIDAD_CAMBIADA,
      user: userId,
      oldValue: currentClaim.severity,
      newValue: severity,
      details: `Criticidad cambiada de "${currentClaim.severity}" a "${severity}"`,
    });
  }

  for (const event of events) {
    await this.tracingService.recordEvent(event);
  }

  if (events.length === 0 && Object.keys(updateClaimDto).length > 0) {
    await this.tracingService.recordEvent({
      claimId: id,
      actionType: ActionType.COMENTADO, // o CREADO / ASIGNADO según tu dominio
      user: userId,
      details: 'Reclamo actualizado',
      metadata: {
        updatedFields: Object.keys(updateClaimDto),
      },
    });
  }

  return updatedClaim;
}

  async remove(id: string) {
    // Validar ObjectId
    if (!this.isValidObjectId(id)) {
      throw new BadRequestException('ID de reclamo no válido');
    }

    const claim = await this.findOne(id);

    // REGISTRAR EVENTO DE ELIMINACIÓN
    await this.tracingService.recordEvent({
      claimId: id,
      actionType: ActionType.CERRADO,
      user: 'system',
      details: `Reclamo eliminado: ${claim.title}`,
      metadata: {
        title: claim.title,
        clientId: claim.clientId,
        projectId: claim.projectId,
      },
    });

    return this.prisma.claim.delete({
      where: { id },
    });
  }

  async getClaimsByClient(clientId: string) {
    // Validar ObjectId
    if (!this.isValidObjectId(clientId)) {
      throw new BadRequestException('ID de cliente no válido');
    }

    return this.prisma.claim.findMany({
      where: { clientId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        attachments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getClaimsByProject(projectId: string) {
    // Validar ObjectId
    if (!this.isValidObjectId(projectId)) {
      throw new BadRequestException('ID de proyecto no válido');
    }

    return this.prisma.claim.findMany({
      where: { projectId },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        attachments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Método para agregar comentarios (para futura HU10)
  async addComment(claimId: string, comment: string, userId: string) {
    if (!this.isValidObjectId(claimId)) {
      throw new BadRequestException('ID de reclamo no válido');
    }

    const claim = await this.findOne(claimId);

    // REGISTRAR EVENTO DE COMENTARIO
    await this.tracingService.recordEvent({
      claimId,
      actionType: ActionType.COMENTADO,
      user: userId,
      details: comment,
      metadata: {
        commentLength: comment.length,
      },
    });

    // También crear en el historial tradicional (para backward compatibility)
    await this.prisma.claimHistory.create({
      data: {
        claimId,
        actionType: 'comentado',
        actionLabel: `Comentario agregado por ${userId}`,
        user: userId,
        details: comment,
      },
    });

    return { success: true, message: 'Comentario agregado' };
  }

  // Método para adjuntar archivos (trazabilidad mejorada)
  async addAttachment(claimId: string, filename: string, userId: string) {
    if (!this.isValidObjectId(claimId)) {
      throw new BadRequestException('ID de reclamo no válido');
    }

    const claim = await this.findOne(claimId);

    const attachment = await this.prisma.fileAttachment.create({
      data: {
        filename,
        path: `/uploads/claims/${filename}`,
        mimetype: this.getMimeType(filename),
        size: 0,
        claimId,
      },
    });

    // REGISTRAR EVENTO DE ARCHIVO ADJUNTADO
    await this.tracingService.recordEvent({
      claimId,
      actionType: ActionType.ARCHIVO_ADJUNTADO,
      user: userId,
      details: `Archivo adjuntado: ${filename}`,
      metadata: {
        filename,
        mimetype: attachment.mimetype,
        size: attachment.size,
      },
    });

    return attachment;
  }

  // Método para resolver reclamo
  async resolveClaim(claimId: string, userId: string, resolutionDetails?: string) {
    if (!this.isValidObjectId(claimId)) {
      throw new BadRequestException('ID de reclamo no válido');
    }

    const claim = await this.findOne(claimId);

    const updatedClaim = await this.prisma.claim.update({
      where: { id: claimId },
      data: {
        status: ClaimStatus.RESUELTO,
        claimHistory: {
          create: {
            actionType: 'resuelto',
            actionLabel: `Resuelto por ${userId}`,
            user: userId,
            details: resolutionDetails || 'Reclamo marcado como resuelto',
          },
        },
      },
    });

    // REGISTRAR EVENTO DE RESOLUCIÓN
    await this.tracingService.recordEvent({
      claimId,
      actionType: ActionType.RESUELTO,
      user: userId,
      details: resolutionDetails || 'Reclamo resuelto',
      metadata: {
        previousStatus: claim.status,
        resolutionDetails,
      },
    });

    return updatedClaim;
  }

  // Método para reabrir reclamo
  async reopenClaim(claimId: string, userId: string, reason?: string) {
    if (!this.isValidObjectId(claimId)) {
      throw new BadRequestException('ID de reclamo no válido');
    }

    const claim = await this.findOne(claimId);

    const updatedClaim = await this.prisma.claim.update({
      where: { id: claimId },
      data: {
        status: ClaimStatus.ABIERTO,
        claimHistory: {
          create: {
            actionType: 'reabierto',
            actionLabel: `Reabierto por ${userId}`,
            user: userId,
            details: reason || 'Reclamo reabierto',
          },
        },
      },
    });
  
  

    // REGISTRAR EVENTO DE REAPERTURA
    await this.tracingService.recordEvent({
      claimId,
      actionType: ActionType.REABIERTO,
      user: userId,
      details: reason || 'Reclamo reabierto',
      metadata: {
        previousStatus: claim.status,
        reason,
      },
    });

    return updatedClaim;
  }

  async changeStatus(claimId: string, changeStatusDto: ChangeStatusDto, userId: string) {
    this.isValidObjectId(claimId);

    const claim = await this.findOne(claimId);

    // Validar transición
    if (!this.statusService.validateTransition(claim.status, changeStatusDto.newStatus)) {
      throw new BadRequestException(
        `No se puede cambiar el estado de "${claim.status}" a "${changeStatusDto.newStatus}"`
      );
    }

    // Validar campos requeridos
    const requiredFields = this.statusService.getRequiredFields(
      claim.status, 
      changeStatusDto.newStatus
    );
    
    const missingFields = requiredFields.filter(field => 
      !changeStatusDto[field] && !changeStatusDto.internalNotes?.includes(field)
    );

    if (missingFields.length > 0) {
      throw new BadRequestException(
        `Campos requeridos para esta transición: ${missingFields.join(', ')}`
      );
    }

    // Realizar el cambio de estado
    const updatedClaim = await this.prisma.claim.update({
      where: { id: claimId },
      data: {
        status: changeStatusDto.newStatus,
        // claimHistory: {
        //   create: {
        //     actionType: 'ESTADO_CAMBIADO',
        //     actionLabel: `Estado cambiado a ${changeStatusDto.newStatus} por ${userId}`,
        //     user: userId,
        //     oldValue: claim.status,
        //     newValue: changeStatusDto.newStatus,
        //     details: changeStatusDto.reason || `Estado cambiado por ${userId}`,
        //     metadata: {
        //       reason: changeStatusDto.reason,
        //       internalNotes: changeStatusDto.internalNotes,
        //     },
        //   },
        // },
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    // Registrar evento de trazabilidad
    await this.tracingService.recordEvent({
      claimId,
      actionType: ActionType.ESTADO_CAMBIADO,
      user: userId,
      oldValue: claim.status,
      newValue: changeStatusDto.newStatus,
      details: changeStatusDto.reason || `Estado cambiado a ${changeStatusDto.newStatus}`,
      metadata: {
        reason: changeStatusDto.reason,
        internalNotes: changeStatusDto.internalNotes,
      },
    });

    return updatedClaim;
  }

  async validateAction(claimId: string, action: string): Promise<{ allowed: boolean; message?: string }> {
    this.isValidObjectId(claimId);

    const claim = await this.findOne(claimId);
    const allowed = this.statusService.canPerformAction(claim.status, action);

    if (!allowed) {
      return {
        allowed: false,
        message: `La acción "${action}" no está permitida en el estado "${claim.status}"`,
      };
    }

    return { allowed: true };
  }

  async getAvailableTransitions(claimId: string) {
    this.isValidObjectId(claimId);

    const claim = await this.findOne(claimId);
    const transitions = this.statusService.getPossibleTransitions(claim.status);

    return {
      currentStatus: claim.status,
      availableTransitions: transitions.map(status => ({
        status,
        label: this.statusService.formatStatusLabel(status),
        description: this.statusService.getStatusDescription(status),
        requiredFields: this.statusService.getRequiredFields(claim.status, status),
      })),
    };
  }


  private getMimeType(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      'pdf': 'application/pdf',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'txt': 'text/plain',
      'zip': 'application/zip',
    };
    return mimeTypes[extension as string] || 'application/octet-stream';
  }

  // Método auxiliar para validar ObjectId
  private isValidObjectId(id: string): boolean {
    return /^[0-9a-fA-F]{24}$/.test(id);
  }
}