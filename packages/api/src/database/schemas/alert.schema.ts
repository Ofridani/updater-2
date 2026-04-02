import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AlertStream, AlertType } from 'common';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { IncidentEntity } from './incident.schema';

@Schema({
  collection: 'alerts',
  timestamps: { createdAt: false, updatedAt: 'updatedAt' }
})
export class AlertEntity {
  @Prop({
    type: String,
    enum: Object.values(AlertType),
    required: true
  })
  type!: AlertType;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: IncidentEntity.name })
  incidentId?: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: IncidentEntity.name })
  linkedIncidentId?: Types.ObjectId;

  @Prop({ required: true })
  title!: string;

  @Prop()
  message?: string;

  @Prop({
    type: [String],
    enum: Object.values(AlertStream),
    required: true
  })
  streams!: AlertStream[];

  @Prop({ type: Date, default: Date.now, required: true })
  publishDate!: Date;

  @Prop({ type: Date })
  scheduledStart?: Date;

  @Prop({ type: Date })
  scheduledEnd?: Date;

  updatedAt?: Date;
}

export type AlertDocument = HydratedDocument<AlertEntity>;

export const AlertSchema = SchemaFactory.createForClass(AlertEntity);
