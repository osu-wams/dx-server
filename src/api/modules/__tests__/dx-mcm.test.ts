import nock from 'nock';
import { mockedUserMessages } from '@src/mocks/dx-mcm';
import { DX_MCM_BASE_URL } from '../../../constants';
import {
  getUserMessages,
  channelMessagesUrl,
  userMessageStatusUrl,
  updateUserMessage,
} from '../dx-mcm';
import cache from '../cache'; // eslint-disable-line no-unused-vars

const mockedSetCache = jest.fn();
const mockedGetCache = jest.fn();
jest.mock('../cache.ts', () => ({
  ...jest.requireActual('../cache.ts'),
  setCache: () => mockedSetCache(),
  selectDbAsync: () => jest.fn(),
  getCache: () => mockedGetCache(),
}));

describe('DX Multi-Channel Message Module', () => {
  const { osuId, messageId } = mockedUserMessages[0];
  const status = 'read';
  const getApiResponse = {
    action: 'userMessage-list',
    object: {
      userMessageResults: {
        items: mockedUserMessages,
        count: 1,
      },
    },
  };
  const updateApiResponse = {
    action: 'userMessage-read',
    object: {
      userMessage: mockedUserMessages[0],
    },
  };

  describe('getUserMessages', () => {
    it('fetches a users current messages', async () => {
      nock(DX_MCM_BASE_URL).get(channelMessagesUrl(osuId)).reply(200, getApiResponse);
      mockedGetCache.mockResolvedValue(getApiResponse);
      const result = await getUserMessages(osuId);
      expect(result).toMatchObject({ items: mockedUserMessages, lastKey: undefined });
    });

    it('catches an error response', async () => {
      nock(DX_MCM_BASE_URL).get(channelMessagesUrl(osuId)).reply(500, 'boom');
      try {
        await getUserMessages(osuId);
      } catch (error) {
        expect(error.response).toStrictEqual({
          status: 500,
          statusCode: 500,
          statusText: 'Internal Server Error',
        });
      }
    });
  });

  describe('updateUserMessage', () => {
    it('updates a user messages', async () => {
      const updatedUserMessage = { ...updateApiResponse.object.userMessage, status: 'READ' };
      nock(DX_MCM_BASE_URL)
        .get(userMessageStatusUrl(status, messageId, osuId))
        .reply(200, {
          action: updateApiResponse.action,
          object: {
            userMessage: updatedUserMessage,
          },
        });
      mockedGetCache.mockResolvedValue(undefined);
      const result = await updateUserMessage(status, messageId, osuId);
      expect(result).toMatchObject({ ...mockedUserMessages[0], status: 'READ' });
      expect(result).not.toMatchObject(mockedUserMessages[0]);
    });

    it('catches an error response', async () => {
      nock(DX_MCM_BASE_URL).get(userMessageStatusUrl(status, messageId, osuId)).reply(500, 'boom');
      try {
        await updateUserMessage(status, messageId, osuId);
      } catch (error) {
        expect(error.response).toStrictEqual({
          status: 500,
          statusCode: 500,
          statusText: 'Internal Server Error',
        });
      }
    });
  });
});
