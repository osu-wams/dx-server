import supertest from 'supertest';
import nock from 'nock';
import { mockedUserMessages } from '@src/mocks/dx-mcm';
import cache from '@src/api/modules/cache'; // eslint-disable-line no-unused-vars
import app from '@src/index';
import User, { UserSettings } from '@src/api/models/user'; // eslint-disable-line no-unused-vars
import { GROUPS, OSU_API_BASE_URL } from '@src/constants'; // eslint-disable-line no-unused-vars
import { mockedGet, mockedGetResponse } from '@src/api/modules/__mocks__/cache';
import { mockDynamoDbUser } from '@src/api/models/__mocks__/user';
import { dynamoDbHandler } from '@src/mocks/handlers';
import { server } from '@src/mocks/server';

jest.mock('../util.ts', () => ({
  ...jest.requireActual('../util.ts'),
  getToken: () => Promise.resolve('bearer token'),
}));

const mockedGetUserMessages = jest.fn();
const mockedMarkRead = jest.fn();
jest.mock('../modules/dx-mcm.ts', () => ({
  ...jest.requireActual('../modules/dx-mcm.ts'),
  getUserMessages: async () => mockedGetUserMessages(),
  markRead: async () => mockedMarkRead(),
}));

const APIGEE_BASE_URL: string = `${OSU_API_BASE_URL}/v1`;
let request: supertest.SuperTest<supertest.Test>;
beforeAll(async () => {
  request = supertest.agent(app);
});

describe('/api/user', () => {
  beforeEach(async () => {
    // Authenticate before each request
    await request.get('/login');
  });

  it('return user session data', async () => {
    await request.get('/api/user').expect(200, {
      osuId: 111111111,
      firstName: 'Test',
      lastName: 'User',
      email: 'fake-email@oregonstate.edu',
      isAdmin: true,
      groups: Object.keys(GROUPS),
      isCanvasOptIn: true,
      classification: {},
      audienceOverride: {},
      devTools: false,
      colleges: [],
    });
  });

  it('return user classification data', async () => {
    const data = {
      id: 'id',
      attributes: {
        level: 'level',
        classification: 'classification',
        campus: 'campus',
        status: 'status',
        isInternational: false,
      },
    };
    mockedGetResponse.mockReturnValue({ data });
    cache.get = mockedGet;
    nock(APIGEE_BASE_URL)
      .get(/v1\/students\/[0-9]+\/classification/)
      .reply(200, { data });

    await request.get('/api/user/classification').expect(200, {
      id: 'id',
      attributes: {
        level: 'level',
        classification: 'classification',
        campus: 'campus',
        status: 'status',
        isInternational: false,
      },
    });
  });

  describe('/settings', () => {
    const settings: UserSettings = {
      audienceOverride: {
        campusCode: 'C',
        firstYear: true,
        international: true,
        graduate: true,
        colleges: ['1', '2'],
      },
    };

    it('updates audienceOverride settings', async () => {
      const itemMap = {};
      itemMap[User.TABLE_NAME] = {
        Query: {
          Count: 1,
          ScannedCount: 1,
          Items: [
            {
              ...mockDynamoDbUser,
              audienceOverride: {
                M: {
                  campusCode: { S: settings.audienceOverride.campusCode },
                  firstYear: { BOOL: settings.audienceOverride.firstYear },
                  international: { BOOL: settings.audienceOverride.international },
                  graduate: { BOOL: settings.audienceOverride.graduate },
                  colleges: { SS: settings.audienceOverride.colleges },
                },
              },
              theme: { S: 'light' },
              devTools: { BOOL: false },
            },
          ],
        },
      };
      dynamoDbHandler(server, itemMap);
      await request.post('/api/user/settings').send(settings).expect(200, {
        audienceOverride: settings.audienceOverride,
        theme: 'light',
        devTools: false,
      });
    });

    it('can update a singular audienceOverride setting', async () => {
      const itemMap = {};
      itemMap[User.TABLE_NAME] = {
        Query: {
          Count: 1,
          ScannedCount: 1,
          Items: [
            {
              ...mockDynamoDbUser,
              audienceOverride: {
                M: {
                  campusCode: { S: 'B' },
                },
              },
              theme: { S: 'light' },
              devTools: { BOOL: false },
            },
          ],
        },
      };
      dynamoDbHandler(server, itemMap);
      await request
        .post('/api/user/settings')
        .send({ ...settings, audienceOverride: { campusCode: 'B' } })
        .expect(200, {
          audienceOverride: { campusCode: 'B' },
          theme: 'light',
          devTools: false,
        });
    });
  });

  describe('get /messages', () => {
    it('fetches user messages', async () => {
      mockedGetUserMessages.mockReturnValue({ items: mockedUserMessages });
      await request.get('/api/user/messages').expect(200, { items: mockedUserMessages });
    });

    it('returns an error for failed fetching messages', async () => {
      mockedGetUserMessages.mockImplementation(async () => {
        throw new Error('boom');
      });
      await request
        .get('/api/user/messages')
        .expect(500, { message: 'Failed to fetch user messages.' });
    });
  });

  describe('post /messages', () => {
    it('updates user message', async () => {
      const updatedUserMessage = { ...mockedUserMessages[0], status: 'READ' };
      mockedMarkRead.mockReturnValue({ userMessage: updatedUserMessage });
      await request
        .post('/api/user/messages')
        .send({ status: 'READ', messageId: mockedUserMessages[0].messageId })
        .expect(200, { userMessage: updatedUserMessage });
    });

    it('marks all user messages as read when messageId is not provided', async () => {
      mockedMarkRead.mockReturnValue({ message: '1 marked as read.' });
      await request
        .post('/api/user/messages')
        .send({ status: 'READ' })
        .expect(200, { message: '1 marked as read.' });
    });

    it('marks all user messages as read when messageId is "all"', async () => {
      mockedMarkRead.mockReturnValue({ message: '1 marked as read.' });
      await request
        .post('/api/user/messages')
        .send({ status: 'READ', messageId: 'all' })
        .expect(200, { message: '1 marked as read.' });
    });

    it('will not update a user message with an invalid status', async () => {
      await request
        .post('/api/user/messages')
        .send({ status: 'invalid-status', messageId: mockedUserMessages[0].messageId })
        .expect(500, { message: 'Failed to update user message.' });
    });

    it('returns an error for failed updating a message', async () => {
      mockedMarkRead.mockImplementation(async () => {
        throw new Error('boom');
      });
      await request
        .post('/api/user/messages')
        .send({ status: 'READ', messageId: mockedUserMessages[0].messageId })
        .expect(500, { message: 'Failed to update user message.' });
    });
  });
});
