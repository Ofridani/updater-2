import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AlertStream, IncidentStatus } from 'common';
import { HydratedDocument } from 'mongoose';

@Schema({
  collection: 'incidents',
  timestamps: { createdAt: 'createdAt', updatedAt: false }
})
export class IncidentEntity {
  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  impact!: string;

  @Prop({
    type: [String],
    enum: Object.values(AlertStream),
    required: true
  })
  streams!: AlertStream[];

  @Prop({
    type: String,
    enum: Object.values(IncidentStatus),
    default: IncidentStatus.ACTIVE,
    required: true
  })
  status!: IncidentStatus;

  @Prop({ type: Date })
  resolvedAt?: Date;

  createdAt!: Date;
}

export type IncidentDocument = HydratedDocument<IncidentEntity>;

export const IncidentSchema = SchemaFactory.createForClass(IncidentEntity);
