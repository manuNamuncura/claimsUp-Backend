import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActionType, ClaimStatus } from '@prisma/client';
import { TracingService } from '../tracing/tracing.service';
import { CreateAreaDto } from './dto/create-area.dto';
import { CreateSubAreaDto } from './dto/create-subarea.dto';
import { AssignClaimDto } from './dto/assign-claim.dto';

@Injectable()
export class AreasService {
  constructor(
    private prisma: PrismaService,
    @Inject(TracingService) private tracingService: TracingService,
  ) {}

  // ===== ÁREAS =====
  async createArea(createAreaDto: CreateAreaDto) {
    // Verificar si el área ya existe
    const existingArea = await this.prisma.area.findUnique({
      where: { name: createAreaDto.name },
    });

    if (existingArea) {
      throw new ConflictException(
        `Ya existe un área con el nombre: ${createAreaDto.name}`,
      );
    }

    return this.prisma.area.create({
      data: createAreaDto,
    });
  }

  async findAllAreas(includeSubAreas: boolean = false) {
    return this.prisma.area.findMany({
      where: { isActive: true },
      include: {
        subAreas: includeSubAreas
          ? {
              where: { isActive: true },
            }
          : false,
        _count: {
          select: {
            assignments: {
              where: { isCurrent: true },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findAreaById(id: string) {
    this.validateObjectId(id);

    const area = await this.prisma.area.findUnique({
      where: { id },
      include: {
        subAreas: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
        },
        assignments: {
          where: { isCurrent: true },
          include: {
            claim: {
              select: {
                id: true,
                title: true,
                status: true,
              },
            },
          },
          take: 10,
          orderBy: { assignedAt: 'desc' },
        },
      },
    });

    if (!area) {
      throw new NotFoundException(`Área con ID ${id} no encontrada`);
    }

    return area;
  }

  // ===== SUB-ÁREAS =====
  async createSubArea(createSubAreaDto: CreateSubAreaDto) {
    this.validateObjectId(createSubAreaDto.areaId);

    // Verificar que el área padre existe
    const area = await this.prisma.area.findUnique({
      where: { id: createSubAreaDto.areaId },
    });

    if (!area) {
      throw new NotFoundException(
        `Área con ID ${createSubAreaDto.areaId} no encontrada`,
      );
    }

    // Verificar si ya existe una subárea con el mismo nombre en esta área
    const existingSubArea = await this.prisma.subArea.findFirst({
      where: {
        name: createSubAreaDto.name,
        areaId: createSubAreaDto.areaId,
      },
    });

    if (existingSubArea) {
      throw new ConflictException(
        `Ya existe una subárea con el nombre: ${createSubAreaDto.name} en esta área`,
      );
    }

    return this.prisma.subArea.create({
      data: createSubAreaDto,
      include: {
        area: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async findSubAreasByArea(areaId: string) {
    this.validateObjectId(areaId);

    // Verificar que el área existe
    const area = await this.prisma.area.findUnique({
      where: { id: areaId },
    });

    if (!area) {
      throw new NotFoundException(`Área con ID ${areaId} no encontrada`);
    }

    return this.prisma.subArea.findMany({
      where: {
        areaId,
        isActive: true,
      },
      include: {
        _count: {
          select: {
            assignments: {
              where: { isCurrent: true },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  // ===== ASIGNACIÓN DE RECLAMOS =====
  async assignClaimToArea(assignClaimDto: AssignClaimDto) {
    this.validateObjectId(assignClaimDto.claimId);
    this.validateObjectId(assignClaimDto.areaId);

    if (assignClaimDto.subAreaId && assignClaimDto.subAreaId !== '') {
      this.validateObjectId(assignClaimDto.subAreaId);
    }

    // Verificar que el reclamo existe
    const claim = await this.prisma.claim.findUnique({
      where: { id: assignClaimDto.claimId },
    });

    if (!claim) {
      throw new NotFoundException(
        `Reclamo con ID ${assignClaimDto.claimId} no encontrado`,
      );
    }

    // Verificar que el área existe
    const area = await this.prisma.area.findUnique({
      where: { id: assignClaimDto.areaId },
    });

    if (!area) {
      throw new NotFoundException(
        `Área con ID ${assignClaimDto.areaId} no encontrada`,
      );
    }

    // Si se especifica subárea, verificar que pertenece al área
    if (assignClaimDto.subAreaId) {
      const subArea = await this.prisma.subArea.findUnique({
        where: { id: assignClaimDto.subAreaId },
      });

      if (!subArea) {
        throw new NotFoundException(
          `Subárea con ID ${assignClaimDto.subAreaId} no encontrada`,
        );
      }

      if (subArea.areaId !== assignClaimDto.areaId) {
        throw new BadRequestException(
          'La subárea no pertenece al área especificada',
        );
      }
    }

    // Obtener asignación anterior
    const previousAssignment = await this.prisma.areaAssignment.findFirst({
      where: {
        claimId: assignClaimDto.claimId,
        isCurrent: true,
      },
      include: {
        area: true,
        subArea: true,
      },
    });

    // Marcar todas las asignaciones anteriores de este reclamo como no actuales
    await this.prisma.areaAssignment.updateMany({
      where: {
        claimId: assignClaimDto.claimId,
        isCurrent: true,
      },
      data: { isCurrent: false },
    });

    // Crear nueva asignación
    const assignment = await this.prisma.areaAssignment.create({
      data: {
        claimId: assignClaimDto.claimId,
        areaId: assignClaimDto.areaId,
        subAreaId: assignClaimDto.subAreaId || null,
        notes: assignClaimDto.notes,
        isCurrent: true,
      },
      include: {
        claim: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        area: {
          select: {
            id: true,
            name: true,
          },
        },
        subArea: assignClaimDto.subAreaId
          ? {
              select: {
                id: true,
                name: true,
              },
            }
          : false,
      },
    });

    await this.prisma.claim.update({
      where: { id: assignClaimDto.claimId },
      data: {
        status: ClaimStatus.EN_PROCESO,
      },
    });

    // REGISTRAR EVENTO DE TRAZABILIDAD
    const subArea = assignClaimDto.subAreaId
      ? await this.prisma.subArea.findUnique({
          where: { id: assignClaimDto.subAreaId },
        })
      : null;

    let actionType: ActionType = ActionType.ASIGNADO;
    let details = `Reclamo asignado al área: ${area.name}`;

    if (previousAssignment) {
      actionType = ActionType.REASIGNADO;
      const previousAreaName = previousAssignment.area.name;
      const previousSubAreaName = previousAssignment.subArea?.name;

      details = `Reclamo reasignado de ${previousAreaName}${
        previousSubAreaName ? ` - ${previousSubAreaName}` : ''
      } a ${area.name}${subArea ? ` - ${subArea.name}` : ''}`;
    }

    await this.tracingService.recordEvent({
      claimId: assignClaimDto.claimId,
      actionType,
      user: assignClaimDto.assignedBy,
      oldValue: previousAssignment
        ? `${previousAssignment.area.name}${previousAssignment.subArea ? ` - ${previousAssignment.subArea.name}` : ''}`
        : undefined,
      newValue: `${area.name}${subArea ? ` - ${subArea.name}` : ''}`,
      areaId: assignClaimDto.areaId,
      subAreaId: assignClaimDto.subAreaId,
      details,
      metadata: {
        notes: assignClaimDto.notes,
        previousAssignmentId: previousAssignment?.id,
      },
    });

    // También mantener el historial tradicional (para backward compatibility)
    // await this.prisma.claimHistory.create({
    //   data: {
    //     claimId: assignClaimDto.claimId,
    //     actionType: 'asignado',
    //     actionLabel: `Asignado a ${area.name}${assignClaimDto.subAreaId ? ` - ${assignment.subArea?.name}` : ''} por ${assignClaimDto.assignedBy}`,
    //     user: assignClaimDto.assignedBy,
    //     details: `Reclamo asignado al área: ${area.name}${assignClaimDto.subAreaId ? ` - Subárea: ${assignment.subArea?.name}` : ''}`,
    //   },
    // });

    return assignment;
  }

  async getCurrentAssignment(claimId: string) {
    this.validateObjectId(claimId);

    const assignment = await this.prisma.areaAssignment.findFirst({
      where: {
        claimId,
        isCurrent: true,
      },
      include: {
        area: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        subArea: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        claim: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });

    return assignment;
  }

  async getAssignmentHistory(claimId: string) {
    this.validateObjectId(claimId);

    return this.prisma.areaAssignment.findMany({
      where: { claimId },
      include: {
        area: {
          select: {
            id: true,
            name: true,
          },
        },
        subArea: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { assignedAt: 'desc' },
    });
  }

  async getClaimsByArea(areaId: string, includeSubAreas: boolean = false) {
    this.validateObjectId(areaId);

    const whereCondition: any = {
      areaId,
      isCurrent: true,
    };

    if (!includeSubAreas) {
      whereCondition.subAreaId = null;
    }

    return this.prisma.areaAssignment.findMany({
      where: whereCondition,
      include: {
        claim: {
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
        },
        subArea: includeSubAreas
          ? {
              select: {
                id: true,
                name: true,
              },
            }
          : false,
      },
      orderBy: { assignedAt: 'desc' },
    });
  }

  // ===== MÉTODOS ADICIONALES CON TRAZABILIDAD =====

  // Reasignar reclamo entre subáreas de la misma área
  async reassignToSubArea(
    claimId: string,
    subAreaId: string,
    assignedBy: string,
    notes?: string,
  ) {
    this.validateObjectId(claimId);
    this.validateObjectId(subAreaId);

    // Verificar que el reclamo existe
    const claim = await this.prisma.claim.findUnique({
      where: { id: claimId },
    });

    if (!claim) {
      throw new NotFoundException(`Reclamo con ID ${claimId} no encontrado`);
    }

    // Verificar que la subárea existe
    const subArea = await this.prisma.subArea.findUnique({
      where: { id: subAreaId },
      include: {
        area: true,
      },
    });

    if (!subArea) {
      throw new NotFoundException(`Subárea con ID ${subAreaId} no encontrada`);
    }

    // Obtener asignación actual
    const currentAssignment = await this.getCurrentAssignment(claimId);

    if (!currentAssignment) {
      throw new BadRequestException(
        'El reclamo no tiene una asignación actual',
      );
    }

    // Verificar que estamos en la misma área
    if (currentAssignment.areaId !== subArea.areaId) {
      throw new BadRequestException(
        'No se puede reasignar a una subárea de diferente área',
      );
    }

    // Marcar asignación anterior como no actual
    await this.prisma.areaAssignment.updateMany({
      where: {
        claimId,
        isCurrent: true,
      },
      data: { isCurrent: false },
    });

    // Crear nueva asignación
    const assignment = await this.prisma.areaAssignment.create({
      data: {
        claimId,
        areaId: subArea.areaId,
        subAreaId,
        assignedBy,
        notes,
        isCurrent: true,
      },
      include: {
        claim: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        area: {
          select: {
            id: true,
            name: true,
          },
        },
        subArea: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // REGISTRAR EVENTO DE REASIGNACIÓN INTERNA
    await this.tracingService.recordEvent({
      claimId,
      actionType: ActionType.REASIGNADO,
      user: assignedBy,
      oldValue: `${currentAssignment.area.name} - ${currentAssignment.subArea?.name || 'Sin subárea'}`,
      newValue: `${subArea.area.name} - ${subArea.name}`,
      areaId: subArea.areaId,
      subAreaId,
      details: `Reasignación interna dentro del área ${subArea.area.name}`,
      metadata: {
        notes,
        previousSubAreaId: currentAssignment.subAreaId,
        isInternalReassignment: true,
      },
    });

    return assignment;
  }

  // Obtener estadísticas de asignaciones por área
  async getAreaAssignmentStats() {
    const areas = await this.findAllAreas(true);

    const stats = await Promise.all(
      areas.map(async (area) => {
        const currentAssignments = await this.getClaimsByArea(area.id, true);

        // Contar por estado
        const statusCounts = currentAssignments.reduce((acc, assignment) => {
          const status = assignment.claim.status;
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {});

        // Contar por subárea
        const subAreaCounts = area.subAreas.map((subArea) => ({
          id: subArea.id,
          name: subArea.name,
          count: currentAssignments.filter((a) => a.subAreaId === subArea.id)
            .length,
        }));

        return {
          area: {
            id: area.id,
            name: area.name,
          },
          totalAssignments: currentAssignments.length,
          statusCounts,
          subAreaCounts,
        };
      }),
    );

    return stats;
  }

  // Desasignar reclamo (quitar de área)
  async unassignClaim(claimId: string, unassignedBy: string, reason?: string) {
    this.validateObjectId(claimId);

    // Verificar que el reclamo existe
    const claim = await this.prisma.claim.findUnique({
      where: { id: claimId },
    });

    if (!claim) {
      throw new NotFoundException(`Reclamo con ID ${claimId} no encontrado`);
    }

    // Obtener asignación actual
    const currentAssignment = await this.getCurrentAssignment(claimId);

    if (!currentAssignment) {
      throw new BadRequestException(
        'El reclamo no tiene una asignación actual',
      );
    }

    // Marcar asignación actual como no actual
    await this.prisma.areaAssignment.updateMany({
      where: {
        claimId,
        isCurrent: true,
      },
      data: { isCurrent: false },
    });

    // REGISTRAR EVENTO DE DESASIGNACIÓN
    await this.tracingService.recordEvent({
      claimId,
      actionType: ActionType.REASIGNADO,
      user: unassignedBy,
      oldValue: `${currentAssignment.area.name}${currentAssignment.subArea ? ` - ${currentAssignment.subArea.name}` : ''}`,
      newValue: 'Sin asignar',
      details: reason || 'Reclamo desasignado del área',
      metadata: {
        reason,
        previousAreaId: currentAssignment.areaId,
        previousSubAreaId: currentAssignment.subAreaId,
        isUnassignment: true,
      },
    });

    return {
      success: true,
      message: 'Reclamo desasignado correctamente',
      previousAssignment: {
        area: currentAssignment.area.name,
        subArea: currentAssignment.subArea?.name,
      },
    };
  }
  // Método auxiliar para validar ObjectId
  private validateObjectId(id: string): void {
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      throw new BadRequestException('ID no válido');
    }
  }
}
