import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AlertEntity, AlertSchema } from '../database/schemas/alert.schema';
import { IncidentEntity, IncidentSchema } from '../database/schemas/incident.schema';
import { AlertsController } from './alerts.controller';
import { AlertsService } from './alerts.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AlertEntity.name, schema: AlertSchema },
      { name: IncidentEntity.name, schema: IncidentSchema }
    ])
  ],
  controllers: [AlertsController],
  providers: [AlertsService],
  exports: [AlertsService]
})
export class AlertsModule {}
