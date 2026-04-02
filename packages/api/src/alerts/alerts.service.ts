import { Injectable, NotFoundException } from '@nestjs/common';
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
import { randomUUID } from 'node:crypto';
import { alertingStore } from '../alerting.store';

@Injectable()
export class AlertsService {
  findAll(): Alert[] {
    return alertingStore.alerts;
  }

  createWarning(dto: CreateWarningAlertDto): Alert {
    return this.createAlertRecord({
      type: AlertType.WARNING,
      title: dto.title,
      message: dto.message,
      streams: dto.streams,
      publishDate: dto.publishDate
    });
  }

  createScheduled(dto: CreateScheduledAlertDto): Alert {
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

  createIncidentAlert(incidentId: string, dto: CreateIncidentAlertDto): Alert {
    return this.createAlertRecord({
      type: AlertType.INCIDENT,
      incidentId,
      title: dto.title,
      message: dto.message,
      streams: dto.streams,
      publishDate: dto.publishDate
    });
  }

  createUpdateAlert(incidentId: string, dto: CreateUpdateAlertDto): Alert {
    return this.createAlertRecord({
      type: AlertType.UPDATE,
      incidentId,
      title: dto.title,
      message: dto.message,
      streams: dto.streams,
      publishDate: dto.publishDate
    });
  }

  createResolutionAlert(incident: Incident, dto: ResolveIncidentDto): Alert {
    return this.createAlertRecord({
      type: AlertType.RESOLUTION,
      incidentId: incident._id,
      title: `${incident.title} resolved`,
      message: dto.message,
      streams: incident.streams,
      publishDate: dto.publishDate
    });
  }

  convertAlertToIncident(alertId: string, dto: ConvertAlertToIncidentDto): {
    incident: Incident;
    alert: Alert;
    sourceAlert: Alert;
  } {
    const sourceAlert = alertingStore.alerts.find((alert) => alert._id === alertId);

    if (!sourceAlert) {
      throw new NotFoundException(`Alert with id ${alertId} was not found.`);
    }

    const incident: Incident = {
      _id: randomUUID(),
      title: dto.title,
      impact: dto.impact,
      streams: dto.streams,
      status: IncidentStatus.ACTIVE,
      createdAt: new Date()
    };

    alertingStore.incidents.push(incident);

    const alert = this.createAlertRecord({
      type: AlertType.INCIDENT,
      incidentId: incident._id,
      title: dto.incidentAlertTitle ?? dto.title,
      message: dto.incidentAlertMessage,
      streams: dto.streams,
      publishDate: dto.publishDate
    });

    sourceAlert.linkedIncidentId = incident._id;
    sourceAlert.updatedAt = new Date();

    return { incident, alert, sourceAlert };
  }

  private createAlertRecord(input: {
    type: AlertType;
    title: string;
    streams: AlertStream[];
    message?: string;
    incidentId?: string;
    linkedIncidentId?: string;
    publishDate?: string;
    scheduledStart?: string;
    scheduledEnd?: string;
  }): Alert {
    const alert: Alert = {
      _id: randomUUID(),
      type: input.type,
      incidentId: input.incidentId,
      linkedIncidentId: input.linkedIncidentId,
      title: input.title,
      message: input.message,
      streams: input.streams,
      publishDate: input.publishDate ? new Date(input.publishDate) : new Date(),
      scheduledStart: input.scheduledStart ? new Date(input.scheduledStart) : undefined,
      scheduledEnd: input.scheduledEnd ? new Date(input.scheduledEnd) : undefined
    };

    alertingStore.alerts.push(alert);
    return alert;
  }
}
