import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AlertsModule } from './alerts/alerts.module';
import { IncidentsModule } from './incidents/incidents.module';

const mongoUri = process.env.MONGO_URI;

if (!mongoUri) {
  throw new Error('Missing required environment variable: MONGO_URI');
}

@Module({
  imports: [MongooseModule.forRoot(mongoUri), AlertsModule, IncidentsModule]
})
export class AppModule {}
