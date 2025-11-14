import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Query,
  BadRequestException 
} from '@nestjs/common';
import { TracingService } from './tracing.service';
import { ActionType } from '@prisma/client';

@Controller('tracing')
export class TracingController {
  constructor(private readonly tracingService: TracingService) {}

  @Get('claim/:claimId')
  getClaimTrace(@Param('claimId') claimId: string) {
    return this.tracingService.getClaimTrace(claimId);
  }

  @Get('claim/:claimId/stats')
  getTraceStats(@Param('claimId') claimId: string) {
    return this.tracingService.getTraceStats(claimId);
  }

  @Get('search')
  searchEvents(
    @Query('claimId') claimId?: string,
    @Query('actionType') actionType?: ActionType,
    @Query('user') user?: string,
    @Query('areaId') areaId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    // Validar y parsear fechas
    let startDateParsed: Date | undefined;
    let endDateParsed: Date | undefined;

    try {
      if (startDate) startDateParsed = new Date(startDate);
      if (endDate) endDateParsed = new Date(endDate);
    } catch (error) {
      throw new BadRequestException('Formato de fecha inválido');
    }

    return this.tracingService.searchEvents({
      claimId,
      actionType,
      user,
      areaId,
      startDate: startDateParsed,
      endDate: endDateParsed,
    });
  }

  @Post('event')
  recordEvent(@Body() eventData: any) {
    return this.tracingService.recordEvent(eventData);
  }
}