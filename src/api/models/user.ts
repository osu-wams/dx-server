import type { CreateTableCommandInput } from '@aws-sdk/client-dynamodb';
import type { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import {
  Table,
  Entity,
  item,
  string,
  number,
  boolean,
  set,
  map,
  PutItemCommand,
  UpdateItemCommand,
  QueryCommand,
  ScanCommand,
  $remove,
  $set,
} from 'dynamodb-toolbox';
import { DYNAMODB_TABLE_PREFIX } from '../../constants';
import logger from '../../logger';
import { DocumentClient } from '../../db';
import { normalizeItem, toSet } from '../../db/format';
import { getCache, setCache } from '../modules/cache';

export interface AudienceOverride {
  campusCode?: string;
  firstYear?: boolean;
  international?: boolean;
  graduate?: boolean;
  colleges?: string[];
}

export interface UserSettings {
  audienceOverride?: AudienceOverride;
  primaryAffiliationOverride?: string;
  theme?: string;
  devTools?: boolean;
}
export interface User {
  /** From SAML profile */
  osuId: number;

  /** From SAML profile */
  firstName: string;

  /** From SAML profile */
  lastName: string;

  /** From SAML profile */
  email: string;

  /** Primary User affiliation (ie. student or employee) from SAML profile */
  primaryAffiliation: string;

  /** All User affiliations (ie. student, employee) from SAML profile */
  affiliations: string[];

  /** Groupers group names from the SAML profile */
  groups?: string[];

  /** From SAML profile */
  phone?: string;

  /** Grouper group: Admin flag derived from SAML profile, not persisted in the database */
  isAdmin?: boolean;

  /** Canvas OAuth refresh token used to fetch new tokens, provided when the user approves DX app to Canvas  */
  canvasRefreshToken?: string;

  /** Canvas Oauth expiration date in milliseconds */
  canvasOauthExpire?: number;

  /** Canvas Oauth token to use for API calls on behalf of the user */
  canvasOauthToken?: string;

  /** User has removed application approval or has not yet clicked to approve integration */
  canvasOptIn?: boolean;

  /** From SAML profile */
  nameIDFormat?: string;

  /** From SAML profile */
  nameID?: string;

  /** User initiated setting overrides to view specific audience(s) specific data such as events and announcements */
  audienceOverride?: AudienceOverride;

  /** Employee type user initiated setting to view the application how another affiliation (student) would see it, this is
   * used by student-facing folks
   */
  primaryAffiliationOverride?: string;

  /** User initiated setting to set the application theme, defaults to light theme */
  theme?: string;

  /** Enables developer tools to troubleshoot issues */
  devTools?: boolean;

  /** Users ONID */
  onid?: string;

  /** Last datetime the user logged in */
  lastLogin?: string;

  /** Student found to be related to these college(s) */
  colleges?: string[];

  /** Mobile app Refresh JWT token */
  mobileRefreshTokenHash?: string;
}

type Client = DynamoDBDocumentClient;

export const TABLE_NAME: string = `${DYNAMODB_TABLE_PREFIX}-Users`;

export const TableDefinition: CreateTableCommandInput = {
  AttributeDefinitions: [{ AttributeName: 'osuId', AttributeType: 'N' }],
  KeySchema: [{ AttributeName: 'osuId', KeyType: 'HASH' }],
  ProvisionedThroughput: {
    ReadCapacityUnits: 5,
    WriteCapacityUnits: 5,
  },
  TableName: TABLE_NAME,
  StreamSpecification: {
    StreamEnabled: false,
  },
};

const table = (client?: Client) =>
  new Table({
    name: TABLE_NAME,
    partitionKey: { name: 'osuId', type: 'number' },
    documentClient: client ?? DocumentClient,
  });

const audienceOverrideSchema = map({
  campusCode: string().optional(),
  firstYear: boolean().optional(),
  international: boolean().optional(),
  graduate: boolean().optional(),
  colleges: set(string()).optional(),
});

/**
 * Attributes persisted for a User. `isAdmin`, `canvasOauthExpire` and `canvasOauthToken` are
 * intentionally omitted, they're derived at login time and never saved to the database.
 */
const userSchema = item({
  osuId: number().key(),
  firstName: string().optional(),
  lastName: string().optional(),
  email: string().optional(),
  primaryAffiliation: string().optional(),
  affiliations: set(string()).optional(),
  groups: set(string()).optional(),
  phone: string().optional(),
  canvasRefreshToken: string().optional(),
  canvasOptIn: boolean().optional().putDefault(false),
  nameID: string().optional(),
  nameIDFormat: string().optional(),
  audienceOverride: audienceOverrideSchema.optional(),
  primaryAffiliationOverride: string().optional(),
  theme: string().optional().putDefault('light'),
  devTools: boolean().optional().putDefault(false),
  onid: string().optional(),
  lastLogin: string()
    .optional()
    .putDefault(() => new Date().toISOString().slice(0, 10)),
  colleges: set(string()).optional(),
  mobileRefreshTokenHash: string().optional(),
});

const UserEntity = (client?: Client) =>
  new Entity({
    name: 'User',
    table: table(client),
    schema: userSchema,
  });

const toAudienceOverride = (audienceOverride?: AudienceOverride) => {
  if (!audienceOverride) return undefined;
  return {
    ...audienceOverride,
    colleges: toSet(audienceOverride.colleges),
  };
};

/**
 * Translate a User into the item shape persisted in DynamoDB (arrays become string sets,
 * non-persisted attributes are dropped).
 */
const toItem = (props: Partial<User>) => {
  const { isAdmin, canvasOauthExpire, canvasOauthToken, ...persisted } = props;
  return {
    ...persisted,
    affiliations: toSet(props.affiliations),
    groups: toSet(props.groups),
    colleges: toSet(props.colleges),
    audienceOverride: toAudienceOverride(props.audienceOverride),
  };
};

/**
 * Detect if the user is a student, currently by checking only the primaryAffiliation
 */
export const isStudent = (props: Partial<User>): boolean => {
  return (
    props.primaryAffiliation?.toLowerCase() === 'student' ||
    (props.affiliations ?? []).includes('student')
  );
};

/**
 * Find User having the provided ID from the Users table.
 * * Example use: User.find(123456).then(v => console.log(v))
 * @param id [Number] - the users id
 * @returns Promise<User | null> - a promise with the User or a null if none found
 */
export const find = async (id: number, client?: Client): Promise<User | undefined> => {
  try {
    const { Items = [] } = await table(client)
      .build(QueryCommand)
      .query({ partition: id })
      .send();
    const user = Items[0] ? normalizeItem<User>(Items[0]) : undefined;
    logger().debug(`User.find found: ${JSON.stringify(user)}`);
    return user;
  } catch (err) {
    logger().error(`User.find(${id}) failed:`, err);
    return undefined;
  }
};

/**
 * Insert (or update to match) a User based on the data supplied.
 * * Example use: User.upsert({osuId: 123456, firstName: 'f', lastName:'l', email: 'e', canvasOptIn: true, canvasRefreshToken: 't'}).then(v => console.log(v))
 * @param props - the user properties to translate to a dynamodb user item
 * @returns Promise<User> - a promise with the User that was inserted/updated
 */
export const upsert = async (props: Partial<User>, client?: Client): Promise<User> => {
  try {
    // Ensure empty (and optional) sets aren't persisted, because they fail (handled by toItem)
    await UserEntity(client)
      .build(PutItemCommand)
      .item(toItem(props) as any)
      .send();
    logger().debug('User.upsert succeeded');
    return find(props.osuId, client);
  } catch (err) {
    logger().error(`User.upsert failed:`, props, err);
    throw err;
  }
};

export const scanAll = async (client?: Client): Promise<User[]> => {
  const cached = await getCache(TABLE_NAME);
  if (cached) {
    return JSON.parse(cached);
  }

  const found: User[] = [];
  let exclusiveStartKey: Record<string, unknown> | undefined;
  do {
    const { Items = [], LastEvaluatedKey } = await table(client)
      .build(ScanCommand)
      .options(exclusiveStartKey ? { exclusiveStartKey } : {})
      .send();
    const users = Items.map((i) => normalizeItem<User>(i));
    found.push(...users);
    logger().info(`${TABLE_NAME} scan returned ${users.length}, total: ${found.length}`);
    exclusiveStartKey = LastEvaluatedKey;
  } while (exclusiveStartKey);

  await setCache(TABLE_NAME, JSON.stringify(found), {
    mode: 'EX',
    duration: 24 * 60 * 60,
    flag: 'NX',
  });
  return found;
};

/**
 * Remove the canvas refresh token from all items in the Users table.
 * ! This is an expensive (cost-wise and computationally) because it
 * ! must inspect all items in the table.
 * * Example use: User.clearAllCanvasRefreshTokens().then(v => console.log(v))
 * @returns Promise<[boolean, any]> - a promise with an array of boolean and errors,
 *          the boolean indicates if there were no errors, and the 'any' is an array of [id,error]
 */
export const clearAllCanvasRefreshTokens = async (client?: Client): Promise<[boolean, any]> => {
  const errors = [];
  const users = await scanAll();
  users
    .map((u) => u.osuId)
    .forEach(async (osuId) => {
      try {
        const result = await UserEntity(client)
          .build(UpdateItemCommand)
          .item({
            osuId,
            canvasOptIn: false,
            canvasRefreshToken: $remove(),
          })
          .send();
        logger().debug('User.clearAllCanvasRefreshTokens updated user:', osuId, result);
      } catch (err) {
        logger().error(`User.clearAllCanvasRefreshTokens error:`, err);
        errors.push([osuId, err]);
      }
    });
  return Promise.resolve([!errors.length, errors]);
};

/**
 * Update user's canvas opt-in and refresh token.
 * * Example use: User.updateCanvasData({osuId: 123456, firstName: 'f', lastName: 'l', email: 'e'}, 'bobross', true).then(v => console.log(v))
 * @param props [User] - the user to update
 * @param canvasRefreshToken [string] - the new canvas refresh token to set (null removes it)
 * @param canvasOptIn [boolean] - the new opt in boolean
 * @returns Promise<User> - a promise with the User that was inserted/updated
 */
export const updateCanvasData = async (
  props: Partial<User>,
  canvasRefreshToken: string | null,
  canvasOptIn: boolean,
  client?: Client,
): Promise<User> => {
  try {
    const { osuId } = props;
    await UserEntity(client)
      .build(UpdateItemCommand)
      .item({
        osuId,
        canvasOptIn,
        ...(canvasRefreshToken === undefined
          ? {}
          : { canvasRefreshToken: canvasRefreshToken === null ? $remove() : canvasRefreshToken }),
      })
      .send();

    logger().debug(
      `User.updateCanvasData updated user:${osuId}, canvasOptIn:${canvasOptIn}, canvasRefreshToken:${canvasRefreshToken}`,
    );
    return find(osuId, client);
  } catch (err) {
    logger().error(`User.updateCanvasData failed:`, err);
    throw err;
  }
};

export const updateSettings = async (
  props: User,
  settings: UserSettings,
  client?: Client,
): Promise<User> => {
  try {
    const { osuId } = props;
    const theme: string = settings.theme || props.theme || 'light';
    const devTools: boolean = settings.devTools ?? props.devTools ?? false;
    const { audienceOverride, primaryAffiliationOverride } = settings;
    const result = await UserEntity(client)
      .build(UpdateItemCommand)
      .item({
        osuId,
        theme,
        devTools,
        ...(primaryAffiliationOverride ? { primaryAffiliationOverride } : {}),
        ...(audienceOverride ? { audienceOverride: $set(toAudienceOverride(audienceOverride)) } : {}),
      })
      .send();

    logger().silly('User.updateSettings updated user:', osuId, result);
    return find(osuId, client);
  } catch (err) {
    logger().error(`User.updateSettings failed:`, err);
    throw err;
  }
};

export default {
  find,
  upsert,
  isStudent,
  clearAllCanvasRefreshTokens,
  updateCanvasData,
  updateSettings,
  scanAll,
  TABLE_NAME,
};
