import { Injectable } from '@nestjs/common';
import { ClaimStatus } from '@prisma/client';

export interface StatusRule {
  allowedTransitions: ClaimStatus[];
  canEdit: boolean;
  canAssign: boolean;
  canComment: boolean;
  canAttachFiles: boolean;
  canReassign: boolean;
  requiredForTransition?: {
    [key in ClaimStatus]?: string[];
  };
}

@Injectable()
export class StatusService {
    private readonly statusRules: { [key in ClaimStatus]: StatusRule } = {
    [ClaimStatus.ABIERTO]: {
      allowedTransitions: [ClaimStatus.EN_PROCESO, ClaimStatus.CANCELADO],
      canEdit: true,
      canAssign: true,
      canComment: true,
      canAttachFiles: true,
      canReassign: true,
    },
    [ClaimStatus.EN_PROCESO]: {
      allowedTransitions: [
        ClaimStatus.ESPERANDO_CLIENTE, 
        ClaimStatus.RESUELTO, 
        ClaimStatus.ABIERTO,
        ClaimStatus.CANCELADO
      ],
      canEdit: true,
      canAssign: true,
      canComment: true,
      canAttachFiles: true,
      canReassign: true,
      requiredForTransition: {
        [ClaimStatus.RESUELTO]: ['resolutionDetails'],
      },
    },
    [ClaimStatus.ESPERANDO_CLIENTE]: {
      allowedTransitions: [ClaimStatus.EN_PROCESO, ClaimStatus.RESUELTO, ClaimStatus.CANCELADO],
      canEdit: false,
      canAssign: false,
      canComment: false, 
      canAttachFiles: false,
      canReassign: false,
    },
    [ClaimStatus.RESUELTO]: {
      allowedTransitions: [ClaimStatus.CERRADO, ClaimStatus.EN_PROCESO], 
      canEdit: false,
      canAssign: false,
      canComment: true, 
      canAttachFiles: false,
      canReassign: false,
      requiredForTransition: {
        [ClaimStatus.CERRADO]: ['closureNotes'],
      },
    },
    [ClaimStatus.CERRADO]: {
      allowedTransitions: [],  
      canEdit: false,
      canAssign: false,
      canComment: false,
      canAttachFiles: false,
      canReassign: false,
    },
    [ClaimStatus.CANCELADO]: {
      allowedTransitions: [ClaimStatus.ABIERTO], 
      canEdit: false,
      canAssign: false,
      canComment: true,
      canAttachFiles: false,
      canReassign: false,
    },
  };

  // Validar si una transicion de estado es permitida
  validateTransition(currentStatus: ClaimStatus, newStatus:ClaimStatus): boolean {
    const rules = this.statusRules[currentStatus];
    return rules.allowedTransitions.includes(newStatus)
  }

  // Obtener reglas para un estado especifico
  getStatusRules(status: ClaimStatus): StatusRule {
    return this.statusRules[status];
  }

  // Obtener campos requeridos para una transicion
  getRequiredFields(currentStatus: ClaimStatus, newStatus: ClaimStatus): string[] {
    const rules = this.statusRules[currentStatus];
    return rules.requiredForTransition?.[newStatus] || [];
  }

  canPerformAction(status: ClaimStatus, action: string): boolean {
    const rules = this.statusRules[status];

    switch (action) {
        case 'edit':
            return rules.canEdit;
        case 'assign':
            return rules.canAssign;
        case 'comment':
            return rules.canComment;
        case 'attachFiles':
            return rules.canAttachFiles;
        case 'reassign':
            return rules.canReassign;
        default:
            return false;
    }
  }

  // Obtener todas las transiciones posibles desde un estado
  getPossibleTransitions(currentStatus: ClaimStatus): ClaimStatus[] {
    return this.statusRules[currentStatus].allowedTransitions;
  }

  // Obtener descripcion de los estados
  getStatusDescription(status: ClaimStatus): string {
    const descriptions = {
        [ClaimStatus.ABIERTO]: 'Reclamo recien creado, pendiente de asignacion',
        [ClaimStatus.EN_PROCESO]: 'En trabajo activo por el area asignado',
        [ClaimStatus.ESPERANDO_CLIENTE]: 'Esperando respuesta o informacion del cliente',
        [ClaimStatus.RESUELTO]: 'Solucion implementada, pendiente de confirmacion/cierre',
        [ClaimStatus.CERRADO]: 'Reclamo finalizado y archivado',
        [ClaimStatus.CANCELADO]: 'Reclamo cancelado por diversas razones',
    };
    return descriptions[status];
  }


  getAvailableStatuses(): Array<{ value: ClaimStatus; label: string; despcription: string }> {
    return Object.values(ClaimStatus).map(status => ({
        value: status,
        label: this.formatStatusLabel(status),
        despcription: this.getStatusDescription(status),
    }));
  }


  formatStatusLabel(status: ClaimStatus): string {
    return status
        .toLowerCase()
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
  }
}
