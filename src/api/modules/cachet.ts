import config from 'config';
import cache from './cache';
import { fetchData } from '../util';
import mockedIncidents from '../../mocks/cachet/incidents';
import mockedComponents from '../../mocks/cachet/components';

export const CACHET_BASE_URL: string = config.get('cachetApi.baseUrl');
const CACHE_SEC: number = parseInt(config.get('cachetApi.cacheEndpointSec'), 10);

/* eslint-disable camelcase */
interface ICachetMeta {
  meta: {
    pagination: {
      total: number;
      count: number;
      per_page: number;
      current_page: number;
      total_pages: number;
      links: {
        next_page: string | null;
        previous_page: string | null;
      };
    };
  };
}

interface ICachetIncidentItemResponse {
  id: number;
  user_id: number;
  component_id: number;
  name: string;
  status: number;
  visible: number;
  stickied: boolean;
  notifications: boolean;
  message: string;
  occurred_at: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  is_resolved: boolean;
  meta: any[]; // TODO: Check into what this is supposed to be shaped as.
  updates: {
    id: number;
    incident_id: number;
    status: number;
    message: string;
    user_id: number;
    created_at: string;
    updated_at: string;
    human_status: string;
    permalink: string;
  }[];
  human_status: string;
  latest_update_id: number;
  latest_status: number;
  latest_human_status: string;
  latest_icon: string;
  permalink: string;
  duration: number;
}

interface ICachetComponentItemResponse {
  id: number;
  name: string;
  description: string;
  link: string;
  status: number;
  order: number;
  group_id: number;
  enabled: boolean;
  meta: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  status_name: string;
  tags: string[];
}

interface ICachetComponentResponse {
  meta: ICachetMeta;
  data: ICachetComponentItemResponse[];
}

interface ICachetIncidentResponse {
  meta: ICachetMeta;
  data: ICachetIncidentItemResponse[];
}
/* eslint-enable camelcase */

export interface ICachetIncident {
  id: number;
  name: string;
  message: string;
  duration: number;
  permalink: string;
  status: number;
  statusText: string;
  isResolved: boolean;
  updatedAt: string;
}

export interface ICachetComponent {
  id: number;
  name: string;
  description: string;
  statusText: string;
  status: number;
  updatedAt: string;
  incidents: ICachetIncident[];
}

const getComponents = async (): Promise<ICachetComponentResponse> => {
  const url = `${CACHET_BASE_URL}/components`;
  return fetchData(
    () =>
      cache.get(url, { json: true }, true, {
        key: url,
        ttlSeconds: CACHE_SEC,
      }),
    mockedComponents,
  );
};

const getIncidents = async (): Promise<ICachetIncidentResponse> => {
  const url = `${CACHET_BASE_URL}/incidents`;
  return fetchData(
    () =>
      cache.get(url, { json: true }, true, {
        key: url,
        ttlSeconds: CACHE_SEC,
      }),
    mockedIncidents,
  );
};

const mostRecentIncident = (
  incidents: ICachetIncidentItemResponse[],
  component: ICachetComponentItemResponse,
): ICachetIncident[] => {
  if (!incidents.length) return [];
  const filtered = incidents
    .filter((i) => i.component_id === component.id && component.status > 1 && i.stickied)
    .sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));
  if (!filtered.length) return [];
  const incident = filtered[0];
  const { id, name, message, duration, permalink } = incident;
  return [
    {
      id,
      name,
      message,
      duration,
      permalink,
      updatedAt: incident.updated_at,
      isResolved: incident.is_resolved,
      status: incident.latest_status,
      statusText: incident.latest_human_status,
    },
  ];
};

/**
 * Query Cachet API to get a list of components and its most recent incident if its not operational
 */
export const getSystemsStatus = async (): Promise<ICachetComponent[]> => {
  try {
    const [components, incidents]: [
      ICachetComponentResponse,
      ICachetIncidentResponse,
    ] = await Promise.all([getComponents(), getIncidents()]);

    const data = components?.data.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      statusText: c.status_name,
      status: c.status,
      updatedAt: c.updated_at,
      incidents: mostRecentIncident(incidents.data, c),
    }));
    if (!data?.length) throw new Error('Cachet API queries failed.');
    return data;
  } catch (err) {
    throw err;
  }
};
