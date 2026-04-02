import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  ActiveAlert,
  ConvertAlertToIncidentDto,
  CreateAlertDto,
  CreateScheduledAlertDto,
  ResolveAlertDto,
  UpdateAlertDto,
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
  activeAlertSchema,
  alertSchema,
  convertAlertToIncidentDtoSchema,
  convertAlertToIncidentResultSchema,
  createAlertDtoSchema,
  createAlertBaseDtoSchema,
  createScheduledAlertDtoSchema,
  incidentAndAlertResultSchema,
  resolveAlertDtoSchema,
  updateAlertDtoSchema
} from '../swagger/schemas';

@Controller('alerts')
@ApiTags('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get('active')
  @ApiOperation({ summary: 'Get active alerts with their timelines' })
  @ApiOkResponse({ schema: { type: 'array', items: activeAlertSchema } })
  getActiveAlerts(): Promise<ActiveAlert[]> {
    return this.alertsService.findActive();
  }

  @Post('incident')
  @ApiOperation({ summary: 'Create an active alert and its internal incident record' })
  @ApiBody({ schema: createAlertDtoSchema })
  @ApiCreatedResponse({ schema: incidentAndAlertResultSchema })
  createIncident(@Body() dto: CreateAlertDto): Promise<{ incident: Incident; alert: Alert }> {
    return this.alertsService.createIncident(dto);
  }

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

  @Post(':id/update')
  @ApiOperation({ summary: 'Create an update in an active alert timeline' })
  @ApiParam({ name: 'id', description: 'Active alert id' })
  @ApiBody({ schema: updateAlertDtoSchema })
  @ApiCreatedResponse({ schema: alertSchema })
  updateAlert(@Param('id') id: string, @Body() dto: UpdateAlertDto): Promise<Alert> {
    return this.alertsService.updateActiveAlert(id, dto);
  }

  @Post(':id/resolve')
  @ApiOperation({ summary: 'Resolve an active alert and create a resolution alert' })
  @ApiParam({ name: 'id', description: 'Active alert id' })
  @ApiBody({ schema: resolveAlertDtoSchema })
  @ApiOkResponse({ schema: incidentAndAlertResultSchema })
  resolveAlert(@Param('id') id: string, @Body() dto: ResolveAlertDto): Promise<{
    incident: Incident;
    alert: Alert;
  }> {
    return this.alertsService.resolveActiveAlert(id, dto);
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
