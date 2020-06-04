import supertest from 'supertest';
import nock from 'nock';
import config from 'config';
import { mockedUserMessages } from '@src/mocks/dx-mcm';
import cache from '../modules/cache'; // eslint-disable-line no-unused-vars
import app from '../../index';
import { UserSettings } from '../models/user'; // eslint-disable-line no-unused-vars
import { GROUPS } from '../../constants'; // eslint-disable-line no-unused-vars
import { mockedGet, mockedGetResponse } from '../modules/__mocks__/cache';
import * as dynamoDb from '../../db';

jest.mock('../../db');
const mockDynamoDb = dynamoDb as jest.Mocked<any>; // eslint-disable-line no-unused-vars

jest.mock('../util.ts', () => ({
  ...jest.requireActual('../util.ts'),
  getToken: () => Promise.resolve('bearer token'),
}));

const mockedGetUserMessages = jest.fn();
const mockedUpdateUserMessage = jest.fn();
jest.mock('../modules/dx-mcm.ts', () => ({
  ...jest.requireActual('../modules/dx-mcm.ts'),
  getUserMessages: async () => mockedGetUserMessages(),
  updateUserMessage: async () => mockedUpdateUserMessage(),
}));

const APIGEE_BASE_URL: string = config.get('osuApi.baseUrl');
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
      },
    };

    it('updates audienceOverride settings', async () => {
      await request
        .post('/api/user/settings')
        .send(settings)
        .expect(200, { audienceOverride: { campusCode: 'C' }, theme: 'light' });
    });

    it('returns an error for failed audienceOverride settings', async () => {
      mockDynamoDb.updateItem.mockImplementationOnce(() =>
        Promise.reject(new Error('happy little accident')),
      );
      await request
        .post('/api/user/settings')
        .send(settings)
        .expect(500, { message: 'Failed to update users settings.' });
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
      mockedUpdateUserMessage.mockReturnValue({
        userMessage: updatedUserMessage,
      });
      await request
        .post('/api/user/messages')
        .send({ status: 'READ', messageId: mockedUserMessages[0].messageId })
        .expect(200, { userMessage: updatedUserMessage });
    });

    it('will not update a user message with an invalid status', async () => {
      await request
        .post('/api/user/messages')
        .send({ status: 'invalid-status', messageId: mockedUserMessages[0].messageId })
        .expect(500, { message: 'Failed to update user message.' });
    });

    it('returns an error for failed updating a message', async () => {
      mockedUpdateUserMessage.mockImplementation(async () => {
        throw new Error('boom');
      });
      await request
        .post('/api/user/messages')
        .send({ status: 'READ', messageId: mockedUserMessages[0].messageId })
        .expect(500, { message: 'Failed to update user message.' });
    });
  });
});
