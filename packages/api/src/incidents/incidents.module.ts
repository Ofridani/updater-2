import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AlertsModule } from '../alerts/alerts.module';
import { IncidentEntity, IncidentSchema } from '../database/schemas/incident.schema';
import { IncidentsController } from './incidents.controller';
import { IncidentsService } from './incidents.service';

@Module({
  imports: [
    AlertsModule,
    MongooseModule.forFeature([{ name: IncidentEntity.name, schema: IncidentSchema }])
  ],
  controllers: [IncidentsController],
  providers: [IncidentsService],
  exports: [IncidentsService]
})
export class IncidentsModule {}
