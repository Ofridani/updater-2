import { Module } from '@nestjs/common';
import { AlertsModule } from '../alerts/alerts.module';
import { IncidentsController } from './incidents.controller';
import { IncidentsService } from './incidents.service';

@Module({
  imports: [AlertsModule],
  controllers: [IncidentsController],
  providers: [IncidentsService],
  exports: [IncidentsService]
})
export class IncidentsModule {}
