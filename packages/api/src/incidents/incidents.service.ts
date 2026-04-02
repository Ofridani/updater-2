import { Injectable, NotFoundException } from '@nestjs/common';
import {
  CreateIncidentDto,
  CreateUpdateAlertDto,
  Incident,
  IncidentStatus,
  type Alert,
  ResolveIncidentDto
} from 'common';
import { randomUUID } from 'node:crypto';
import { alertingStore } from '../alerting.store';
import { AlertsService } from '../alerts/alerts.service';

@Injectable()
export class IncidentsService {
  constructor(private readonly alertsService: AlertsService) {}

  createIncident(dto: CreateIncidentDto): { incident: Incident; alert: Alert } {
    const incident: Incident = {
      _id: randomUUID(),
      title: dto.title,
      impact: dto.impact,
      streams: dto.streams,
      status: IncidentStatus.ACTIVE,
      createdAt: new Date()
    };

    alertingStore.incidents.push(incident);

    const alert = this.alertsService.createIncidentAlert(incident._id, {
      title: dto.title,
      message: dto.message,
      streams: dto.streams,
      publishDate: dto.publishDate
    });

    return { incident, alert };
  }

  addIncidentUpdate(incidentId: string, dto: CreateUpdateAlertDto): Alert {
    this.findByIdOrThrow(incidentId);
    return this.alertsService.createUpdateAlert(incidentId, dto);
  }

  resolveIncident(incidentId: string, dto: ResolveIncidentDto): { incident: Incident; alert: Alert } {
    const incident = this.findByIdOrThrow(incidentId);

    incident.status = IncidentStatus.RESOLVED;
    incident.resolvedAt = dto.resolvedAt ? new Date(dto.resolvedAt) : new Date();

    const alert = this.alertsService.createResolutionAlert(incident, dto);

    return { incident, alert };
  }

  getIncidentById(incidentId: string): Incident {
    return this.findByIdOrThrow(incidentId);
  }

  private findByIdOrThrow(incidentId: string): Incident {
    const incident = alertingStore.incidents.find((item) => item._id === incidentId);

    if (!incident) {
      throw new NotFoundException(`Incident with id ${incidentId} was not found.`);
    }

    return incident;
  }
}
