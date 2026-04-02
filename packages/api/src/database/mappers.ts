import type { Alert, Incident } from 'common';
import { Types } from 'mongoose';
import type { AlertDocument } from './schemas/alert.schema';
import type { IncidentDocument } from './schemas/incident.schema';

function toIdString(value?: Types.ObjectId | string | null): string | undefined {
  if (!value) {
    return undefined;
  }

  return typeof value === 'string' ? value : value.toString();
}

export function mapIncidentDocument(document: IncidentDocument): Incident {
  return {
    _id: document._id.toString(),
    title: document.title,
    impact: document.impact,
    streams: document.streams,
    status: document.status,
    createdAt: document.createdAt,
    resolvedAt: document.resolvedAt ?? undefined
  };
}

export function mapAlertDocument(document: AlertDocument): Alert {
  return {
    _id: document._id.toString(),
    type: document.type,
    incidentId: toIdString(document.incidentId),
    linkedIncidentId: toIdString(document.linkedIncidentId),
    title: document.title,
    message: document.message ?? undefined,
    streams: document.streams,
    publishDate: document.publishDate,
    scheduledStart: document.scheduledStart ?? undefined,
    scheduledEnd: document.scheduledEnd ?? undefined,
    updatedAt: document.updatedAt ?? undefined
  };
}
