/* eslint-disable no-console */
// TODO: Replace all console.log/debug/error with winston logging

import config from 'config';
import { SamlUser } from '../modules/user-account'; // eslint-disable-line no-unused-vars
import { scan, updateItem, getItem, putItem } from '../../db';

const tablePrefix = config.get('aws.dynamodb.tablePrefix');

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
}

class User {
  osuId: number;

  firstName: string;

  lastName: string;

  email: string;

  phone?: string;

  isAdmin?: boolean = false;

  refreshToken?: string = '';

  canvasOauthExpire?: number = 0;

  canvasOauthToken?: string = '';

  isCanvasOptIn?: boolean = false;

  nameIDFormat?: string = '';

  nameID?: string = '';

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
    }

    if (p.dynamoDbUser) {
      const params = p.dynamoDbUser;
      // The partition key is required and the data is stored as a string
      this.osuId = parseInt(params.Item.osuId.N, 10);
      if (params.Item.firstName) this.firstName = params.Item.firstName.S;
      if (params.Item.lastName) this.lastName = params.Item.lastName.S;
      if (params.Item.email) this.email = params.Item.email.S;
      if (params.Item.phone) this.phone = params.Item.phone.S;
      if (params.Item.canvasRefreshToken)
        this.refreshToken = params.Item.canvasRefreshToken.S || this.refreshToken;
      if (params.Item.canvasOptIn !== undefined) {
        this.isCanvasOptIn = params.Item.canvasOptIn.BOOL || this.isCanvasOptIn;
      } else {
        this.isCanvasOptIn = false;
      }
    }
  }

  /**
   * Insert (or update to match) a User based on the data supplied.
   * * Example use: User.insert({osuId: 123456, firstName: 'f', lastName:'l', email: 'e', isCanvasOptIn: true, refreshToken: 't'}).then(v => console.log(v))
   * @param props - the user properties to translate to a dynamodb user item
   * @returns Promise<User> - a promise with the User that was inserted/updated
   */
  static insert = async (props: User): Promise<User> => {
    // ! DynamoDb only supports 'ALL_OLD' or 'NONE' for return values from the
    // ! putItem call, which means the only way to get values from ddb would be to
    // ! getItem with the key after having put the item successfully. The DX use
    // ! doesn't really seem like it needs to fetch the user after having created it
    // ! the first time.
    try {
      const params: AWS.DynamoDB.PutItemInput = {
        TableName: User.TABLE_NAME,
        Item: User.asDynamoDbItem(props),
        ReturnValues: 'NONE'
      };

      const result = await putItem(params);
      console.debug('User.insert succeeded:', result);
      return props;
    } catch (err) {
      console.error(`User.insert error`, props, err);
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
          osuId: { N: `${id}` }
        }
      };
      const dynamoDbUser = await getItem(params);
      if (!Object.keys(dynamoDbUser).length) throw new Error('User not found.');
      return new User({ dynamoDbUser });
    } catch (err) {
      console.error(`User.find(${id}) error:`, err);
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
    ids.forEach(async id => {
      try {
        const params: AWS.DynamoDB.UpdateItemInput = {
          TableName: User.TABLE_NAME,
          Key: {
            osuId: { N: id }
          },
          UpdateExpression: 'REMOVE canvasRefreshToken SET canvasOptIn = :coi',
          ExpressionAttributeValues: {
            ':coi': { BOOL: false }
          },
          ReturnValues: 'UPDATED_NEW'
        };
        const result = await updateItem(params);
        console.debug('User.clearAllCanvasRefreshTokens updated user:', id, result);
      } catch (err) {
        console.error(`User.clearAllCanvasRefreshTokens error:`, err);
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
    canvasRefreshToken: string,
    canvasOptIn: boolean
  ): Promise<User> => {
    try {
      const user = props;
      const params: AWS.DynamoDB.UpdateItemInput = {
        TableName: User.TABLE_NAME,
        Key: {
          osuId: { N: user.osuId.toString() }
        },
        UpdateExpression: 'SET canvasRefreshToken = :crt, canvasOptIn = :coi',
        ExpressionAttributeValues: {
          ':coi': { BOOL: canvasOptIn },
          ':crt': { S: canvasRefreshToken }
        },
        ReturnValues: 'NONE'
      };
      const result: AWS.DynamoDB.UpdateItemOutput = await updateItem(params);
      console.debug('User.updateCanvasData updated user:', user.osuId, result);
      user.isCanvasOptIn = canvasOptIn;
      user.refreshToken = canvasRefreshToken;
      return user;
    } catch (err) {
      console.error(`User.updateCanvasData error:`, err);
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
        AttributesToGet: ['osuId']
      };
      const results: AWS.DynamoDB.ScanOutput = await scan(params);
      console.debug(
        `User.allIds found count:${results.Count}, scanned count:${results.ScannedCount}`
      );
      return results.Items.map((i: AWS.DynamoDB.AttributeMap) => i.osuId.N);
    } catch (err) {
      console.error('User.allIds error:', err);
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
      email: { S: props.email }
    };
    if (props.isCanvasOptIn === undefined) {
      Item.canvasOptIn = { BOOL: false };
    } else {
      Item.canvasOptIn = { BOOL: props.isCanvasOptIn };
    }
    if (props.phone) Item.phone = { S: props.phone };
    if (props.refreshToken) Item.canvasRefreshToken = { S: props.refreshToken };
    if (props.nameID) Item.nameID = { S: props.nameID };
    if (props.nameIDFormat) Item.nameIDFormat = { S: props.nameIDFormat };
    return Item;
  };
}

export default User;
