import nock from 'nock';
import { mockedUserMessages } from '@src/mocks/dx-mcm';
import { DX_MCM_BASE_URL } from '../../../constants';
import getUserMessages, { channelMessagesUrl } from '../dx-mcm';
import cache from '../cache'; // eslint-disable-line no-unused-vars

const mockedGetCache = jest.fn();

describe('DX Multi-Channel Message Module', () => {
  const osuId = '111111111';
  const apiResponse = {
    action: 'userMessage-list',
    object: {
      userMessageResults: {
        items: mockedUserMessages,
        count: 1,
      },
    },
  };

  describe('getUserMessages', () => {
    it('fetches a users current messages', async () => {
      nock(DX_MCM_BASE_URL).get(channelMessagesUrl(osuId)).reply(200, apiResponse);
      mockedGetCache.mockResolvedValue(apiResponse);
      cache.get = mockedGetCache;
      const result = await getUserMessages(osuId);
      expect(result).toMatchObject({ items: mockedUserMessages, lastKey: undefined });
    });

    it('catches an error response', async () => {
      nock(DX_MCM_BASE_URL).get(channelMessagesUrl(osuId)).reply(500, 'boom');
      try {
        await getUserMessages(osuId);
      } catch (error) {
        expect(error).toEqual('boom');
      }
    });
  });
});
