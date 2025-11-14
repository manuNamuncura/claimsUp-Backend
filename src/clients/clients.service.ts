import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async create(createClientDto: CreateClientDto) {
    // Verificar si el email ya existe
    const existingClient = await this.prisma.client.findUnique({
      where: { email: createClientDto.email },
    });

    if (existingClient) {
      throw new ConflictException('El email ya está registrado');
    }

    return this.prisma.client.create({
      data: createClientDto,
    });
  }

  async findAll() {
    return this.prisma.client.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    // Validar que el ID tenga formato válido (ObjectId)
    if (!this.isValidObjectId(id)) {
      throw new BadRequestException('ID de cliente no válido');
    }

    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        projects: true,
        claims: true,
      },
    });

    if (!client) {
      throw new NotFoundException(`Cliente con ID ${id} no encontrado`);
    }

    return client;
  }

  async update(id: string, updateClientDto: UpdateClientDto) {
    // Verificar si el cliente existe
    await this.findOne(id);

    // Si se está actualizando el email, verificar que no exista otro cliente con el mismo email
    if (updateClientDto.email) {
      const existingClient = await this.prisma.client.findFirst({
        where: {
          email: updateClientDto.email,
          id: { not: id }, 
        },
      });

      if (existingClient) {
        throw new ConflictException('El email ya está registrado por otro cliente');
      }
    }

    return this.prisma.client.update({
      where: { id },
      data: updateClientDto,
    });
  }

  async remove(id: string) { 
    // Soft delete: marcar como inactivo en lugar de eliminar
    await this.findOne(id);

    return this.prisma.client.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async searchClients(searchTerm: string) {
    return this.prisma.client.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
          { contact: { contains: searchTerm, mode: 'insensitive' } },
        ],
        isActive: true,
      },
    });
  }

  // Método auxiliar para validar ObjectId
  private isValidObjectId(id: string): boolean {
    // ObjectId de MongoDB tiene 24 caracteres hex
    return /^[0-9a-fA-F]{24}$/.test(id);
  }
}