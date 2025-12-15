import { PrismaClient, ProjectType, ClaimStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed COMPLETO de la base de datos...');

  try {
    // ===== 1. CREAR ÁREAS Y SUBÁREAS =====
    console.log('🏢 Creando áreas y subáreas...');
    
    // Limpiar áreas existentes primero
    await prisma.areaAssignment.deleteMany();
    await prisma.subArea.deleteMany();
    await prisma.area.deleteMany();

    // Crear áreas principales
    const areas = await Promise.all([
      prisma.area.create({
        data: {
          name: 'VENTAS',
          description: 'Área de ventas y atención al cliente',
          isActive: true,
        },
      }),
      prisma.area.create({
        data: {
          name: 'SOPORTE_TECNICO',
          description: 'Área de soporte técnico y resolución de problemas',
          isActive: true,
        },
      }),
      prisma.area.create({
        data: {
          name: 'FACTURACION',
          description: 'Área de facturación y cobranzas',
          isActive: true,
        },
      }),
      prisma.area.create({
        data: {
          name: 'DESARROLLO',
          description: 'Área de desarrollo de software y nuevas funcionalidades',
          isActive: true,
        },
      }),
      prisma.area.create({
        data: {
          name: 'ADMINISTRACION',
          description: 'Área administrativa y gestión general',
          isActive: true,
        },
      }),
    ]);

    console.log(`✅ ${areas.length} áreas creadas`);

    // Crear subáreas para cada área principal
    const subAreas = await Promise.all([
      // Subáreas para VENTAS
      prisma.subArea.create({
        data: {
          name: 'Atención al Cliente',
          description: 'Atención directa a clientes y consultas comerciales',
          areaId: areas[0].id,
          isActive: true,
        },
      }),
      prisma.subArea.create({
        data: {
          name: 'Pre-venta',
          description: 'Procesos de pre-venta y cotizaciones',
          areaId: areas[0].id,
          isActive: true,
        },
      }),

      // Subáreas para SOPORTE_TECNICO
      prisma.subArea.create({
        data: {
          name: 'Soporte N1',
          description: 'Soporte técnico de primer nivel',
          areaId: areas[1].id,
          isActive: true,
        },
      }),
      prisma.subArea.create({
        data: {
          name: 'Soporte N2',
          description: 'Soporte técnico especializado',
          areaId: areas[1].id,
          isActive: true,
        },
      }),

      // Subáreas para FACTURACION
      prisma.subArea.create({
        data: {
          name: 'Facturación',
          description: 'Emisión de facturas y documentos',
          areaId: areas[2].id,
          isActive: true,
        },
      }),

      // Subáreas para DESARROLLO
      prisma.subArea.create({
        data: {
          name: 'Frontend',
          description: 'Desarrollo de interfaces de usuario',
          areaId: areas[3].id,
          isActive: true,
        },
      }),
      prisma.subArea.create({
        data: {
          name: 'Backend',
          description: 'Desarrollo de servidores y APIs',
          areaId: areas[3].id,
          isActive: true,
        },
      }),

      // Subáreas para ADMINISTRACION
      prisma.subArea.create({
        data: {
          name: 'Recursos Humanos',
          description: 'Gestión de personal y nóminas',
          areaId: areas[4].id,
          isActive: true,
        },
      }),
    ]);

    console.log(`✅ ${subAreas.length} subáreas creadas`);

    // ===== 2. CREAR CLIENTES =====
    console.log('👥 Creando clientes...');
    
    // Limpiar datos existentes (excepto áreas que ya creamos)
    await prisma.claimHistory.deleteMany();
    await prisma.fileAttachment.deleteMany();
    await prisma.areaAssignment.deleteMany();
    await prisma.claim.deleteMany();
    await prisma.project.deleteMany();
    await prisma.client.deleteMany();

    const clients = await Promise.all([
      prisma.client.create({
        data: {
          name: 'Empresa Tech Solutions SA',
          contact: 'Juan Pérez',
          email: 'cliente1@empresa.com',
          phone: '+54 11 1234-5678',
          isActive: true,
        },
      }),
      prisma.client.create({
        data: {
          name: 'Consultoría XYZ',
          contact: 'María García',
          email: 'info@consultoriaxyz.com',
          phone: '+54 351 987-6543',
          isActive: true,
        },
      }),
      prisma.client.create({
        data: {
          name: 'Retail Corp',
          contact: 'Carlos López',
          email: 'ventas@retailcorp.com',
          phone: '+54 341 555-1234',
          isActive: true,
        },
      }),
      prisma.client.create({
        data: {
          name: 'Startup Innovadora',
          contact: 'Laura Rodríguez',
          email: 'laura@startup.com',
          phone: '+54 11 8765-4321',
          isActive: false,
        },
      }),
    ]);

    console.log(`✅ ${clients.length} clientes creados`);

    // ===== 3. CREAR PROYECTOS =====
    console.log('📁 Creando proyectos...');

    const projects = await Promise.all([
      // Proyectos para Empresa Tech Solutions
      prisma.project.create({
        data: {
          name: 'Sistema de Gestión Interna',
          type: ProjectType.SOFTWARE,
          clientId: clients[0].id,
        },
      }),
      prisma.project.create({
        data: {
          name: 'App Móvil Clientes',
          type: ProjectType.SOFTWARE,
          clientId: clients[0].id,
        },
      }),

      // Proyectos para Consultoría XYZ
      prisma.project.create({
        data: {
          name: 'Campaña Redes Sociales',
          type: ProjectType.MARKETING,
          clientId: clients[1].id,
        },
      }),
      prisma.project.create({
        data: {
          name: 'Reestructuración Organizacional',
          type: ProjectType.CONSULTORIA,
          clientId: clients[1].id,
        },
      }),

      // Proyectos para Retail Corp
      prisma.project.create({
        data: {
          name: 'Rediseño Sitio Web',
          type: ProjectType.DISENO,
          clientId: clients[2].id,
        },
      }),
      prisma.project.create({
        data: {
          name: 'Soporte E-commerce',
          type: ProjectType.SOPORTE,
          clientId: clients[2].id,
        },
      }),
    ]);

    console.log(`✅ ${projects.length} proyectos creados`);

    // ===== 4. CREAR RECLAMOS =====
    console.log('🎯 Creando reclamos...');

    const claims = await Promise.all([
      prisma.claim.create({
        data: {
          title: 'Error crítico en sistema de login',
          description: 'Los usuarios no pueden acceder al sistema después del último deploy. Error 500 en endpoint /auth/login',
          type: 'error',
          priority: 'alta',
          severity: 'critica',
          status: ClaimStatus.ABIERTO,
          clientId: clients[0].id,
          projectId: projects[0].id,
          claimHistory: {
            create: {
              actionType: 'CREADO',
              actionLabel: `Reclamo creado por`,
              user: 'empleado-1',
              details: 'Reclamo creado por Juan Pérez del área de Soporte'
            }
          }
        },
      }),
      prisma.claim.create({
        data: {
          title: 'Solicitud de reporte de ventas',
          description: 'Necesitamos un nuevo reporte que muestre las ventas por categoría y región',
          type: 'feature',
          priority: 'media',
          severity: 'media',
          status: ClaimStatus.EN_PROCESO,
          clientId: clients[1].id,
          projectId: projects[2].id,
          claimHistory: {
            create: [
              {
                actionType: 'CREADO',
                actionLabel: ``,
                user: 'empleado-2',
                details: 'Reclamo creado por María García'
              },
              {
                actionType: 'ASIGNADO',
                actionLabel: ``,
                user: 'coordinador-1',
                details: 'Asignado al área de Desarrollo'
              }
            ]
          }
        },
      }),
      prisma.claim.create({
        data: {
          title: 'Consulta sobre integración API',
          description: '¿Es posible integrar nuestro CRM con la API del sistema? Necesitamos documentación técnica',
          type: 'consulta',
          priority: 'baja',
          severity: 'baja',
          status: ClaimStatus.RESUELTO,
          clientId: clients[2].id,
          projectId: projects[4].id,
          claimHistory: {
            create: [
              {
                actionType: 'CREADO',
                actionLabel: ``,
                user: 'empleado-3',
                details: 'Consulta técnica creada'
              },
              {
                actionType: 'RESUELTO',
                actionLabel: ``,
                user: 'soporte-1',
                details: 'Se envió documentación técnica al cliente'
              }
            ]
          }
        },
      }),
      prisma.claim.create({
        data: {
          title: 'Problema de facturación duplicada',
          description: 'Algunos clientes están recibiendo facturas duplicadas en el mismo período',
          type: 'error',
          priority: 'alta',
          severity: 'alta',
          status: ClaimStatus.EN_PROCESO,
          clientId: clients[0].id,
          projectId: projects[1].id,
          claimHistory: {
            create: {
              actionType: 'CREADO',
              actionLabel: ``,
              user: 'empleado-4',
              details: 'Reporte de cliente sobre facturación'
            }
          }
        },
      })
    ]);

    console.log(`✅ ${claims.length} reclamos creados`);

    // ===== 5. CREAR ASIGNACIONES A ÁREAS =====
    console.log('🔗 Creando asignaciones a áreas...');

    const assignments = await Promise.all([
      // Reclamo 1 (Error login) → Soporte Técnico N1
      prisma.areaAssignment.create({
        data: {
          claimId: claims[0].id,
          areaId: areas[1].id, // SOPORTE_TECNICO
          subAreaId: subAreas[2].id, // Soporte N1
          assignedBy: 'coordinador-1',
          notes: 'Error crítico que requiere atención inmediata',
          isCurrent: true,
        },
      }),
      // Reclamo 2 (Reporte ventas) → Desarrollo Backend
      prisma.areaAssignment.create({
        data: {
          claimId: claims[1].id,
          areaId: areas[3].id, // DESARROLLO
          subAreaId: subAreas[5].id, // Backend
          assignedBy: 'coordinador-1',
          notes: 'Nueva funcionalidad solicitada por cliente',
          isCurrent: true,
        },
      }),
      // Reclamo 3 (Consulta API) → Soporte Técnico N2
      prisma.areaAssignment.create({
        data: {
          claimId: claims[2].id,
          areaId: areas[1].id, // SOPORTE_TECNICO
          subAreaId: subAreas[3].id, // Soporte N2
          assignedBy: 'coordinador-1',
          notes: 'Consulta técnica que requiere conocimiento especializado',
          isCurrent: true,
        },
      }),
      // Reclamo 4 (Facturación duplicada) → Facturación
      prisma.areaAssignment.create({
        data: {
          claimId: claims[3].id,
          areaId: areas[2].id, // FACTURACION
          subAreaId: subAreas[4].id, // Facturación
          assignedBy: 'coordinador-1',
          notes: 'Problema crítico en proceso de facturación',
          isCurrent: true,
        },
      })
    ]);

    console.log(`✅ ${assignments.length} asignaciones creadas`);

    // ===== 6. CREAR ARCHIVOS ADJUNTOS =====
    console.log('📎 Creando archivos adjuntos...');

    await prisma.fileAttachment.createMany({
      data: [
        {
          filename: 'error-login.pdf',
          path: '/uploads/claims/error-login-123.pdf',
          size: 1024000,
          mimetype: 'application/pdf',
          claimId: claims[0].id,
        },
        {
          filename: 'screenshot-error.png',
          path: '/uploads/claims/screenshot-error-456.png',
          size: 512000,
          mimetype: 'image/png',
          claimId: claims[0].id,
        },
        {
          filename: 'requerimientos-reporte.docx',
          path: '/uploads/claims/req-reporte-789.docx',
          size: 2048000,
          mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          claimId: claims[1].id,
        },
        {
          filename: 'facturas-duplicadas.xlsx',
          path: '/uploads/claims/facturas-dup-101.xlsx',
          size: 1536000,
          mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          claimId: claims[3].id,
        }
      ]
    });

    console.log('✅ Archivos adjuntos creados');

    // ===== 7. MOSTRAR RESUMEN COMPLETO =====
    console.log('\n📊 RESUMEN COMPLETO DEL SEED:');
    console.log('=============================');
    
    console.log(`🏢 Áreas: ${areas.length}`);
    areas.forEach(area => {
      const areaSubAreas = subAreas.filter(sa => sa.areaId === area.id);
      console.log(`   - ${area.name}: ${areaSubAreas.length} subáreas`);
    });

    console.log(`👥 Clientes: ${clients.length}`);
    clients.forEach(client => {
      console.log(`   - ${client.name} (${client.email})`);
    });

    console.log(`📁 Proyectos: ${projects.length}`);
    projects.forEach(project => {
      const client = clients.find(c => c.id === project.clientId);
      console.log(`   - ${project.name} [${project.type}]`);
    });

    console.log(`🎯 Reclamos: ${claims.length}`);
    claims.forEach(claim => {
      const assignment = assignments.find(a => a.claimId === claim.id);
      const area = areas.find(a => a.id === assignment?.areaId);
      const subArea = subAreas.find(sa => sa.id === assignment?.subAreaId);
      console.log(`   - ${claim.title} [${claim.status}] → ${area?.name}${subArea ? ` - ${subArea.name}` : ''}`);
    });

    console.log(`🔗 Asignaciones: ${assignments.length}`);
    console.log(`📎 Archivos adjuntos: 4`);

    console.log('\n🎉 SEED COMPLETO EXITOSO!');
    console.log('✨ El sistema está listo con datos de prueba completos');

  } catch (error) {
    console.error('❌ Error durante el seed completo:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('💥 Error fatal:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });