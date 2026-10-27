/**
 * Helpers to translate between the application data shapes (plain arrays, strings and numbers)
 * and the shapes the AWS SDK v3 DocumentClient and dynamodb-toolbox v2 expect (JS Sets for
 * DynamoDB string sets, real numbers and booleans).
 */
const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Object.prototype.toString.call(value) === '[object Object]';

/**
 * Recursively convert DynamoDB sets (unmarshalled as JS Sets) into plain arrays.
 */
export const fromDynamo = (value: any): any => {
  if (value instanceof Set) return [...value];
  if (Array.isArray(value)) return value.map(fromDynamo);
  if (isPlainObject(value)) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, fromDynamo(v)]));
  }
  return value;
};

/**
 * Convert a raw DynamoDB item into the application shape, stripping the dynamodb-toolbox
 * internal attributes (`_et` entity, `_ct` created, `_md` modified).
 */
export const normalizeItem = <T>(item: Record<string, any>): T => {
  const { _et, _ct, _md, ...rest } = fromDynamo(item);
  return rest as T;
};

/**
 * Convert an array of strings into a Set for persisting as a DynamoDB string set,
 * empty (and optional) sets must not be persisted because they fail.
 */
export const toSet = (values?: Iterable<string> | null): Set<string> | undefined => {
  if (values === undefined || values === null) return undefined;
  const result = new Set(values);
  return result.size ? result : undefined;
};

export const toNumber = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  const result = Number(value);
  return Number.isNaN(result) ? undefined : result;
};

export const toBoolean = (value: unknown): boolean | undefined => {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'string') return !['false', '0', 'no', ''].includes(value.toLowerCase());
  return Boolean(value);
};
