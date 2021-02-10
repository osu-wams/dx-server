import nock from 'nock';
import { mockedUserMessages } from '@src/mocks/dx-mcm';
import { DX_MCM_BASE_URL } from '../../../constants';
import { getUserMessages, markRead, findByChannelPath, markReadPath } from '../dx-mcm';
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
  const { osuId, messageId, onid } = mockedUserMessages[0];
  const getApiResponse = {
    action: 'userMessage-list',
    userMessageResults: {
      items: mockedUserMessages,
      count: 1,
    },
  };

  describe('getUserMessages', () => {
    it('fetches a users current messages', async () => {
      nock(DX_MCM_BASE_URL).get(findByChannelPath(osuId, onid)).reply(200, getApiResponse);
      mockedGetCache.mockResolvedValue(getApiResponse);
      const result = await getUserMessages(osuId, onid);
      expect(result).toMatchObject({ items: mockedUserMessages, lastKey: undefined });
    });

    it('catches an error response', async () => {
      nock(DX_MCM_BASE_URL).get(findByChannelPath(osuId, onid)).reply(500, 'boom');
      try {
        await getUserMessages(osuId, onid);
      } catch (error) {
        expect(error.response).toStrictEqual({
          body: 'boom',
          status: 500,
          statusCode: 500,
          statusText: 'Internal Server Error',
        });
      }
    });
  });

  describe('markRead', () => {
    it('marks a user message as read', async () => {
      const updatedUserMessage = { ...mockedUserMessages[0], status: 'READ' };
      nock(DX_MCM_BASE_URL).get(markReadPath(osuId, onid, messageId)).reply(200, {
        action: 'user-message-mark-read',
        userMessage: updatedUserMessage,
      });
      mockedGetCache.mockResolvedValue(undefined);
      const result = await markRead(osuId, onid, messageId);
      expect(result).toMatchObject({ ...mockedUserMessages[0], status: 'READ' });
      expect(result).not.toMatchObject(mockedUserMessages[0]);
    });

    it('marks all user messages as read', async () => {
      nock(DX_MCM_BASE_URL).get(markReadPath(osuId, onid, 'all')).reply(200, {
        action: 'user-messages-mark-all-read',
        message: '1 marked as read.',
      });
      mockedGetCache.mockResolvedValue(undefined);
      const result = await markRead(osuId, onid);
      expect(result).toStrictEqual({ message: '1 marked as read.' });
    });

    it('catches an error response', async () => {
      nock(DX_MCM_BASE_URL).get(markReadPath(osuId, onid, messageId)).reply(500, 'boom');
      try {
        await markRead(osuId, onid, messageId);
      } catch (error) {
        expect(error.response).toStrictEqual({
          body: 'boom',
          status: 500,
          statusCode: 500,
          statusText: 'Internal Server Error',
        });
      }
    });
  });
});
