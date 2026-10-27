/**
 * A minimal JSON:API client for the DX (Drupal) API.
 *
 * This replaces the `kitsu` client. kitsu v13 changed the shape of deserialised documents
 * (relationships are no longer wrapped in `{ data }`, resource metadata moved under `$`), which is
 * incompatible with the DX module and the mocked DX data used both for USE_MOCKS and by the tests.
 * The deserialiser below produces the same shape kitsu v9 did: attributes are flattened onto the
 * resource and relationships are exposed as `{ data: resource | resource[] | null }` with the
 * related resources resolved (recursively) from the document's `included` array.
 */
import logger from '../../logger';

interface ResourceIdentifier {
  type: string;
  id: string;
}

interface Resource extends ResourceIdentifier {
  attributes?: Record<string, unknown>;
  relationships?: Record<string, { data?: ResourceIdentifier | ResourceIdentifier[] | null }>;
  links?: unknown;
  meta?: unknown;
}

interface Document {
  data?: Resource | Resource[] | null;
  included?: Resource[];
  links?: Record<string, { href: string }>;
  meta?: unknown;
  errors?: unknown[];
}

export interface JsonApiResponse {
  data: any[];
  links?: Record<string, { href: string }>;
  meta?: unknown;
}

/**
 * Serialise nested query params using the bracket notation Drupal's JSON:API expects, ie.
 * `{ fields: { 'node--x': 'a,b' }, page: { limit: 50 } }` becomes `fields[node--x]=a,b&page[limit]=50`
 */
export const toQueryString = (params: Record<string, unknown>, prefix?: string): string => {
  const parts: string[] = [];
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    const name = prefix ? `${prefix}[${key}]` : key;
    if (typeof value === 'object' && !Array.isArray(value)) {
      const nested = toQueryString(value as Record<string, unknown>, name);
      if (nested) parts.push(nested);
    } else {
      const encoded = Array.isArray(value) ? value.join(',') : String(value);
      parts.push(`${encodeURIComponent(name)}=${encodeURIComponent(encoded)}`);
    }
  });
  return parts.join('&');
};

const resourceKey = ({ type, id }: ResourceIdentifier) => `${type}:${id}`;

/**
 * Flatten a resource (attributes onto the object, relationships resolved from `included`).
 * The `seen` set guards against circular relationships between included resources.
 */
const deserialiseResource = (
  resource: Resource,
  included: Map<string, Resource>,
  seen: Set<string> = new Set(),
): Record<string, any> => {
  // Any other top level keys (ie. already flattened mock data) are preserved, like kitsu v9 did
  const { attributes = {}, relationships = {}, ...rest } = resource;
  const result: Record<string, any> = { ...rest, ...attributes };

  const key = resourceKey(resource);
  const branch = new Set(seen).add(key);

  const resolve = (identifier: ResourceIdentifier): Record<string, any> => {
    const related = included.get(resourceKey(identifier));
    if (!related || branch.has(resourceKey(identifier))) return { ...identifier };
    return deserialiseResource(related, included, branch);
  };

  Object.entries(relationships).forEach(([name, relationship]) => {
    const { data, ...rest } = relationship ?? {};
    let resolved: unknown = data;
    if (Array.isArray(data)) resolved = data.map(resolve);
    else if (data) resolved = resolve(data);
    result[name] = { ...rest, data: resolved };
  });

  return result;
};

/**
 * Deserialise a JSON:API document into the flattened shape used throughout the DX module.
 */
export const deserialise = (document: Document): JsonApiResponse => {
  const included = new Map<string, Resource>();
  (document.included ?? []).forEach((resource) => included.set(resourceKey(resource), resource));

  const { data } = document;
  let items: any[] = [];
  if (Array.isArray(data)) items = data.map((r) => deserialiseResource(r, included));
  else if (data) items = [deserialiseResource(data, included)];

  return { data: items, links: document.links, meta: document.meta };
};

export interface JsonApiClientOptions {
  baseURL: string;
  headers?: Record<string, string>;
}

/**
 * Create a client that fetches JSON:API documents relative to the provided base URL.
 */
export const createJsonApiClient = ({ baseURL, headers }: JsonApiClientOptions) => ({
  get: async (path: string, params: Record<string, unknown> = {}): Promise<JsonApiResponse> => {
    const query = toQueryString(params);
    const url = `${baseURL.replace(/\/$/, '')}/${path.replace(/^\//, '')}${query ? `?${query}` : ''}`;
    logger().debug(`jsonapi GET ${url}`);
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/vnd.api+json', ...headers },
    });
    const body = await response.text();
    if (!response.ok) {
      const error: any = new Error(`jsonapi GET ${url} failed: ${response.status} ${response.statusText}`);
      error.response = { status: response.status, statusText: response.statusText, body };
      throw error;
    }
    return deserialise(body ? JSON.parse(body) : {});
  },
});

export default createJsonApiClient;
