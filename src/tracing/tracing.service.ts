import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, ActionType } from '@prisma/client';

export interface TraceEvent {
  claimId: string;
  actionType: ActionType;
  user: string;
  oldValue?: string;
  newValue?: string;
  areaId?: string;
  subAreaId?: string;
  details?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class TracingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Registrar un evento de trazabilidad
   */
  async recordEvent(event: TraceEvent) {
    this.validateObjectId(event.claimId);

    // Verificar que el reclamo existe
    const claim = await this.prisma.claim.findUnique({
      where: { id: event.claimId },
    });

    if (!claim) {
      throw new NotFoundException(`Reclamo con ID ${event.claimId} no encontrado`);
    }

    // Generar label automático basado en el tipo de acción
    const actionLabel = this.generateActionLabel(event);

    const historyEntry = await this.prisma.claimHistory.create({
      data: {
        claimId: event.claimId,
        actionType: event.actionType,
        actionLabel,
        user: event.user,
        oldValue: event.oldValue,
        newValue: event.newValue,
        areaId: event.areaId,
        subAreaId: event.subAreaId,
        details: event.details,
        metadata: event.metadata,
      },
      include: {
        claim: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });

    return historyEntry;
  }

  /**
   * Obtener trazabilidad completa de un reclamo
   */
  async getClaimTrace(claimId: string) {
    this.validateObjectId(claimId);

    const claim = await this.prisma.claim.findUnique({
      where: { id: claimId },
    });

    if (!claim) {
      throw new NotFoundException(`Reclamo con ID ${claimId} no encontrado`);
    }

    const history = await this.prisma.claimHistory.findMany({
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
      orderBy: { createdAt: 'asc' }, // Orden cronológico
    });

    // Enriquecer con información adicional
    const enrichedHistory = await this.enrichTraceData(history);

    return {
      claim: {
        id: claim.id,
        title: claim.title,
        status: claim.status,
        createdAt: claim.createdAt,
      },
      timeline: enrichedHistory,
      summary: this.generateTraceSummary(enrichedHistory),
    };
  }

  /**
   * Obtener estadísticas de trazabilidad
   */
  async getTraceStats(claimId: string) {
    const trace = await this.getClaimTrace(claimId);
    
    const stats = {
      totalEvents: trace.timeline.length,
      timeInStatus: this.calculateTimeInStatus(trace.timeline),
      assignmentCount: trace.timeline.filter(event => 
        event.actionType === ActionType.ASIGNADO || event.actionType === ActionType.REASIGNADO
      ).length,
      statusChanges: trace.timeline.filter(event => 
        event.actionType === ActionType.ESTADO_CAMBIADO
      ).length,
      firstResponseTime: this.calculateFirstResponseTime(trace.timeline),
      resolutionTime: this.calculateResolutionTime(trace.timeline, trace.claim.createdAt),
    };

    return stats;
  }

  /**
   * Buscar eventos por tipo, usuario o rango de fechas
   */
  async searchEvents(filters: {
    claimId?: string;
    actionType?: ActionType;
    user?: string;
    startDate?: Date;
    endDate?: Date;
    areaId?: string;
  }) {
    const where: any = {};

    if (filters.claimId) {
      this.validateObjectId(filters.claimId);
      where.claimId = filters.claimId;
    }

    if (filters.actionType) {
      where.actionType = filters.actionType;
    }

    if (filters.user) {
      where.user = { contains: filters.user, mode: 'insensitive' };
    }

    if (filters.areaId) {
      this.validateObjectId(filters.areaId);
      where.areaId = filters.areaId;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    return this.prisma.claimHistory.findMany({
      where,
      include: {
        claim: {
          select: {
            id: true,
            title: true,
            status: true,
            client: {
              select: {
                id: true,
                name: true,
              },
            },
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
      orderBy: { createdAt: 'desc' },
      take: 100, // Límite para performance
    });
  }

  // ===== MÉTODOS AUXILIARES =====

  private generateActionLabel(event: TraceEvent): string {
    const labels = {
      [ActionType.CREADO]: `Reclamo creado por ${event.user}`,
      [ActionType.ASIGNADO]: `Asignado a ${event.newValue} por ${event.user}`,
      [ActionType.REASIGNADO]: `Reasignado de ${event.oldValue} a ${event.newValue} por ${event.user}`,
      [ActionType.ESTADO_CAMBIADO]: `Estado cambiado de ${event.oldValue} a ${event.newValue} por ${event.user}`,
      [ActionType.COMENTADO]: `Comentario agregado por ${event.user}`,
      [ActionType.ARCHIVO_ADJUNTADO]: `Archivo adjuntado por ${event.user}`,
      [ActionType.RESUELTO]: `Resuelto por ${event.user}`,
      [ActionType.REABIERTO]: `Reabierto por ${event.user}`,
      [ActionType.PRIORIDAD_CAMBIADA]: `Prioridad cambiada de ${event.oldValue} a ${event.newValue} por ${event.user}`,
      [ActionType.CRITICIDAD_CAMBIADA]: `Criticidad cambiada de ${event.oldValue} a ${event.newValue} por ${event.user}`,
      [ActionType.CERRADO]: `Cerrado por ${event.user}`,
    };

    return labels[event.actionType] || `Acción ${event.actionType} realizada por ${event.user}`;
  }

  private async enrichTraceData(history: any[]) {
    return Promise.all(
      history.map(async (event) => {
        let enrichedEvent = { ...event };
        
        // Enriquecer con nombres de áreas si existen
        if (event.areaId && !event.area) {
          const area = await this.prisma.area.findUnique({
            where: { id: event.areaId },
            select: { id: true, name: true },
          });
          enrichedEvent.area = area;
        }

        if (event.subAreaId && !event.subArea) {
          const subArea = await this.prisma.subArea.findUnique({
            where: { id: event.subAreaId },
            select: { id: true, name: true },
          });
          enrichedEvent.subArea = subArea;
        }

        return enrichedEvent;
      })
    );
  }

  private generateTraceSummary(timeline: any[]) {
    const statusChanges = timeline.filter(event => 
      event.actionType === ActionType.ESTADO_CAMBIADO
    );

    const assignments = timeline.filter(event => 
      event.actionType === ActionType.ASIGNADO || event.actionType === ActionType.REASIGNADO
    );

    return {
      totalEvents: timeline.length,
      statusChanges: statusChanges.length,
      assignments: assignments.length,
      currentStatus: timeline.length > 0 ? timeline[timeline.length - 1].newValue : null,
      lastAction: timeline.length > 0 ? timeline[timeline.length - 1] : null,
    };
  }

  private calculateTimeInStatus(timeline: any[]) {
    // Implementar lógica para calcular tiempo en cada estado
    // Esto es un ejemplo simplificado
    const statusTime: Record<string, number> = {};
    
    let currentStatus = 'abierto';
    let statusStartTime = timeline[0]?.createdAt;

    timeline.forEach((event, index) => {
      if (event.actionType === ActionType.ESTADO_CAMBIADO && statusStartTime) {
        const timeInStatus = event.createdAt.getTime() - statusStartTime.getTime();
        statusTime[currentStatus] = (statusTime[currentStatus] || 0) + timeInStatus;
        
        currentStatus = event.newValue;
        statusStartTime = event.createdAt;
      }
    });

    return statusTime;
  }

  private calculateFirstResponseTime(timeline: any[]) {
    const firstAssignment = timeline.find(event => 
      event.actionType === ActionType.ASIGNADO
    );

    const creationTime = timeline[0]?.createdAt;
    
    if (firstAssignment && creationTime) {
      return firstAssignment.createdAt.getTime() - creationTime.getTime();
    }

    return null;
  }

  private calculateResolutionTime(timeline: any[], claimCreation: Date) {
    const resolutionEvent = timeline.find(event => 
      event.actionType === ActionType.RESUELTO
    );

    if (resolutionEvent) {
      return resolutionEvent.createdAt.getTime() - claimCreation.getTime();
    }

    return null;
  }

  private validateObjectId(id: string): void {
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      throw new BadRequestException('ID no válido');
    }
  }
}