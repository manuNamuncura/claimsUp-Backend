import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ClientsModule } from './clients/clients.module';
import { ProjectsModule } from './projects/projects.module';
import { ClaimsModule } from './claims/claims.module';
import { AreasModule } from './areas/areas.module';
import { TracingModule } from './tracing/tracing.module';
import { StatusService } from './status/status.service';
import { StatusController } from './status/status.controller';
import { StatusModule } from './status/status.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    ClientsModule,
    ProjectsModule,
    ClaimsModule,
    AreasModule,
    TracingModule,
    StatusModule,
  ],
  controllers: [AppController, StatusController],
  providers: [AppService, StatusService],
})
export class AppModule {}