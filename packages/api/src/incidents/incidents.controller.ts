import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  CreateIncidentDto,
  CreateUpdateAlertDto,
  ResolveIncidentDto,
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
import { IncidentsService } from './incidents.service';
import {
  alertSchema,
  createAlertBaseDtoSchema,
  createIncidentDtoSchema,
  incidentAndAlertResultSchema,
  incidentSchema,
  resolveIncidentDtoSchema
} from '../swagger/schemas';

@Controller('incidents')
@ApiTags('incidents')
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create an incident and its first incident alert' })
  @ApiBody({ schema: createIncidentDtoSchema })
  @ApiCreatedResponse({ schema: incidentAndAlertResultSchema })
  createIncident(@Body() dto: CreateIncidentDto): { incident: Incident; alert: Alert } {
    return this.incidentsService.createIncident(dto);
  }

  @Post(':id/alerts')
  @ApiOperation({ summary: 'Add an update alert to an incident timeline' })
  @ApiParam({ name: 'id', description: 'Incident id' })
  @ApiBody({ schema: createAlertBaseDtoSchema })
  @ApiCreatedResponse({ schema: alertSchema })
  addUpdate(@Param('id') id: string, @Body() dto: CreateUpdateAlertDto): Alert {
    return this.incidentsService.addIncidentUpdate(id, dto);
  }

  @Post(':id/resolve')
  @ApiOperation({ summary: 'Resolve an incident and create a resolution alert' })
  @ApiParam({ name: 'id', description: 'Incident id' })
  @ApiBody({ schema: resolveIncidentDtoSchema })
  @ApiOkResponse({ schema: incidentAndAlertResultSchema })
  resolveIncident(@Param('id') id: string, @Body() dto: ResolveIncidentDto): {
    incident: Incident;
    alert: Alert;
  } {
    return this.incidentsService.resolveIncident(id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get incident by id' })
  @ApiParam({ name: 'id', description: 'Incident id' })
  @ApiOkResponse({ schema: incidentSchema })
  getIncident(@Param('id') id: string): Incident {
    return this.incidentsService.getIncidentById(id);
  }
}
