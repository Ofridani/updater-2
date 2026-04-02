import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  CreateIncidentDto,
  CreateUpdateAlertDto,
  Incident,
  IncidentStatus,
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
    const incidentDocument = (await this.incidentModel.create({
      title: dto.title,
      impact: dto.impact,
      streams: dto.streams,
      status: IncidentStatus.ACTIVE
    })) as IncidentDocument;

    const incident = mapIncidentDocument(incidentDocument);

    const alert = await this.alertsService.createIncidentAlert(incident._id, {
      title: dto.title,
      message: dto.message,
      streams: dto.streams,
      publishDate: dto.publishDate
    });

    return { incident, alert };
  }

  async addIncidentUpdate(incidentId: string, dto: CreateUpdateAlertDto): Promise<Alert> {
    await this.findByIdOrThrow(incidentId);
    return this.alertsService.createUpdateAlert(incidentId, dto);
  }

  async resolveIncident(
    incidentId: string,
    dto: ResolveIncidentDto
  ): Promise<{ incident: Incident; alert: Alert }> {
    const incidentDocument = await this.findByIdOrThrow(incidentId);

    incidentDocument.status = IncidentStatus.RESOLVED;
    incidentDocument.resolvedAt = dto.resolvedAt ? new Date(dto.resolvedAt) : new Date();
    await incidentDocument.save();

    const incident = mapIncidentDocument(incidentDocument);
    const alert = await this.alertsService.createResolutionAlert(incident, dto);

    return { incident, alert };
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
