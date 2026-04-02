import { AlertStream, AlertType, IncidentStatus } from '../enums';

export type ObjectId = string;

export interface Incident {
  _id: ObjectId;
  title: string;
  impact: string;
  streams: AlertStream[];
  status: IncidentStatus;
  createdAt: Date;
  resolvedAt?: Date;
}

export interface Alert {
  _id: ObjectId;
  type: AlertType;
  incidentId?: ObjectId;
  linkedIncidentId?: ObjectId;
  title: string;
  message?: string;
  streams: AlertStream[];
  publishDate: Date;
  scheduledStart?: Date;
  scheduledEnd?: Date;
  updatedAt?: Date;
}
