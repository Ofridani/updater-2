import { startTransition, useEffect, useState } from 'react';
import {
  Alert as MantineAlert,
  Badge,
  Button,
  Card,
  Checkbox,
  Container,
  Divider,
  Grid,
  Group,
  NativeSelect,
  Paper,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title
} from '@mantine/core';
import { Controller, useForm } from 'react-hook-form';
import type { ActiveAlert, Alert, AlertStream } from 'common';
import './app.css';

type ComposerMode = 'incident' | 'warning' | 'scheduled';

type FeedbackState =
  | {
      tone: 'success' | 'error';
      message: string;
    }
  | null;

type IncidentFormValues = {
  title: string;
  impact: string;
  streams: AlertStream[];
  message: string;
  publishDate: string;
};

type WarningFormValues = {
  title: string;
  streams: AlertStream[];
  message: string;
  publishDate: string;
};

type ScheduledFormValues = {
  title: string;
  streams: AlertStream[];
  message: string;
  publishDate: string;
  scheduledStart: string;
  scheduledEnd: string;
};

type UpdateFormValues = {
  title: string;
  message: string;
  publishDate: string;
};

type ResolveFormValues = {
  message: string;
  publishDate: string;
  resolvedAt: string;
};

type ActiveAlertSelectionValues = {
  activeAlertId: string;
};

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

const alertStreams = [
  'earth' as AlertStream,
  'water' as AlertStream,
  'fire' as AlertStream,
  'air' as AlertStream
];

const alertTypeCopy: Record<Alert['type'], string> = {
  incident: 'Incident',
  update: 'Update',
  resolution: 'Resolution',
  warning: 'Warning',
  scheduled: 'Scheduled'
};

const alertTypeColor: Record<Alert['type'], string> = {
  incident: 'red',
  update: 'blue',
  resolution: 'green',
  warning: 'orange',
  scheduled: 'violet'
};

function toApiDate(value: string): string | undefined {
  if (!value) {
    return undefined;
  }

  return new Date(value).toISOString();
}

function formatDateTime(value?: Date | string): string {
  if (!value) {
    return 'Not scheduled';
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

function formatStream(stream: AlertStream): string {
  return stream.charAt(0).toUpperCase() + stream.slice(1);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {})
    },
    ...init
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);

    if (Array.isArray(errorBody?.message)) {
      throw new Error(errorBody.message.join(', '));
    }

    if (typeof errorBody?.message === 'string') {
      throw new Error(errorBody.message);
    }

    throw new Error(`Request failed with status ${response.status}.`);
  }

  return (await response.json()) as T;
}

export default function App() {
  const [mode, setMode] = useState<ComposerMode>('incident');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<ActiveAlert[]>([]);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
  const [isRefreshingDashboard, setIsRefreshingDashboard] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [composerFeedback, setComposerFeedback] = useState<FeedbackState>(null);
  const [manageFeedback, setManageFeedback] = useState<FeedbackState>(null);

  const activeAlertSelectionForm = useForm<ActiveAlertSelectionValues>({
    defaultValues: {
      activeAlertId: ''
    }
  });

  const incidentForm = useForm<IncidentFormValues>({
    defaultValues: {
      title: '',
      impact: '',
      streams: [],
      message: '',
      publishDate: ''
    }
  });

  const warningForm = useForm<WarningFormValues>({
    defaultValues: {
      title: '',
      streams: [],
      message: '',
      publishDate: ''
    }
  });

  const scheduledForm = useForm<ScheduledFormValues>({
    defaultValues: {
      title: '',
      streams: [],
      message: '',
      publishDate: '',
      scheduledStart: '',
      scheduledEnd: ''
    }
  });

  const updateForm = useForm<UpdateFormValues>({
    defaultValues: {
      title: '',
      message: '',
      publishDate: ''
    }
  });

  const resolveForm = useForm<ResolveFormValues>({
    defaultValues: {
      message: '',
      publishDate: '',
      resolvedAt: ''
    }
  });

  const selectedActiveAlertId = activeAlertSelectionForm.watch('activeAlertId');
  const scheduledStartValue = scheduledForm.watch('scheduledStart');

  const selectedActiveAlert =
    activeAlerts.find((activeAlert) => activeAlert.id === selectedActiveAlertId) ?? null;

  async function refreshDashboard(options?: { initial?: boolean }) {
    const initialLoad = options?.initial ?? false;

    if (initialLoad) {
      setIsLoadingDashboard(true);
    } else {
      setIsRefreshingDashboard(true);
    }

    try {
      const [nextAlerts, nextActiveAlerts] = await Promise.all([
        apiRequest<Alert[]>('/alerts'),
        apiRequest<ActiveAlert[]>('/alerts/active')
      ]);

      const currentSelection = activeAlertSelectionForm.getValues('activeAlertId');
      const nextSelection = nextActiveAlerts.some((activeAlert) => activeAlert.id === currentSelection)
        ? currentSelection
        : (nextActiveAlerts[0]?.id ?? '');

      startTransition(() => {
        setAlerts(nextAlerts);
        setActiveAlerts(nextActiveAlerts);
      });

      activeAlertSelectionForm.setValue('activeAlertId', nextSelection);
      setDashboardError(null);
    } catch (error) {
      setDashboardError(getErrorMessage(error));
    } finally {
      setIsLoadingDashboard(false);
      setIsRefreshingDashboard(false);
    }
  }

  useEffect(() => {
    void refreshDashboard({ initial: true });
  }, []);

  async function handleCreateIncident(values: IncidentFormValues) {
    setComposerFeedback(null);

    try {
      await apiRequest('/alerts/incident', {
        method: 'POST',
        body: JSON.stringify({
          title: values.title,
          impact: values.impact,
          streams: values.streams,
          message: values.message || undefined,
          publishDate: toApiDate(values.publishDate)
        })
      });

      incidentForm.reset();
      await refreshDashboard();
      setComposerFeedback({
        tone: 'success',
        message: 'Incident alert created.'
      });
    } catch (error) {
      setComposerFeedback({
        tone: 'error',
        message: getErrorMessage(error)
      });
    }
  }

  async function handleCreateWarning(values: WarningFormValues) {
    setComposerFeedback(null);

    try {
      await apiRequest('/alerts/warning', {
        method: 'POST',
        body: JSON.stringify({
          title: values.title,
          streams: values.streams,
          message: values.message || undefined,
          publishDate: toApiDate(values.publishDate)
        })
      });

      warningForm.reset();
      await refreshDashboard();
      setComposerFeedback({
        tone: 'success',
        message: 'Warning alert created.'
      });
    } catch (error) {
      setComposerFeedback({
        tone: 'error',
        message: getErrorMessage(error)
      });
    }
  }

  async function handleCreateScheduled(values: ScheduledFormValues) {
    setComposerFeedback(null);

    try {
      await apiRequest('/alerts/scheduled', {
        method: 'POST',
        body: JSON.stringify({
          title: values.title,
          streams: values.streams,
          message: values.message || undefined,
          publishDate: toApiDate(values.publishDate),
          scheduledStart: new Date(values.scheduledStart).toISOString(),
          scheduledEnd: new Date(values.scheduledEnd).toISOString()
        })
      });

      scheduledForm.reset();
      await refreshDashboard();
      setComposerFeedback({
        tone: 'success',
        message: 'Scheduled alert created.'
      });
    } catch (error) {
      setComposerFeedback({
        tone: 'error',
        message: getErrorMessage(error)
      });
    }
  }

  async function handleCreateUpdate(values: UpdateFormValues) {
    if (!selectedActiveAlertId) {
      setManageFeedback({
        tone: 'error',
        message: 'Select an active alert first.'
      });
      return;
    }

    setManageFeedback(null);

    try {
      await apiRequest(`/alerts/${selectedActiveAlertId}/update`, {
        method: 'POST',
        body: JSON.stringify({
          title: values.title,
          message: values.message || undefined,
          publishDate: toApiDate(values.publishDate)
        })
      });

      updateForm.reset();
      await refreshDashboard();
      setManageFeedback({
        tone: 'success',
        message: 'Alert update published.'
      });
    } catch (error) {
      setManageFeedback({
        tone: 'error',
        message: getErrorMessage(error)
      });
    }
  }

  async function handleResolveAlert(values: ResolveFormValues) {
    if (!selectedActiveAlertId) {
      setManageFeedback({
        tone: 'error',
        message: 'Select an active alert first.'
      });
      return;
    }

    setManageFeedback(null);

    try {
      await apiRequest(`/alerts/${selectedActiveAlertId}/resolve`, {
        method: 'POST',
        body: JSON.stringify({
          message: values.message || undefined,
          publishDate: toApiDate(values.publishDate),
          resolvedAt: toApiDate(values.resolvedAt)
        })
      });

      resolveForm.reset();
      await refreshDashboard();
      setManageFeedback({
        tone: 'success',
        message: 'Alert resolved.'
      });
    } catch (error) {
      setManageFeedback({
        tone: 'error',
        message: getErrorMessage(error)
      });
    }
  }

  const activeAlertOptions = activeAlerts.map((activeAlert) => ({
    value: activeAlert.id,
    label: `${activeAlert.title} (${activeAlert.streams.map(formatStream).join(', ')})`
  }));

  return (
    <div className="app-shell">
      <Container size="xl" py="xl">
        <Stack gap="xl">
          <Paper className="hero-card" radius="xl" p="xl">
            <Stack gap="md">
              <Group justify="space-between" align="flex-start" gap="lg">
                <div>
                  <Text className="eyebrow">Updater Zone</Text>
                  <Title order={1}>Create, update, warn, and resolve alerts from one place.</Title>
                  <Text c="dimmed" maw={720} mt="sm">
                    CSMs work in alerts, not internal incidents. Ongoing alerts stay manageable here
                    while the full alert feed shows what is already published system wide.
                  </Text>
                </div>

                <Group gap="sm">
                  <Badge size="lg" variant="light" color="red">
                    {activeAlerts.length} active
                  </Badge>
                  <Badge size="lg" variant="light" color="gray">
                    {alerts.length} total
                  </Badge>
                </Group>
              </Group>

              <Group gap="sm">
                <Button
                  variant="light"
                  onClick={() => {
                    void refreshDashboard();
                  }}
                  loading={isRefreshingDashboard}
                >
                  Refresh data
                </Button>
                <Text size="sm" c="dimmed">
                  API: {API_URL}
                </Text>
              </Group>
            </Stack>
          </Paper>

          {dashboardError ? (
            <MantineAlert color="red" title="Dashboard data could not be loaded">
              {dashboardError}
            </MantineAlert>
          ) : null}

          <Grid gutter="xl">
            <Grid.Col span={{ base: 12, lg: 7 }}>
              <Paper withBorder radius="xl" p="xl">
                <Stack gap="lg">
                  <div>
                    <Text className="section-label">Create alert</Text>
                    <Title order={2}>Publish a new alert</Title>
                    <Text c="dimmed" size="sm" mt={6}>
                      Choose the alert type and publish it right away. Incident alerts become
                      ongoing alerts you can manage from the panel on the right.
                    </Text>
                  </div>

                  <SegmentedControl
                    fullWidth
                    value={mode}
                    onChange={(value) => {
                      setMode(value as ComposerMode);
                      setComposerFeedback(null);
                    }}
                    data={[
                      { label: 'Incident', value: 'incident' },
                      { label: 'Warning', value: 'warning' },
                      { label: 'Scheduled', value: 'scheduled' }
                    ]}
                  />

                  {composerFeedback ? (
                    <MantineAlert color={composerFeedback.tone === 'success' ? 'green' : 'red'}>
                      {composerFeedback.message}
                    </MantineAlert>
                  ) : null}

                  {mode === 'incident' ? (
                    <form onSubmit={incidentForm.handleSubmit(handleCreateIncident)}>
                      <Stack gap="md">
                        <Controller
                          control={incidentForm.control}
                          name="title"
                          rules={{ required: 'Give the alert a title.' }}
                          render={({ field, fieldState }) => (
                            <TextInput
                              {...field}
                              label="Alert title"
                              placeholder="EARTH sync is failing for some customers"
                              error={fieldState.error?.message}
                            />
                          )}
                        />

                        <Controller
                          control={incidentForm.control}
                          name="impact"
                          rules={{ required: 'Describe the customer impact.' }}
                          render={({ field, fieldState }) => (
                            <Textarea
                              {...field}
                              label="Impact"
                              minRows={3}
                              placeholder="Users may see failed EARTH actions until the fix is deployed."
                              error={fieldState.error?.message}
                            />
                          )}
                        />

                        <Controller
                          control={incidentForm.control}
                          name="streams"
                          rules={{
                            validate: (value) =>
                              value.length > 0 || 'Pick at least one stream.'
                          }}
                          render={({ field, fieldState }) => (
                            <Checkbox.Group
                              label="Streams"
                              value={field.value}
                              onChange={field.onChange}
                              error={fieldState.error?.message}
                            >
                              <Group mt="xs">
                                {alertStreams.map((stream) => (
                                  <Checkbox
                                    key={stream}
                                    value={stream}
                                    label={formatStream(stream)}
                                  />
                                ))}
                              </Group>
                            </Checkbox.Group>
                          )}
                        />

                        <Controller
                          control={incidentForm.control}
                          name="message"
                          render={({ field }) => (
                            <Textarea
                              {...field}
                              label="Initial message"
                              minRows={4}
                              placeholder="We are investigating and will share another update soon."
                            />
                          )}
                        />

                        <Controller
                          control={incidentForm.control}
                          name="publishDate"
                          render={({ field }) => (
                            <TextInput
                              {...field}
                              type="datetime-local"
                              label="Publish date"
                              description="Leave empty to publish immediately."
                            />
                          )}
                        />

                        <Group justify="flex-end">
                          <Button type="submit" loading={incidentForm.formState.isSubmitting}>
                            Create incident alert
                          </Button>
                        </Group>
                      </Stack>
                    </form>
                  ) : null}

                  {mode === 'warning' ? (
                    <form onSubmit={warningForm.handleSubmit(handleCreateWarning)}>
                      <Stack gap="md">
                        <Controller
                          control={warningForm.control}
                          name="title"
                          rules={{ required: 'Give the alert a title.' }}
                          render={({ field, fieldState }) => (
                            <TextInput
                              {...field}
                              label="Alert title"
                              placeholder="Planned maintenance warning for WATER imports"
                              error={fieldState.error?.message}
                            />
                          )}
                        />

                        <Controller
                          control={warningForm.control}
                          name="streams"
                          rules={{
                            validate: (value) =>
                              value.length > 0 || 'Pick at least one stream.'
                          }}
                          render={({ field, fieldState }) => (
                            <Checkbox.Group
                              label="Streams"
                              value={field.value}
                              onChange={field.onChange}
                              error={fieldState.error?.message}
                            >
                              <Group mt="xs">
                                {alertStreams.map((stream) => (
                                  <Checkbox
                                    key={stream}
                                    value={stream}
                                    label={formatStream(stream)}
                                  />
                                ))}
                              </Group>
                            </Checkbox.Group>
                          )}
                        />

                        <Controller
                          control={warningForm.control}
                          name="message"
                          render={({ field }) => (
                            <Textarea
                              {...field}
                              label="Message"
                              minRows={4}
                              placeholder="Customers may notice brief slowness while we prepare the change."
                            />
                          )}
                        />

                        <Controller
                          control={warningForm.control}
                          name="publishDate"
                          render={({ field }) => (
                            <TextInput
                              {...field}
                              type="datetime-local"
                              label="Publish date"
                              description="Leave empty to publish immediately."
                            />
                          )}
                        />

                        <Group justify="flex-end">
                          <Button type="submit" loading={warningForm.formState.isSubmitting}>
                            Create warning alert
                          </Button>
                        </Group>
                      </Stack>
                    </form>
                  ) : null}

                  {mode === 'scheduled' ? (
                    <form onSubmit={scheduledForm.handleSubmit(handleCreateScheduled)}>
                      <Stack gap="md">
                        <Controller
                          control={scheduledForm.control}
                          name="title"
                          rules={{ required: 'Give the alert a title.' }}
                          render={({ field, fieldState }) => (
                            <TextInput
                              {...field}
                              label="Alert title"
                              placeholder="Scheduled FIRE rollout window"
                              error={fieldState.error?.message}
                            />
                          )}
                        />

                        <Controller
                          control={scheduledForm.control}
                          name="streams"
                          rules={{
                            validate: (value) =>
                              value.length > 0 || 'Pick at least one stream.'
                          }}
                          render={({ field, fieldState }) => (
                            <Checkbox.Group
                              label="Streams"
                              value={field.value}
                              onChange={field.onChange}
                              error={fieldState.error?.message}
                            >
                              <Group mt="xs">
                                {alertStreams.map((stream) => (
                                  <Checkbox
                                    key={stream}
                                    value={stream}
                                    label={formatStream(stream)}
                                  />
                                ))}
                              </Group>
                            </Checkbox.Group>
                          )}
                        />

                        <Controller
                          control={scheduledForm.control}
                          name="message"
                          render={({ field }) => (
                            <Textarea
                              {...field}
                              label="Message"
                              minRows={4}
                              placeholder="A maintenance window is planned for this stream."
                            />
                          )}
                        />

                        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                          <Controller
                            control={scheduledForm.control}
                            name="scheduledStart"
                            rules={{ required: 'Choose a start time.' }}
                            render={({ field, fieldState }) => (
                              <TextInput
                                {...field}
                                type="datetime-local"
                                label="Scheduled start"
                                error={fieldState.error?.message}
                              />
                            )}
                          />

                          <Controller
                            control={scheduledForm.control}
                            name="scheduledEnd"
                            rules={{
                              required: 'Choose an end time.',
                              validate: (value) => {
                                if (!scheduledStartValue || !value) {
                                  return true;
                                }

                                return (
                                  new Date(value).getTime() > new Date(scheduledStartValue).getTime() ||
                                  'Scheduled end must be after the start time.'
                                );
                              }
                            }}
                            render={({ field, fieldState }) => (
                              <TextInput
                                {...field}
                                type="datetime-local"
                                label="Scheduled end"
                                error={fieldState.error?.message}
                              />
                            )}
                          />
                        </SimpleGrid>

                        <Controller
                          control={scheduledForm.control}
                          name="publishDate"
                          render={({ field }) => (
                            <TextInput
                              {...field}
                              type="datetime-local"
                              label="Publish date"
                              description="Leave empty to publish immediately."
                            />
                          )}
                        />

                        <Group justify="flex-end">
                          <Button type="submit" loading={scheduledForm.formState.isSubmitting}>
                            Create scheduled alert
                          </Button>
                        </Group>
                      </Stack>
                    </form>
                  ) : null}
                </Stack>
              </Paper>
            </Grid.Col>

            <Grid.Col span={{ base: 12, lg: 5 }}>
              <Paper withBorder radius="xl" p="xl">
                <Stack gap="lg">
                  <div>
                    <Text className="section-label">Manage alerts</Text>
                    <Title order={2}>Ongoing alerts</Title>
                    <Text c="dimmed" size="sm" mt={6}>
                      Publish timeline updates or resolve an active alert when the issue is fixed.
                    </Text>
                  </div>

                  {manageFeedback ? (
                    <MantineAlert color={manageFeedback.tone === 'success' ? 'green' : 'red'}>
                      {manageFeedback.message}
                    </MantineAlert>
                  ) : null}

                  <form>
                    <Controller
                      control={activeAlertSelectionForm.control}
                      name="activeAlertId"
                      render={({ field }) => (
                        <NativeSelect
                          value={field.value}
                          onChange={(event) => field.onChange(event.currentTarget.value)}
                          label="Select active alert"
                          data={
                            activeAlertOptions.length > 0
                              ? activeAlertOptions
                              : [{ value: '', label: 'No active alerts available' }]
                          }
                          disabled={activeAlertOptions.length === 0}
                        />
                      )}
                    />
                  </form>

                  {selectedActiveAlert ? (
                    <Card withBorder radius="lg" className="active-alert-card">
                      <Stack gap="sm">
                        <Group justify="space-between" align="flex-start">
                          <div>
                            <Title order={3}>{selectedActiveAlert.title}</Title>
                            <Text size="sm" c="dimmed">
                              Created {formatDateTime(selectedActiveAlert.createdAt)}
                            </Text>
                          </div>

                          <Group gap={8}>
                            {selectedActiveAlert.streams.map((stream) => (
                              <Badge key={stream} variant="light" color="gray">
                                {formatStream(stream)}
                              </Badge>
                            ))}
                          </Group>
                        </Group>

                        <Text size="sm">{selectedActiveAlert.impact}</Text>
                      </Stack>
                    </Card>
                  ) : (
                    <Card withBorder radius="lg" className="empty-card">
                      <Stack gap="xs">
                        <Title order={3}>No ongoing alerts</Title>
                        <Text size="sm" c="dimmed">
                          Create an incident alert when something active needs to be managed here.
                        </Text>
                      </Stack>
                    </Card>
                  )}

                  <SimpleGrid cols={{ base: 1, xl: 2 }} spacing="lg">
                    <Paper withBorder radius="lg" p="lg">
                      <form onSubmit={updateForm.handleSubmit(handleCreateUpdate)}>
                        <Stack gap="md">
                          <div>
                            <Title order={3}>Add update</Title>
                            <Text size="sm" c="dimmed">
                              Use the selected active alert&apos;s streams automatically.
                            </Text>
                          </div>

                          <Controller
                            control={updateForm.control}
                            name="title"
                            rules={{ required: 'Give this update a title.' }}
                            render={({ field, fieldState }) => (
                              <TextInput
                                {...field}
                                label="Update title"
                                placeholder="Investigation is underway"
                                disabled={!selectedActiveAlert}
                                error={fieldState.error?.message}
                              />
                            )}
                          />

                          <Controller
                            control={updateForm.control}
                            name="message"
                            render={({ field }) => (
                              <Textarea
                                {...field}
                                label="Message"
                                minRows={4}
                                disabled={!selectedActiveAlert}
                                placeholder="We identified the failing component and are validating the fix."
                              />
                            )}
                          />

                          <Controller
                            control={updateForm.control}
                            name="publishDate"
                            render={({ field }) => (
                              <TextInput
                                {...field}
                                type="datetime-local"
                                label="Publish date"
                                disabled={!selectedActiveAlert}
                              />
                            )}
                          />

                          <Button
                            type="submit"
                            loading={updateForm.formState.isSubmitting}
                            disabled={!selectedActiveAlert}
                          >
                            Publish update
                          </Button>
                        </Stack>
                      </form>
                    </Paper>

                    <Paper withBorder radius="lg" p="lg">
                      <form onSubmit={resolveForm.handleSubmit(handleResolveAlert)}>
                        <Stack gap="md">
                          <div>
                            <Title order={3}>Resolve alert</Title>
                            <Text size="sm" c="dimmed">
                              Close the active alert and publish the resolution message.
                            </Text>
                          </div>

                          <Controller
                            control={resolveForm.control}
                            name="message"
                            render={({ field }) => (
                              <Textarea
                                {...field}
                                label="Resolution message"
                                minRows={4}
                                disabled={!selectedActiveAlert}
                                placeholder="The fix is deployed and customers should no longer see failures."
                              />
                            )}
                          />

                          <Controller
                            control={resolveForm.control}
                            name="publishDate"
                            render={({ field }) => (
                              <TextInput
                                {...field}
                                type="datetime-local"
                                label="Publish date"
                                disabled={!selectedActiveAlert}
                              />
                            )}
                          />

                          <Controller
                            control={resolveForm.control}
                            name="resolvedAt"
                            render={({ field }) => (
                              <TextInput
                                {...field}
                                type="datetime-local"
                                label="Resolved at"
                                description="Leave empty to use the current time."
                                disabled={!selectedActiveAlert}
                              />
                            )}
                          />

                          <Button
                            type="submit"
                            color="green"
                            loading={resolveForm.formState.isSubmitting}
                            disabled={!selectedActiveAlert}
                          >
                            Publish resolution
                          </Button>
                        </Stack>
                      </form>
                    </Paper>
                  </SimpleGrid>

                  <Divider label="Timeline" />

                  <Stack gap="sm">
                    {selectedActiveAlert?.alerts.length ? (
                      selectedActiveAlert.alerts.map((alert) => (
                        <Card key={alert._id} withBorder radius="lg">
                          <Stack gap="xs">
                            <Group justify="space-between" align="flex-start">
                              <div>
                                <Group gap="xs">
                                  <Badge color={alertTypeColor[alert.type]} variant="light">
                                    {alertTypeCopy[alert.type]}
                                  </Badge>
                                  <Text fw={600}>{alert.title}</Text>
                                </Group>
                                <Text size="sm" c="dimmed" mt={4}>
                                  Published {formatDateTime(alert.publishDate)}
                                </Text>
                              </div>

                              <Group gap={8}>
                                {alert.streams.map((stream) => (
                                  <Badge key={`${alert._id}-${stream}`} variant="dot" color="gray">
                                    {formatStream(stream)}
                                  </Badge>
                                ))}
                              </Group>
                            </Group>

                            {alert.message ? <Text size="sm">{alert.message}</Text> : null}
                          </Stack>
                        </Card>
                      ))
                    ) : (
                      <Text size="sm" c="dimmed">
                        Select an active alert to review its published timeline.
                      </Text>
                    )}
                  </Stack>
                </Stack>
              </Paper>
            </Grid.Col>
          </Grid>

          <Paper withBorder radius="xl" p="xl">
            <Stack gap="lg">
              <div>
                <Text className="section-label">Recent alerts</Text>
                <Title order={2}>Published alert feed</Title>
                <Text size="sm" c="dimmed" mt={6}>
                  All alerts appear here in reverse chronological order across incident, update,
                  resolution, warning, and scheduled activity.
                </Text>
              </div>

              {isLoadingDashboard ? (
                <Text size="sm" c="dimmed">
                  Loading alerts...
                </Text>
              ) : null}

              <Stack gap="md">
                {alerts.map((alert) => (
                  <Card key={alert._id} withBorder radius="lg">
                    <Stack gap="sm">
                      <Group justify="space-between" align="flex-start">
                        <div>
                          <Group gap="xs">
                            <Badge color={alertTypeColor[alert.type]} variant="light">
                              {alertTypeCopy[alert.type]}
                            </Badge>
                            <Text fw={600}>{alert.title}</Text>
                          </Group>
                          <Text size="sm" c="dimmed" mt={4}>
                            Published {formatDateTime(alert.publishDate)}
                          </Text>
                        </div>

                        <Group gap={8}>
                          {alert.streams.map((stream) => (
                            <Badge key={`${alert._id}-feed-${stream}`} variant="dot" color="gray">
                              {formatStream(stream)}
                            </Badge>
                          ))}
                        </Group>
                      </Group>

                      {alert.message ? <Text size="sm">{alert.message}</Text> : null}

                      {alert.type === 'scheduled' ? (
                        <Text size="sm" c="dimmed">
                          Scheduled window: {formatDateTime(alert.scheduledStart)} to{' '}
                          {formatDateTime(alert.scheduledEnd)}
                        </Text>
                      ) : null}
                    </Stack>
                  </Card>
                ))}

                {!isLoadingDashboard && alerts.length === 0 ? (
                  <Text size="sm" c="dimmed">
                    No alerts have been published yet.
                  </Text>
                ) : null}
              </Stack>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </div>
  );
}
