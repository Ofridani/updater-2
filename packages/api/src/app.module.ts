import { Module } from '@nestjs/common';
import { AlertsModule } from './alerts/alerts.module';
import { IncidentsModule } from './incidents/incidents.module';

@Module({
  imports: [AlertsModule, IncidentsModule]
})
export class AppModule {}
