import { ArrayNotEmpty, IsArray, IsEnum, IsISO8601, IsOptional, IsString } from 'class-validator';
import { AlertStream } from '../enums';

export class CreateIncidentDto {
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

export class ResolveIncidentDto {
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
