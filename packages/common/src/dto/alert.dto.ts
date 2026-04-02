import { ArrayNotEmpty, IsArray, IsEnum, IsISO8601, IsOptional, IsString } from 'class-validator';
import { AlertStream } from '../enums';

export class CreateAlertDto {
  @IsString()
  title!: string;

  @IsString()
  impact!: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(AlertStream, { each: true })
  streams!: AlertStream[];

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsISO8601()
  publishDate?: string;
}

export class CreateIncidentAlertDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(AlertStream, { each: true })
  streams!: AlertStream[];

  @IsOptional()
  @IsISO8601()
  publishDate?: string;
}

export class CreateUpdateAlertDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(AlertStream, { each: true })
  streams!: AlertStream[];

  @IsOptional()
  @IsISO8601()
  publishDate?: string;
}

export class UpdateAlertDto extends CreateUpdateAlertDto {}

export class CreateWarningAlertDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(AlertStream, { each: true })
  streams!: AlertStream[];

  @IsOptional()
  @IsISO8601()
  publishDate?: string;
}

export class CreateScheduledAlertDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(AlertStream, { each: true })
  streams!: AlertStream[];

  @IsOptional()
  @IsISO8601()
  publishDate?: string;

  @IsISO8601()
  scheduledStart!: string;

  @IsISO8601()
  scheduledEnd!: string;
}

export class ConvertAlertToIncidentDto {
  @IsString()
  title!: string;

  @IsString()
  impact!: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(AlertStream, { each: true })
  streams!: AlertStream[];

  @IsOptional()
  @IsString()
  incidentAlertTitle?: string;

  @IsOptional()
  @IsString()
  incidentAlertMessage?: string;

  @IsOptional()
  @IsISO8601()
  publishDate?: string;
}

export class ResolveAlertDto {
  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsISO8601()
  publishDate?: string;

  @IsOptional()
  @IsISO8601()
  resolvedAt?: string;
}
