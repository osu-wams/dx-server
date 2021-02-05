import { dynamoDbHandler } from '@src/mocks/handlers';
import { server } from '@src/mocks/server';
import { mockUser, mockDynamoDbUser } from '@src/api/models/__mocks__/user';
import User from '../user';

describe('User model', () => {
  it('has the DynamoDB table name defined', () => {
    expect(User.TABLE_NAME).toBe(`${User.TABLE_NAME}`);
  });

  describe('with DynamoDb API calls', () => {
    describe('scanAll', () => {
      it('returns 1 item', async () => {
        const users = await User.scanAll();
        expect(users.length).toStrictEqual(1);
      });
    });

    describe('updateCanvasData', () => {
      it('returns the user', async () => {
        const value = 'bob-ross';
        const itemMap = {};
        itemMap[User.TABLE_NAME] = {
          Query: {
            Count: 1,
            ScannedCount: 1,
            Items: [
              {
                ...mockDynamoDbUser,
                canvasRefreshToken: { S: value },
                canvasOptIn: { BOOL: true },
              },
            ],
          },
        };
        dynamoDbHandler(server, itemMap);
        const result = await User.updateCanvasData(mockUser, value, true);
        expect(result.canvasRefreshToken).toBe(value);
        expect(result.canvasOptIn).toBeTruthy();
      });
    });

    describe('clearAllCanvasRefreshTokens', () => {
      it('returns success with no errors ', async () => {
        const result = await User.clearAllCanvasRefreshTokens();
        expect(result).toStrictEqual([true, []]);
      });
    });

    describe('find', () => {
      it('returns user with no errors ', async () => {
        const result = await User.find(mockUser.osuId);
        expect(JSON.stringify(result)).toEqual(JSON.stringify(mockUser));
      });
      it('throws an error when no user is found', async () => {
        const itemMap = {};
        itemMap[User.TABLE_NAME] = {
          Query: {
            Count: 1,
            ScannedCount: 1,
            Items: [mockDynamoDbUser],
          },
        };
        dynamoDbHandler(server, itemMap);
        try {
          const result = await User.find(999999999);
          expect(result).not.toBeNull();
        } catch (err) {
          expect(err.message).toStrictEqual('happy little accident');
        }
      });
    });

    describe('upsert', () => {
      it('returns user with no errors ', async () => {
        const value = '123';
        const itemMap = {};
        itemMap[User.TABLE_NAME] = {
          Update: {}, // not necessary
          Query: {
            Count: 1,
            ScannedCount: 1,
            Items: [{ ...mockDynamoDbUser, phone: { S: value } }],
          },
        };
        dynamoDbHandler(server, itemMap);
        const result = await User.upsert({ ...mockUser, phone: value });
        expect(result.affiliations.values).toStrictEqual(mockUser.affiliations);
        result.affiliations = null;
        mockUser.affiliations = null;
        expect(result).toStrictEqual({ ...mockUser, phone: value });
      });
      it('does not persist optional sets', async () => {
        const itemMap = {};
        itemMap[User.TABLE_NAME] = {
          Update: {}, // not necessary
          Query: {
            Count: 1,
            ScannedCount: 1,
            Items: [{ ...mockDynamoDbUser }],
          },
        };
        dynamoDbHandler(server, itemMap);
        const result = await User.upsert({ ...mockUser, groups: [], colleges: [] });
        expect(result.groups).toBeFalsy();
        expect(result.colleges).toBeFalsy();
      });
    });

    describe('updateSettings', () => {
      it('updates audienceOverride settings', async () => {
        const overrides = {
          campusCode: 'C',
          international: true,
          graduate: true,
          firstYear: true,
          colleges: ['1', '2'],
        };
        const itemMap = {};
        itemMap[User.TABLE_NAME] = {
          Update: {}, // not necessary
          Query: {
            Count: 1,
            ScannedCount: 1,
            Items: [
              {
                ...mockDynamoDbUser,
                audienceOverride: {
                  M: {
                    campusCode: { S: overrides.campusCode },
                    international: { BOOL: overrides.international },
                    graduate: { BOOL: overrides.graduate },
                    firstYear: { BOOL: overrides.firstYear },
                    colleges: { SS: overrides.colleges },
                  },
                },
              },
            ],
          },
        };
        dynamoDbHandler(server, itemMap);
        const result = await User.updateSettings(mockUser, { audienceOverride: overrides });
        expect(result.audienceOverride.campusCode).toStrictEqual(overrides.campusCode);
        expect(result.audienceOverride.international).toStrictEqual(overrides.international);
        expect(result.audienceOverride.graduate).toStrictEqual(overrides.graduate);
        expect(result.audienceOverride.firstYear).toStrictEqual(overrides.firstYear);
        expect(result.audienceOverride.colleges.values).toStrictEqual(overrides.colleges);
      });

      it('can update a singular audienceOverride setting', async () => {
        const value = 'C';
        const itemMap = {};
        itemMap[User.TABLE_NAME] = {
          Update: {}, // not necessary
          Query: {
            Count: 1,
            ScannedCount: 1,
            Items: [{ ...mockDynamoDbUser, audienceOverride: { M: { campusCode: { S: value } } } }],
          },
        };
        dynamoDbHandler(server, itemMap);
        const result = await User.updateSettings(mockUser, {
          audienceOverride: { campusCode: value },
        });
        expect(result.audienceOverride).toStrictEqual({ campusCode: value });
      });

      it('updates primaryAffiliationOverride settings', async () => {
        const value = 'student';
        const itemMap = {};
        itemMap[User.TABLE_NAME] = {
          Update: {}, // not necessary
          Query: {
            Count: 1,
            ScannedCount: 1,
            Items: [{ ...mockDynamoDbUser, primaryAffiliationOverride: { S: value } }],
          },
        };
        dynamoDbHandler(server, itemMap);
        const result = await User.updateSettings(mockUser, {
          primaryAffiliationOverride: value,
        });
        expect(result.primaryAffiliationOverride).toStrictEqual(value);
      });
    });
  });
});
