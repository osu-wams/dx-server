import DynamoDB from 'aws-sdk/clients/dynamodb'; // eslint-disable-line no-unused-vars
import { Table, Entity } from 'dynamodb-toolbox';
import { DYNAMODB_TABLE_PREFIX } from '../../constants';
import logger from '../../logger';
import { DocumentClient } from '../../db';
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
export interface IUser {
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
}
interface Users {
  // eslint-disable-next-line no-use-before-define
  Items: User[];
  next?: Function;
}

const TABLE_NAME: string = `${DYNAMODB_TABLE_PREFIX}-Users`;

const table = new Table({
  name: TABLE_NAME,
  partitionKey: 'osuId',
  DocumentClient,
});

const UserEntity = new Entity({
  name: 'User',
  attributes: {
    osuId: { partitionKey: true, type: 'number' },
    firstName: { type: 'string' },
    lastName: { type: 'string' },
    email: { type: 'string' },
    primaryAffiliation: { type: 'string' },
    affiliations: { type: 'set', setType: 'string' },
    groups: { type: 'set', setType: 'string' },
    phone: { type: 'string' },
    canvasRefreshToken: { type: 'string' },
    canvasOptIn: { type: 'boolean', default: false },
    nameID: { type: 'string' },
    nameIDFormat: { type: 'string' },
    audienceOverride: { type: 'map' },
    primaryAffiliationOverride: { type: 'string' },
    theme: { type: 'string', default: 'light' },
    devTools: { type: 'boolean', default: false },
    onid: { type: 'string' },
    lastLogin: { type: 'string', default: () => new Date().toISOString().slice(0, 10) },
    colleges: { type: 'set', setType: 'string' },
    isAdmin: { type: 'boolean', save: false },
  },
  table,
  autoExecute: true,
  autoParse: true,
});

export const TableDefinition: DynamoDB.CreateTableInput = {
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
class User {
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
  affiliations: string[] = [];

  /** Groupers group names from the SAML profile */
  groups: string[] = [];

  /** From SAML profile */
  phone?: string;

  /** Grouper group: Admin flag derived from SAML profile, not persisted in the database */
  isAdmin?: boolean = false;

  /** Canvas OAuth refresh token used to fetch new tokens, provided when the user approves DX app to Canvas  */
  canvasRefreshToken?: string = '';

  /** Canvas Oauth expiration date in milliseconds */
  canvasOauthExpire?: number = 0;

  /** Canvas Oauth token to use for API calls on behalf of the user */
  canvasOauthToken?: string = '';

  /** User has removed application approval or has not yet clicked to approve integration */
  canvasOptIn?: boolean = false;

  /** From SAML profile */
  nameIDFormat?: string = '';

  /** From SAML profile */
  nameID?: string = '';

  /** User initiated setting overrides to view specific audience(s) specific data such as events and announcements */
  audienceOverride?: AudienceOverride = {};

  /** Employee type user initiated setting to view the application how another affiliation (student) would see it, this is
   * used by student-facing folks
   */
  primaryAffiliationOverride?: string = '';

  /** User initiated setting to set the application theme, defaults to light theme */
  theme?: string = 'light';

  /** Enables developer tools to troubleshoot issues */
  devTools?: boolean = false;

  /** Users ONID */
  onid?: string = '';

  /** Last datetime the user logged in */
  lastLogin?: string = '';

  /** Student found to be related to these college(s) */
  colleges?: string[] = [];

  static TABLE_NAME: string = TABLE_NAME;

  /**
   * Detect if the user is a student, currently by checking only the primaryAffiliation
   */
  static isStudent = (props: Partial<User>): boolean => {
    return (
      props.primaryAffiliation?.toLowerCase() === 'student' ||
      props.affiliations.includes('student')
    );
  };

  /**
   * Insert (or update to match) a User based on the data supplied.
   * * Example use: User.upsert({osuId: 123456, firstName: 'f', lastName:'l', email: 'e', canvasOptIn: true, canvasRefreshToken: 't'}).then(v => console.log(v))
   * @param props - the user properties to translate to a dynamodb user item
   * @returns Promise<User> - a promise with the User that was inserted/updated
   */
  static upsert = async (props: Partial<User>): Promise<User> => {
    try {
      const result: Users = await UserEntity.put(props);
      logger().debug('User.upsert succeeded:', result);
      return User.find(props.osuId);
    } catch (err) {
      logger().error(`User.upsert failed:`, props, err);
      throw err;
    }
  };

  /**
   * Find User having the provided ID from the Users table.
   * * Example use: User.find(123456).then(v => console.log(v))
   * @param id [Number] - the users id
   * @returns Promise<User | null> - a promise with the User or a null if none found
   */
  static find = async (id: number): Promise<User | undefined> => {
    try {
      const result: Users = await UserEntity.query(id);
      return result.Items[0];
    } catch (err) {
      logger().error(`User.find(${id}) failed:`, err);
      return undefined;
    }
  };

  /**
   * Remove the canvas refresh token from all items in the Users table.
   * ! This is an expensive (cost-wise and computationally) because it
   * ! must inspect all items in the table.
   * * Example use: User.clearAllCanvasRefreshTokens().then(v => console.log(v))
   * @returns Promise<[boolean, any]> - a promise with an array of boolean and errors,
   *          the boolean indicates if there were no errors, and the 'any' is an array of [id,error]
   */
  static clearAllCanvasRefreshTokens = async (): Promise<[boolean, any]> => {
    const errors = [];
    const users = await User.scanAll();
    users
      .map((u) => u.osuId)
      .forEach(async (osuId) => {
        try {
          const result = await UserEntity.update({
            osuId,
            canvasOptIn: false,
            $remove: ['canvasRefreshToken'],
          });
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
   * @param canvasRefreshToken [string] - the new canvas refresh token to set
   * @param canvasOptIn [boolean] - the new opt in boolean
   * @returns Promise<User> - a promise with the User that was inserted/updated
   */
  static updateCanvasData = async (
    props: Partial<User>,
    canvasRefreshToken: string | null,
    canvasOptIn: boolean,
  ): Promise<User> => {
    try {
      const { osuId } = props;
      await UserEntity.update({
        osuId,
        canvasOptIn,
        canvasRefreshToken,
      });

      logger().debug(
        `User.updateCanvasData updated user:${osuId}, canvasOptIn:${canvasOptIn}, canvasRefreshToken:${canvasRefreshToken}`,
      );
      return User.find(osuId);
    } catch (err) {
      logger().error(`User.updateCanvasData failed:`, err);
      throw err;
    }
  };

  static updateSettings = async (props: IUser, settings: UserSettings): Promise<User> => {
    try {
      const { osuId } = props;
      const theme: string = settings.theme || props.theme || 'light';
      const devTools: boolean = settings.devTools ?? props.devTools ?? false;
      const updates: Partial<IUser> = {
        osuId,
        theme,
        devTools,
      };
      const { audienceOverride, primaryAffiliationOverride } = settings;
      if (primaryAffiliationOverride)
        updates.primaryAffiliationOverride = primaryAffiliationOverride;
      if (audienceOverride) updates.audienceOverride = audienceOverride;
      const result = await UserEntity.update(updates);

      logger().silly('User.updateSettings updated user:', osuId, result);
      return User.find(osuId);
    } catch (err) {
      logger().error(`User.updateSettings failed:`, err);
      throw err;
    }
  };

  static scanAll = async (): Promise<User[]> => {
    const cached = await getCache(User.TABLE_NAME);
    if (cached) {
      return JSON.parse(cached);
    }

    const found = [];
    let results: Users = await UserEntity.scan();
    found.push(...results.Items);
    logger().info(
      `${User.TABLE_NAME} scan returned ${results.Items.length}, total: ${found.length}`,
    );
    while (results.next) {
      // eslint-disable-next-line no-await-in-loop
      results = await results.next();
      found.push(...results.Items);
      logger().info(
        `${User.TABLE_NAME} scan returned ${results.Items.length}, total: ${found.length}`,
      );
    }

    await setCache(User.TABLE_NAME, JSON.stringify(found), {
      mode: 'EX',
      duration: 24 * 60 * 60,
      flag: 'NX',
    });
    return found;
  };
}

export default User;
