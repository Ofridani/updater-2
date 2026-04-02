import { AlertStream, AlertType, IncidentStatus } from 'common';

const objectIdSchema = {
  type: 'string',
  description: 'MongoDB ObjectId represented as a string',
  example: '67f2f49d8a5ce7e8cf8f7f21'
};

export const incidentSchema = {
  type: 'object',
  required: ['_id', 'title', 'impact', 'streams', 'status', 'createdAt'],
  properties: {
    _id: objectIdSchema,
    title: { type: 'string', example: 'Data ingestion latency in Water stream' },
    impact: { type: 'string', example: 'Customers may observe delayed updates for 5-10 minutes.' },
    streams: {
      type: 'array',
      items: { type: 'string', enum: Object.values(AlertStream) },
      example: [AlertStream.WATER]
    },
    status: { type: 'string', enum: Object.values(IncidentStatus), example: IncidentStatus.ACTIVE },
    createdAt: { type: 'string', format: 'date-time' },
    resolvedAt: { type: 'string', format: 'date-time', nullable: true }
  }
};

export const alertSchema = {
  type: 'object',
  required: ['_id', 'type', 'title', 'streams', 'publishDate'],
  properties: {
    _id: objectIdSchema,
    type: { type: 'string', enum: Object.values(AlertType), example: AlertType.INCIDENT },
    incidentId: { ...objectIdSchema, nullable: true },
    linkedIncidentId: { ...objectIdSchema, nullable: true },
    title: { type: 'string', example: 'Water stream incident started' },
    message: { type: 'string', nullable: true },
    streams: {
      type: 'array',
      items: { type: 'string', enum: Object.values(AlertStream) },
      example: [AlertStream.WATER]
    },
    publishDate: { type: 'string', format: 'date-time' },
    scheduledStart: { type: 'string', format: 'date-time', nullable: true },
    scheduledEnd: { type: 'string', format: 'date-time', nullable: true },
    updatedAt: { type: 'string', format: 'date-time', nullable: true }
  }
};

export const createIncidentDtoSchema = {
  type: 'object',
  required: ['title', 'impact', 'streams'],
  properties: {
    title: { type: 'string' },
    impact: { type: 'string' },
    streams: {
      type: 'array',
      items: { type: 'string', enum: Object.values(AlertStream) }
    },
    message: { type: 'string', nullable: true },
    publishDate: { type: 'string', format: 'date-time', nullable: true }
  }
};

export const resolveIncidentDtoSchema = {
  type: 'object',
  properties: {
    message: { type: 'string', nullable: true },
    publishDate: { type: 'string', format: 'date-time', nullable: true },
    resolvedAt: { type: 'string', format: 'date-time', nullable: true }
  }
};

export const createAlertBaseDtoSchema = {
  type: 'object',
  required: ['title', 'streams'],
  properties: {
    title: { type: 'string' },
    message: { type: 'string', nullable: true },
    streams: {
      type: 'array',
      items: { type: 'string', enum: Object.values(AlertStream) }
    },
    publishDate: { type: 'string', format: 'date-time', nullable: true }
  }
};

export const createScheduledAlertDtoSchema = {
  type: 'object',
  required: ['title', 'streams', 'scheduledStart', 'scheduledEnd'],
  properties: {
    ...createAlertBaseDtoSchema.properties,
    scheduledStart: { type: 'string', format: 'date-time' },
    scheduledEnd: { type: 'string', format: 'date-time' }
  }
};

export const convertAlertToIncidentDtoSchema = {
  type: 'object',
  required: ['title', 'impact', 'streams'],
  properties: {
    title: { type: 'string' },
    impact: { type: 'string' },
    streams: {
      type: 'array',
      items: { type: 'string', enum: Object.values(AlertStream) }
    },
    incidentAlertTitle: { type: 'string', nullable: true },
    incidentAlertMessage: { type: 'string', nullable: true },
    publishDate: { type: 'string', format: 'date-time', nullable: true }
  }
};

export const incidentAndAlertResultSchema = {
  type: 'object',
  required: ['incident', 'alert'],
  properties: {
    incident: incidentSchema,
    alert: alertSchema
  }
};

export const convertAlertToIncidentResultSchema = {
  type: 'object',
  required: ['incident', 'alert', 'sourceAlert'],
  properties: {
    incident: incidentSchema,
    alert: alertSchema,
    sourceAlert: alertSchema
  }
};
