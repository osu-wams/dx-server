import AWS from 'aws-sdk'; // eslint-disable-line no-unused-vars
import { SamlUser } from '../../modules/user-account'; // eslint-disable-line no-unused-vars
import User from '../user';
import * as dynamoDb from '../../../db';

jest.mock('../../../db');
const mockDynamoDb = dynamoDb as jest.Mocked<any>;

const samlUser: SamlUser = {
  osu_id: '8675309',
  first_name: 'Bob',
  last_name: 'Ross',
  email: 'bob@bobross.com',
  phone: '5551212',
  primaryAffiliation: 'employee',
};

let dynamoDbUser: AWS.DynamoDB.GetItemOutput = {
  Item: {
    osuId: { N: '8675309' },
    firstName: { S: 'Bob' },
    lastName: { S: 'Ross' },
    email: { S: 'bob@bobross.com' },
    phone: { S: '5551212' },
    primaryAffiliation: { S: 'employee' },
    canvasRefreshToken: { S: 'refresh-me' },
    canvasOptIn: { BOOL: true },
  },
};

describe('User model', () => {
  it('has the DynamoDB table name defined', () => {
    expect(User.TABLE_NAME).toBe(`${User.TABLE_NAME}`);
  });

  describe('constructs a new instance', () => {
    it('builds a User from SAML data', () => {
      const user = new User({ samlUser });
      expect(user.osuId).toEqual(parseInt(samlUser.osu_id, 10));
      expect(user.firstName).toEqual(samlUser.first_name);
      expect(user.lastName).toEqual(samlUser.last_name);
      expect(user.phone).toEqual(samlUser.phone);
      expect(user.email).toEqual(samlUser.email);
      expect(user.canvasOauthExpire).toEqual(0);
      expect(user.canvasOauthToken).toEqual('');
      expect(user.isAdmin).toEqual(false);
      expect(user.groups).toEqual([]);
      expect(user.isCanvasOptIn).toEqual(false);
      expect(user.refreshToken).toEqual('');
      expect(user.primaryAffiliation).toEqual('employee');
    });

    describe('with DynamoDb data', () => {
      it('builds a fully fleshed out User from DynamoDb data', () => {
        const user = new User({ dynamoDbUser });
        expect(user.osuId).toEqual(parseInt(dynamoDbUser.Item.osuId.N, 10));
        expect(user.firstName).toEqual(dynamoDbUser.Item.firstName.S);
        expect(user.lastName).toEqual(dynamoDbUser.Item.lastName.S);
        expect(user.phone).toEqual(dynamoDbUser.Item.phone.S);
        expect(user.email).toEqual(dynamoDbUser.Item.email.S);
        expect(user.canvasOauthExpire).toEqual(0);
        expect(user.canvasOauthToken).toEqual('');
        expect(user.isAdmin).toEqual(false);
        expect(user.groups).toEqual([]);
        expect(user.isCanvasOptIn).toEqual(dynamoDbUser.Item.canvasOptIn.BOOL);
        expect(user.refreshToken).toEqual(dynamoDbUser.Item.canvasRefreshToken.S);
        expect(user.primaryAffiliation).toEqual(dynamoDbUser.Item.primaryAffiliation.S);
      });
      it('builds a User missing some data', () => {
        dynamoDbUser = {
          Item: {
            osuId: { N: '8675309' },
          },
        };
        const user = new User({ dynamoDbUser });
        expect(user.osuId).toEqual(parseInt(dynamoDbUser.Item.osuId.N, 10));
        expect(user.firstName).toBeUndefined();
        expect(user.lastName).toBeUndefined();
        expect(user.phone).toBeUndefined();
        expect(user.email).toBeUndefined();
      });
    });
  });

  describe('translates a User instance into a DynamoDB Item', () => {
    let user;

    beforeEach(() => {
      user = new User({ samlUser });
    });

    it('builds the most basic item', () => {
      user.phone = undefined;
      const item = User.asDynamoDbItem(user);
      expect(item.phone).toBe(undefined);
      expect(item.canvasRefreshToken).toBe(undefined);
      expect(item.canvasOptIn).toStrictEqual({ BOOL: false });
      expect(item.osuId.N).toBe(samlUser.osu_id);
      expect(item.firstName.S).toBe(samlUser.first_name);
      expect(item.lastName.S).toBe(samlUser.last_name);
      expect(item.email.S).toBe(samlUser.email);
      expect(item.primaryAffiliation.S).toBe(samlUser.primaryAffiliation);
    });
    it('builds an item with a phone', () => {
      const item = User.asDynamoDbItem(user);
      expect(item.phone.S).toBe(samlUser.phone);
    });
    it('builds an item with a refresh token', () => {
      user.refreshToken = 'mahToken';
      const item = User.asDynamoDbItem(user);
      expect(item.canvasRefreshToken.S).toBe(user.refreshToken);
    });
    it('builds an item with canvas opt in', () => {
      user.isCanvasOptIn = false;
      const item = User.asDynamoDbItem(user);
      expect(item.canvasOptIn.BOOL).toBe(user.isCanvasOptIn);
    });
    it('builds an item with canvas opt in', () => {
      user.isCanvasOptIn = undefined;
      const item = User.asDynamoDbItem(user);
      expect(item.canvasOptIn.BOOL).toBe(false);
    });
  });

  describe('with DynamoDb API calls', () => {
    let user: User;

    beforeEach(() => {
      user = new User({ samlUser });
    });

    describe('allIds', () => {
      it('returns 1 item', async () => {
        const ids = await User.allIds();
        expect(ids).toStrictEqual(['123456']);
      });
      it('returns an empty array on error', async () => {
        mockDynamoDb.scan.mockImplementationOnce(() =>
          Promise.reject(new Error('happy little accident')),
        );
        const ids = await User.allIds();
        expect(ids).toStrictEqual([]);
      });
    });

    describe('updateCanvasData', () => {
      it('returns the user', async () => {
        expect.assertions(2);
        const result = await User.updateCanvasData(user, 'bob-ross', true);
        expect(result.refreshToken).toBe('bob-ross');
        expect(result.isCanvasOptIn).toBe(true);
      });
      it('throws an error on failure', async () => {
        mockDynamoDb.updateItem.mockImplementationOnce(() =>
          Promise.reject(new Error('happy little accident')),
        );
        try {
          await User.updateCanvasData(user, 'bob-ross', true);
        } catch (err) {
          expect(err.message).toBe('happy little accident');
        }
      });
    });

    describe('clearAllCanvasRefreshTokens', () => {
      it('returns success with no errors ', async () => {
        expect.assertions(1);
        const result = await User.clearAllCanvasRefreshTokens();
        expect(result).toStrictEqual([true, []]);
      });
      it('throws an error on failure', async () => {
        mockDynamoDb.updateItem.mockImplementationOnce(() =>
          Promise.reject(new Error('happy little accident')),
        );
        try {
          await User.clearAllCanvasRefreshTokens();
        } catch (err) {
          expect(err.message).toBe('happy little accident');
        }
      });
    });

    describe('find', () => {
      it('returns user with no errors ', async () => {
        expect.assertions(1);
        const result = await User.find(user.osuId);
        expect(result).toStrictEqual(user);
      });
      it('throws an error on failure', async () => {
        mockDynamoDb.getItem.mockImplementationOnce(() =>
          Promise.reject(new Error('happy little accident')),
        );
        try {
          await User.find(user.osuId);
        } catch (err) {
          expect(err.message).toStrictEqual('happy little accident');
        }
      });
      it('throws an error when no user is found', async () => {
        mockDynamoDb.getItem.mockImplementationOnce(() => Promise.resolve({}));
        try {
          await User.find(user.osuId);
        } catch (err) {
          expect(err.message).toStrictEqual('happy little accident');
        }
      });
    });

    describe('upsert', () => {
      it('returns user with no errors ', async () => {
        expect.assertions(1);
        const result = await User.upsert(user);
        expect(result).toStrictEqual(user);
      });
      it('returns user with updated attributes ', async () => {
        expect.assertions(2);
        const original = await User.upsert(user);
        expect(original).toStrictEqual(user);
        user.primaryAffiliation = 'student';
        const updated = await User.upsert(user);
        expect(updated).toStrictEqual(user);
      });
      it('throws an error on failure', async () => {
        mockDynamoDb.putItem.mockImplementationOnce(() =>
          Promise.reject(new Error('happy little accident')),
        );
        try {
          await User.upsert(user);
        } catch (err) {
          expect(err.message).toStrictEqual('happy little accident');
        }
      });
    });

    describe('updateSettings', () => {
      it('updates audienceOverride settings', async () => {
        const result = await User.updateSettings(user, {
          audienceOverride: { campusCode: 'C' },
        });
        expect(result.audienceOverride).toStrictEqual({ campusCode: 'C' });
      });

      it('updates primaryAffiliationOverride settings', async () => {
        const result = await User.updateSettings(user, {
          primaryAffiliationOverride: 'student',
        });
        expect(result.primaryAffiliationOverride).toStrictEqual('student');
      });

      it('throws an error on failure', async () => {
        mockDynamoDb.updateItem.mockImplementationOnce(() =>
          Promise.reject(new Error('happy little accident')),
        );
        try {
          await User.updateSettings(user, {
            audienceOverride: { campusCode: 'C' },
          });
        } catch (err) {
          expect(err.message).toStrictEqual('happy little accident');
        }
      });
    });
  });
});
