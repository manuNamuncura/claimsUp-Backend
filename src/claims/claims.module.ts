import { Module } from '@nestjs/common';
import { ClaimsService } from './claims.service';
import { ClaimsController } from './claims.controller';
import { TracingModule } from '../tracing/tracing.module'; 
import { StatusModule } from 'src/status/status.module';

@Module({
  imports: [TracingModule, StatusModule],
  controllers: [ClaimsController],
  providers: [ClaimsService],
  exports: [ClaimsService],
})
export class ClaimsModule {}