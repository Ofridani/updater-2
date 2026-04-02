import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  CreateIncidentDto,
  CreateUpdateAlertDto,
  Incident,
  type Alert,
  ResolveIncidentDto
} from 'common';
import { isValidObjectId, Model } from 'mongoose';
import { AlertsService } from '../alerts/alerts.service';
import { mapIncidentDocument } from '../database/mappers';
import { IncidentDocument, IncidentEntity } from '../database/schemas/incident.schema';

@Injectable()
export class IncidentsService {
  constructor(
    private readonly alertsService: AlertsService,
    @InjectModel(IncidentEntity.name)
    private readonly incidentModel: Model<IncidentEntity>
  ) {}

  async createIncident(dto: CreateIncidentDto): Promise<{ incident: Incident; alert: Alert }> {
    return this.alertsService.createIncident(dto);
  }

  async addIncidentUpdate(incidentId: string, dto: CreateUpdateAlertDto): Promise<Alert> {
    return this.alertsService.updateActiveAlert(incidentId, dto);
  }

  async resolveIncident(
    incidentId: string,
    dto: ResolveIncidentDto
  ): Promise<{ incident: Incident; alert: Alert }> {
    return this.alertsService.resolveActiveAlert(incidentId, dto);
  }

  async getIncidentById(incidentId: string): Promise<Incident> {
    const incidentDocument = await this.findByIdOrThrow(incidentId);
    return mapIncidentDocument(incidentDocument);
  }

  private async findByIdOrThrow(incidentId: string): Promise<IncidentDocument> {
    if (!isValidObjectId(incidentId)) {
      throw new NotFoundException(`Incident with id ${incidentId} was not found.`);
    }

    const incident = await this.incidentModel.findById(incidentId).exec();

    if (!incident) {
      throw new NotFoundException(`Incident with id ${incidentId} was not found.`);
    }

    return incident as IncidentDocument;
  }
}
