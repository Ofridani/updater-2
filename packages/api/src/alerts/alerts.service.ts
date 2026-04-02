import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  AlertStream,
  AlertType,
  ConvertAlertToIncidentDto,
  CreateIncidentAlertDto,
  CreateScheduledAlertDto,
  CreateUpdateAlertDto,
  CreateWarningAlertDto,
  Incident,
  IncidentStatus,
  ResolveIncidentDto,
  type Alert
} from 'common';
import { isValidObjectId, Model } from 'mongoose';
import { mapAlertDocument, mapIncidentDocument } from '../database/mappers';
import { AlertDocument, AlertEntity } from '../database/schemas/alert.schema';
import { IncidentDocument, IncidentEntity } from '../database/schemas/incident.schema';

@Injectable()
export class AlertsService {
  constructor(
    @InjectModel(AlertEntity.name)
    private readonly alertModel: Model<AlertEntity>,
    @InjectModel(IncidentEntity.name)
    private readonly incidentModel: Model<IncidentEntity>
  ) {}

  async findAll(): Promise<Alert[]> {
    const alerts = await this.alertModel.find().sort({ publishDate: -1 }).exec();
    return alerts.map((alert) => mapAlertDocument(alert as AlertDocument));
  }

  async createWarning(dto: CreateWarningAlertDto): Promise<Alert> {
    return this.createAlertRecord({
      type: AlertType.WARNING,
      title: dto.title,
      message: dto.message,
      streams: dto.streams,
      publishDate: dto.publishDate
    });
  }

  async createScheduled(dto: CreateScheduledAlertDto): Promise<Alert> {
    return this.createAlertRecord({
      type: AlertType.SCHEDULED,
      title: dto.title,
      message: dto.message,
      streams: dto.streams,
      publishDate: dto.publishDate,
      scheduledStart: dto.scheduledStart,
      scheduledEnd: dto.scheduledEnd
    });
  }

  async createIncidentAlert(incidentId: string, dto: CreateIncidentAlertDto): Promise<Alert> {
    return this.createAlertRecord({
      type: AlertType.INCIDENT,
      incidentId,
      title: dto.title,
      message: dto.message,
      streams: dto.streams,
      publishDate: dto.publishDate
    });
  }

  async createUpdateAlert(incidentId: string, dto: CreateUpdateAlertDto): Promise<Alert> {
    return this.createAlertRecord({
      type: AlertType.UPDATE,
      incidentId,
      title: dto.title,
      message: dto.message,
      streams: dto.streams,
      publishDate: dto.publishDate
    });
  }

  async createResolutionAlert(incident: Incident, dto: ResolveIncidentDto): Promise<Alert> {
    return this.createAlertRecord({
      type: AlertType.RESOLUTION,
      incidentId: incident._id,
      title: `${incident.title} resolved`,
      message: dto.message,
      streams: incident.streams,
      publishDate: dto.publishDate
    });
  }

  async convertAlertToIncident(
    alertId: string,
    dto: ConvertAlertToIncidentDto
  ): Promise<{
    incident: Incident;
    alert: Alert;
    sourceAlert: Alert;
  }> {
    if (!isValidObjectId(alertId)) {
      throw new NotFoundException(`Alert with id ${alertId} was not found.`);
    }

    const sourceAlert = await this.alertModel.findById(alertId).exec();

    if (!sourceAlert) {
      throw new NotFoundException(`Alert with id ${alertId} was not found.`);
    }

    const incidentDocument = (await this.incidentModel.create({
      title: dto.title,
      impact: dto.impact,
      streams: dto.streams,
      status: IncidentStatus.ACTIVE
    })) as IncidentDocument;

    const alert = await this.createAlertRecord({
      type: AlertType.INCIDENT,
      incidentId: incidentDocument._id.toString(),
      title: dto.incidentAlertTitle ?? dto.title,
      message: dto.incidentAlertMessage,
      streams: dto.streams,
      publishDate: dto.publishDate
    });

    sourceAlert.linkedIncidentId = incidentDocument._id;
    await sourceAlert.save();

    return {
      incident: mapIncidentDocument(incidentDocument),
      alert,
      sourceAlert: mapAlertDocument(sourceAlert as AlertDocument)
    };
  }

  private async createAlertRecord(input: {
    type: AlertType;
    title: string;
    streams: AlertStream[];
    message?: string;
    incidentId?: string;
    linkedIncidentId?: string;
    publishDate?: string;
    scheduledStart?: string;
    scheduledEnd?: string;
  }): Promise<Alert> {
    const alertDocument = (await this.alertModel.create({
      type: input.type,
      incidentId: input.incidentId,
      linkedIncidentId: input.linkedIncidentId,
      title: input.title,
      message: input.message,
      streams: input.streams,
      publishDate: input.publishDate ? new Date(input.publishDate) : new Date(),
      scheduledStart: input.scheduledStart ? new Date(input.scheduledStart) : undefined,
      scheduledEnd: input.scheduledEnd ? new Date(input.scheduledEnd) : undefined
    })) as AlertDocument;

    return mapAlertDocument(alertDocument);
  }
}
