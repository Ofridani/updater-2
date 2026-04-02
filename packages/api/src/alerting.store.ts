import type { Alert, Incident } from 'common';

export const alertingStore: { alerts: Alert[]; incidents: Incident[] } = {
  alerts: [],
  incidents: []
};
