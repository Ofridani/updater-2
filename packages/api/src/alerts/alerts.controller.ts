import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  ConvertAlertToIncidentDto,
  CreateScheduledAlertDto,
  CreateWarningAlertDto,
  type Alert,
  type Incident
} from 'common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags
} from '@nestjs/swagger';
import { AlertsService } from './alerts.service';
import {
  alertSchema,
  convertAlertToIncidentDtoSchema,
  convertAlertToIncidentResultSchema,
  createAlertBaseDtoSchema,
  createScheduledAlertDtoSchema
} from '../swagger/schemas';

@Controller('alerts')
@ApiTags('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Post('warning')
  @ApiOperation({ summary: 'Create a warning alert' })
  @ApiBody({ schema: createAlertBaseDtoSchema })
  @ApiCreatedResponse({ schema: alertSchema })
  createWarning(@Body() dto: CreateWarningAlertDto): Promise<Alert> {
    return this.alertsService.createWarning(dto);
  }

  @Post('scheduled')
  @ApiOperation({ summary: 'Create a scheduled alert' })
  @ApiBody({ schema: createScheduledAlertDtoSchema })
  @ApiCreatedResponse({ schema: alertSchema })
  createScheduled(@Body() dto: CreateScheduledAlertDto): Promise<Alert> {
    return this.alertsService.createScheduled(dto);
  }

  @Post(':id/convert-to-incident')
  @ApiOperation({ summary: 'Convert warning/scheduled alert into an active incident' })
  @ApiParam({ name: 'id', description: 'Alert id to convert' })
  @ApiBody({ schema: convertAlertToIncidentDtoSchema })
  @ApiCreatedResponse({ schema: convertAlertToIncidentResultSchema })
  convertToIncident(@Param('id') id: string, @Body() dto: ConvertAlertToIncidentDto): Promise<{
    incident: Incident;
    alert: Alert;
    sourceAlert: Alert;
  }> {
    return this.alertsService.convertAlertToIncident(id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all alerts' })
  @ApiOkResponse({ schema: { type: 'array', items: alertSchema } })
  getAlerts(): Promise<Alert[]> {
    return this.alertsService.findAll();
  }
}
