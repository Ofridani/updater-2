import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  ActiveAlert,
  AlertStream,
  AlertType,
  ConvertAlertToIncidentDto,
  CreateAlertDto,
  CreateIncidentAlertDto,
  CreateScheduledAlertDto,
  CreateUpdateAlertDto,
  ResolveAlertDto,
  CreateWarningAlertDto,
  Incident,
  IncidentStatus,
  UpdateAlertDto,
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

  async findActive(): Promise<ActiveAlert[]> {
    const incidentDocuments = (await this.incidentModel
      .find({ status: IncidentStatus.ACTIVE })
      .sort({ createdAt: -1 })
      .exec()) as IncidentDocument[];

    if (incidentDocuments.length === 0) {
      return [];
    }

    const incidentIds = incidentDocuments.map((incident) => incident._id);
    const alertDocuments = (await this.alertModel
      .find({ incidentId: { $in: incidentIds } })
      .sort({ publishDate: -1 })
      .exec()) as AlertDocument[];

    const alertsByIncidentId = new Map<string, Alert[]>();

    for (const alertDocument of alertDocuments) {
      const incidentId = alertDocument.incidentId?.toString();

      if (!incidentId) {
        continue;
      }

      const incidentAlerts = alertsByIncidentId.get(incidentId);
      const alert = mapAlertDocument(alertDocument);

      if (incidentAlerts) {
        incidentAlerts.push(alert);
        continue;
      }

      alertsByIncidentId.set(incidentId, [alert]);
    }

    return incidentDocuments.map((incidentDocument) => {
      const incidentId = incidentDocument._id.toString();

      return {
        id: incidentId,
        title: incidentDocument.title,
        impact: incidentDocument.impact,
        streams: incidentDocument.streams,
        createdAt: incidentDocument.createdAt,
        alerts: alertsByIncidentId.get(incidentId) ?? []
      };
    });
  }

  async createIncident(dto: CreateAlertDto): Promise<{ incident: Incident; alert: Alert }> {
    const incidentDocument = await this.createIncidentRecord(dto);
    const incident = mapIncidentDocument(incidentDocument);
    const alert = await this.createIncidentAlert(incident._id, {
      title: dto.title,
      message: dto.message,
      streams: dto.streams,
      publishDate: dto.publishDate
    });

    return { incident, alert };
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

  async updateActiveAlert(alertId: string, dto: UpdateAlertDto): Promise<Alert> {
    const incident = await this.findActiveIncidentByIdOrThrow(alertId);

    return this.createUpdateAlert(incident._id.toString(), {
      title: dto.title,
      message: dto.message,
      streams: incident.streams,
      publishDate: dto.publishDate
    });
  }

  async createResolutionAlert(incident: Incident, dto: ResolveAlertDto): Promise<Alert> {
    return this.createAlertRecord({
      type: AlertType.RESOLUTION,
      incidentId: incident._id,
      title: `${incident.title} resolved`,
      message: dto.message,
      streams: incident.streams,
      publishDate: dto.publishDate
    });
  }

  async resolveActiveAlert(
    alertId: string,
    dto: ResolveAlertDto
  ): Promise<{ incident: Incident; alert: Alert }> {
    const incidentDocument = await this.findActiveIncidentByIdOrThrow(alertId);

    incidentDocument.status = IncidentStatus.RESOLVED;
    incidentDocument.resolvedAt = dto.resolvedAt ? new Date(dto.resolvedAt) : new Date();
    await incidentDocument.save();

    const incident = mapIncidentDocument(incidentDocument);
    const alert = await this.createResolutionAlert(incident, dto);

    return { incident, alert };
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

    const incidentDocument = await this.createIncidentRecord({
      title: dto.title,
      impact: dto.impact,
      streams: dto.streams
    });

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

  private async createIncidentRecord(input: {
    title: string;
    impact: string;
    streams: AlertStream[];
  }): Promise<IncidentDocument> {
    return (await this.incidentModel.create({
      title: input.title,
      impact: input.impact,
      streams: input.streams,
      status: IncidentStatus.ACTIVE
    })) as IncidentDocument;
  }

  private async findActiveIncidentByIdOrThrow(alertId: string): Promise<IncidentDocument> {
    const incidentDocument = await this.findIncidentByIdOrThrow(alertId);

    if (incidentDocument.status !== IncidentStatus.ACTIVE) {
      throw new ConflictException(`Alert with id ${alertId} is no longer active.`);
    }

    return incidentDocument;
  }

  private async findIncidentByIdOrThrow(incidentId: string): Promise<IncidentDocument> {
    if (!isValidObjectId(incidentId)) {
      throw new NotFoundException(`Alert with id ${incidentId} was not found.`);
    }

    const incidentDocument = await this.incidentModel.findById(incidentId).exec();

    if (!incidentDocument) {
      throw new NotFoundException(`Alert with id ${incidentId} was not found.`);
    }

    return incidentDocument as IncidentDocument;
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
