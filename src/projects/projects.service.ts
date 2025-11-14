import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectType } from '@prisma/client';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(createProjectDto: CreateProjectDto) {
    // Validar clientId
    if (!this.isValidObjectId(createProjectDto.clientId)) {
      throw new BadRequestException('ID de cliente no válido');
    }

    // Verificar que el cliente existe
    const client = await this.prisma.client.findUnique({
      where: { id: createProjectDto.clientId },
    });

    if (!client) {
      throw new NotFoundException(`Cliente con ID ${createProjectDto.clientId} no encontrado`);
    }

    // Verificar si ya existe un proyecto con el mismo nombre para este cliente
    const existingProject = await this.prisma.project.findFirst({
      where: {
        name: createProjectDto.name,
        clientId: createProjectDto.clientId,
      },
    });

    if (existingProject) {
      throw new ConflictException('Ya existe un proyecto con este nombre para el cliente seleccionado');
    }

    return this.prisma.project.create({
      data: createProjectDto,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.project.findMany({
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            claims: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) { 
    // Validar ObjectId
    if (!this.isValidObjectId(id)) {
      throw new BadRequestException('ID de proyecto no válido');
    }

    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            contact: true,
            phone: true,
          },
        },
        claims: {
          select: {
            id: true,
            title: true,
            description: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            claims: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`Proyecto con ID ${id} no encontrado`);
    }

    return project;
  }

  async findByClient(clientId: string) { 
    // Validar ObjectId
    if (!this.isValidObjectId(clientId)) {
      throw new BadRequestException('ID de cliente no válido');
    }

    // Verificar que el cliente existe
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw new NotFoundException(`Cliente con ID ${clientId} no encontrado`);
    }

    return this.prisma.project.findMany({
      where: { clientId },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            claims: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByType(type: ProjectType) {
    return this.prisma.project.findMany({
      where: { type },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            claims: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async update(id: string, updateProjectDto: UpdateProjectDto) { 
    // Validar ObjectId
    if (!this.isValidObjectId(id)) {
      throw new BadRequestException('ID de proyecto no válido');
    }

    // Verificar que el proyecto existe
    const existingProject = await this.findOne(id);

    // Si se actualiza el clientId, verificar que el nuevo cliente existe
    if (updateProjectDto.clientId) {
      if (!this.isValidObjectId(updateProjectDto.clientId)) {
        throw new BadRequestException('ID de cliente no válido');
      }

      const client = await this.prisma.client.findUnique({
        where: { id: updateProjectDto.clientId },
      });

      if (!client) {
        throw new NotFoundException(`Cliente con ID ${updateProjectDto.clientId} no encontrado`);
      }
    }

    // Si se actualiza el nombre, verificar que no exista conflicto
    if (updateProjectDto.name) {
      const clientId = updateProjectDto.clientId || existingProject.clientId;
      
      const existingProjectWithSameName = await this.prisma.project.findFirst({
        where: {
          name: updateProjectDto.name,
          clientId: clientId,
          id: { not: id }, 
        },
      });

      if (existingProjectWithSameName) {
        throw new ConflictException('Ya existe un proyecto con este nombre para el cliente seleccionado');
      }
    }

    return this.prisma.project.update({
      where: { id },
      data: updateProjectDto,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async remove(id: string) { 
    // Validar ObjectId
    if (!this.isValidObjectId(id)) {
      throw new BadRequestException('ID de proyecto no válido');
    }

    // Verificar que el proyecto existe y contar reclamos
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            claims: true,
          },
        },
      },
    });

    if (!project) {
        throw new NotFoundException(`Proyecto con ID ${id} no encontrado`);
    }

    if (project._count.claims > 0) {
      throw new BadRequestException(
        `No se puede eliminar el proyecto "${project.name}" porque tiene ${project._count.claims} reclamos asociados. Elimine primero los reclamos.`
      );
    }

    return this.prisma.project.delete({
      where: { id },
    });
  }

  async getProjectTypes() {
    return Object.values(ProjectType);
  }

  // Método auxiliar para validar ObjectId
  private isValidObjectId(id: string): boolean {
    return /^[0-9a-fA-F]{24}$/.test(id);
  }
}