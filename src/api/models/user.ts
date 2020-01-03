import config from 'config';
import logger from '../../logger';
import { asyncTimedFunction } from '../../tracer';
import { SamlUser } from '../modules/user-account'; // eslint-disable-line no-unused-vars
import { scan, updateItem, getItem, putItem } from '../../db';

const tablePrefix = config.get('aws.dynamodb.tablePrefix');

export const GROUPS = {
  admin: 'urn:mace:oregonstate.edu:entitlement:dx:dx-admin',
  masquerade: 'urn:mace:oregonstate.edu:entitlement:dx:dx-masquerade',
};

export interface AudienceOverride {
  campusCode?: string;
  firstYear?: boolean;
  international?: boolean;
  graduate?: boolean;
}

export interface UserSettings {
  audienceOverride?: AudienceOverride;
  primaryAffiliationOverride?: string;
  theme?: string;
}

interface AudienceOverrideItem extends AWS.DynamoDB.MapAttributeValue {
  campusCode?: { S: string };
  firstYear?: { BOOL: boolean };
  international?: { BOOL: boolean };
  graduate?: { BOOL: boolean };
}

interface UserParams {
  samlUser?: SamlUser;
  dynamoDbUser?: AWS.DynamoDB.GetItemOutput;
}

export interface DynamoDBUserItem extends AWS.DynamoDB.PutItemInputAttributeMap {
  osuId: { N: string };
  firstName: { S: string };
  lastName: { S: string };
  email: { S: string };
  phone?: { S: string };
  canvasRefreshToken?: { S: string };
  canvasOptIn?: { BOOL: boolean };
  nameID?: { S: string };
  nameIDFormat?: { S: string };
  audienceOverride?: { M: AudienceOverrideItem };
  primaryAffiliationOverride?: { S: string };
  theme?: { S: string };
}

class User {
  osuId: number;

  firstName: string;

  lastName: string;

  email: string;

  primaryAffiliation: string;

  phone?: string;

  /** Grouper group: Admin flag derived from SAML profile, not persisted in the database */
  isAdmin?: boolean = false;

  /** Grouper groups: Derived from SAML profile, not persisted in the database */
  groups?: string[] = [];

  refreshToken?: string = '';

  canvasOauthExpire?: number = 0;

  canvasOauthToken?: string = '';

  isCanvasOptIn?: boolean = false;

  nameIDFormat?: string = '';

  nameID?: string = '';

  audienceOverride?: AudienceOverride = {};

  primaryAffiliationOverride?: string = '';

  theme?: string = 'light';

  static TABLE_NAME: string = `${tablePrefix}-Users`;

  /**
   * Initializes a new instance of the User with the supplied data.
   * @param p [UserParams] - optional params to intitialize the user with depending
   *        on the source of data which is passed
   */
  constructor(p: UserParams) {
    if (p.samlUser) {
      const params = p.samlUser;
      this.osuId = parseInt(params.osu_id, 10);
      this.firstName = params.first_name;
      this.lastName = params.last_name;
      this.email = params.email;
      this.phone = params.phone;
      this.primaryAffiliation = params.primaryAffiliation;
    }

    if (p.dynamoDbUser) {
      const params = p.dynamoDbUser;
      // The partition key is required and the data is stored as a string
      this.osuId = parseInt(params.Item.osuId.N, 10);
      if (params.Item.firstName) this.firstName = params.Item.firstName.S;
      if (params.Item.lastName) this.lastName = params.Item.lastName.S;
      if (params.Item.email) this.email = params.Item.email.S;
      if (params.Item.phone) this.phone = params.Item.phone.S;
      if (params.Item.nameID) this.nameID = params.Item.nameID.S;
      if (params.Item.nameIDFormat) this.nameIDFormat = params.Item.nameIDFormat.S;
      if (params.Item.primaryAffiliation)
        this.primaryAffiliation = params.Item.primaryAffiliation.S;
      if (params.Item.canvasRefreshToken)
        this.refreshToken = params.Item.canvasRefreshToken.S || this.refreshToken;
      if (params.Item.canvasOptIn !== undefined) {
        this.isCanvasOptIn = params.Item.canvasOptIn.BOOL || this.isCanvasOptIn;
      } else {
        this.isCanvasOptIn = false;
      }
      if (params.Item.audienceOverride !== undefined) {
        this.audienceOverride = {
          campusCode: params.Item.audienceOverride.M.campusCode.S,
          firstYear: params.Item.audienceOverride.M.firstYear.BOOL,
          international: params.Item.audienceOverride.M.international.BOOL,
          graduate: params.Item.audienceOverride.M.graduate.BOOL,
        };
      }
      if (params.Item.theme) this.theme = params.Item.theme.S;
      if (params.Item.primaryAffiliationOverride)
        this.primaryAffiliationOverride = params.Item.primaryAffiliationOverride.S;
    }
  }

  /**
   * Insert (or update to match) a User based on the data supplied.
   * * Example use: User.upsert({osuId: 123456, firstName: 'f', lastName:'l', email: 'e', isCanvasOptIn: true, refreshToken: 't'}).then(v => console.log(v))
   * @param props - the user properties to translate to a dynamodb user item
   * @returns Promise<User> - a promise with the User that was inserted/updated
   */
  static upsert = async (props: User): Promise<User> => {
    // ! DynamoDb only supports 'ALL_OLD' or 'NONE' for return values from the
    // ! putItem call, which means the only way to get values from ddb would be to
    // ! getItem with the key after having put the item successfully. The DX use
    // ! doesn't really seem like it needs to fetch the user after having created it
    // ! the first time.
    try {
      const params: AWS.DynamoDB.PutItemInput = {
        TableName: User.TABLE_NAME,
        Item: User.asDynamoDbItem(props),
        ReturnValues: 'NONE',
      };

      const result = await asyncTimedFunction(putItem, 'User:putItem', [params]);
      logger().silly('User.upsert succeeded:', result);
      return props;
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
  static find = async (id: number): Promise<User | null> => {
    try {
      const params: AWS.DynamoDB.GetItemInput = {
        TableName: User.TABLE_NAME,
        Key: {
          osuId: { N: `${id}` },
        },
      };
      const dynamoDbUser = await asyncTimedFunction(getItem, 'User:getItem', [params]);
      if (!Object.keys(dynamoDbUser).length) {
        logger().debug(`User.find(${id} not found.)`);
        return null;
      }
      return new User({ dynamoDbUser });
    } catch (err) {
      logger().error(`User.find(${id}) failed:`, err);
      return null;
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
    const ids = await User.allIds();
    ids.forEach(async (id) => {
      try {
        const params: AWS.DynamoDB.UpdateItemInput = {
          TableName: User.TABLE_NAME,
          Key: {
            osuId: { N: id },
          },
          UpdateExpression: 'REMOVE canvasRefreshToken SET canvasOptIn = :coi',
          ExpressionAttributeValues: {
            ':coi': { BOOL: false },
          },
          ReturnValues: 'UPDATED_NEW',
        };
        const result = await asyncTimedFunction(updateItem, 'User:updateItem', [params]);
        logger().debug('User.clearAllCanvasRefreshTokens updated user:', id, result);
      } catch (err) {
        logger().error(`User.clearAllCanvasRefreshTokens error:`, err);
        errors.push([id, err]);
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
    props: User,
    canvasRefreshToken: string | null,
    canvasOptIn: boolean,
  ): Promise<User> => {
    try {
      const user = props;
      const params: AWS.DynamoDB.UpdateItemInput = {
        TableName: User.TABLE_NAME,
        Key: {
          osuId: { N: user.osuId.toString() },
        },
        ReturnValues: 'NONE',
      };
      params.UpdateExpression = 'SET canvasOptIn = :coi';
      params.ExpressionAttributeValues = { ':coi': { BOOL: canvasOptIn } };

      if (canvasRefreshToken !== null) {
        params.UpdateExpression = 'SET canvasRefreshToken = :crt, canvasOptIn = :coi';
        params.ExpressionAttributeValues = {
          ':coi': { BOOL: canvasOptIn },
          ':crt': { S: canvasRefreshToken },
        };
      }
      await asyncTimedFunction(updateItem, 'User:updateItem', [params]);
      logger().debug(
        `User.updateCanvasData updated user:${user.osuId}, canvasOptIn:${canvasOptIn}, canvasRefreshToken:${canvasRefreshToken}`,
      );
      user.isCanvasOptIn = canvasOptIn;
      user.refreshToken = canvasRefreshToken;
      return user;
    } catch (err) {
      logger().error(`User.updateCanvasData failed:`, err);
      throw err;
    }
  };

  static updateSettings = async (props: User, settings: UserSettings): Promise<User> => {
    try {
      const user = props;
      const theme: string = settings.theme || user.theme || 'light';
      let updateExpressionString = 'SET theme = :t';
      const updateExpressionValues = { ':t': { S: theme } };
      const params: AWS.DynamoDB.UpdateItemInput = {
        TableName: User.TABLE_NAME,
        Key: {
          osuId: { N: user.osuId.toString() },
        },
        ReturnValues: 'NONE',
      };

      // Add Audience Overrides
      if (settings.audienceOverride !== undefined) {
        const { campusCode, firstYear, international, graduate } = settings.audienceOverride;
        const audienceOverrideItem: AudienceOverrideItem = {};
        if (campusCode !== undefined) audienceOverrideItem.campusCode = { S: campusCode };
        if (firstYear !== undefined) audienceOverrideItem.firstYear = { BOOL: firstYear };
        if (international !== undefined)
          audienceOverrideItem.international = { BOOL: international };
        if (graduate !== undefined) audienceOverrideItem.graduate = { BOOL: graduate };

        updateExpressionString += ', audienceOverride = :ao';
        updateExpressionValues[':ao'] = {
          M: audienceOverrideItem,
        };
      }

      // Add Primary Affiliation Overrides
      if (settings.primaryAffiliationOverride !== undefined) {
        const affiliationOverride = settings.primaryAffiliationOverride;
        updateExpressionString += ', primaryAffiliationOverride = :pao';
        updateExpressionValues[':pao'] = { S: affiliationOverride };
      }

      // Store all the override values
      params.UpdateExpression = updateExpressionString;
      params.ExpressionAttributeValues = updateExpressionValues;
      const result: AWS.DynamoDB.UpdateItemOutput = await asyncTimedFunction(
        updateItem,
        'User:updateItem',
        [params],
      );
      logger().silly('User.updateSettings updated user:', user.osuId, result);
      if (settings.audienceOverride) user.audienceOverride = settings.audienceOverride;
      if (settings.primaryAffiliationOverride) {
        user.primaryAffiliationOverride = settings.primaryAffiliationOverride;
      }
      user.theme = theme;
      return user;
    } catch (err) {
      logger().error(`User.updateSettings failed:`, err);
      throw err;
    }
  };

  /**
   * Query a list of all IDs from the Users table.
   * ! This is an expensive (cost-wise and computationally) because it
   * ! must inspect all items in the table.
   * * Example use: User.allIds().then(v => console.log(v))
   * @returns Promise<string[]> - an array of the strings of the IDs
   */
  static allIds = async (): Promise<string[]> => {
    try {
      const params: AWS.DynamoDB.ScanInput = {
        TableName: User.TABLE_NAME,
        AttributesToGet: ['osuId'],
      };
      const results: AWS.DynamoDB.ScanOutput = await asyncTimedFunction(scan, 'User:scan', [
        params,
      ]);
      logger().debug(
        `User.allIds found count:${results.Count}, scanned count:${results.ScannedCount}`,
      );
      return results.Items.map((i: AWS.DynamoDB.AttributeMap) => i.osuId.N);
    } catch (err) {
      logger().error('User.allIds error:', err);
      return [];
    }
  };

  /**
   * Translate the User properties into the properly shaped data as an Item for
   * Dynamodb.
   * @param props - the user properties to translate to a dynamodb user item
   * @returns DynamoDbUserItem - the Item for use in Dynamodb
   */
  static asDynamoDbItem = (props: User): DynamoDBUserItem => {
    const Item: DynamoDBUserItem = {
      osuId: { N: `${props.osuId}` },
      firstName: { S: props.firstName },
      lastName: { S: props.lastName },
      email: { S: props.email },
    };
    if (props.isCanvasOptIn === undefined) {
      Item.canvasOptIn = { BOOL: false };
    } else {
      Item.canvasOptIn = { BOOL: props.isCanvasOptIn };
    }
    if (props.phone) Item.phone = { S: props.phone };
    if (props.primaryAffiliation) Item.primaryAffiliation = { S: props.primaryAffiliation };
    if (props.refreshToken) Item.canvasRefreshToken = { S: props.refreshToken };
    if (props.nameID) Item.nameID = { S: props.nameID };
    if (props.nameIDFormat) Item.nameIDFormat = { S: props.nameIDFormat };
    if (props.audienceOverride && Object.keys(props.audienceOverride).length) {
      Item.audienceOverride = {
        M: {
          campusCode: { S: props.audienceOverride.campusCode },
          firstYear: { BOOL: props.audienceOverride.firstYear },
          international: { BOOL: props.audienceOverride.international },
          graduate: { BOOL: props.audienceOverride.graduate },
        },
      };
    }
    if (props.theme) Item.theme = { S: props.theme };
    if (props.primaryAffiliationOverride) {
      Item.primaryAffiliationOverride = { S: props.primaryAffiliationOverride };
    }
    return Item;
  };
}

export default User;
