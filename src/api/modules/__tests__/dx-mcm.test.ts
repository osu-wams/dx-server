import { rest } from 'msw';
import { server } from '@src/mocks/server';
import { mockedUserMessages } from '@src/mocks/dx-mcm';
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
  const FIND_BY_CHANNEL_MCM_URL = new RegExp(String.raw`${findByChannelPath(osuId, onid)}`);
  const MARK_READ_PATH_MCM_URL = new RegExp(String.raw`${markReadPath(osuId, onid, messageId)}`);

  const getApiResponse = {
    action: 'userMessage-list',
    userMessageResults: {
      items: mockedUserMessages,
      count: 1,
    },
  };

  describe('getUserMessages', () => {
    it('fetches a users current messages', async () => {
      server.use(
        rest.get(FIND_BY_CHANNEL_MCM_URL, async (req, res, ctx) => {
          return res(ctx.status(200), ctx.json(getApiResponse));
        }),
      );

      mockedGetCache.mockResolvedValue(getApiResponse);
      const result = await getUserMessages(osuId, onid);
      expect(result).toMatchObject({
        items: mockedUserMessages,
        lastKey: undefined,
      });
    });

    it('catches an error response', async () => {
      server.use(
        rest.get(FIND_BY_CHANNEL_MCM_URL, async (req, res, ctx) => {
          return res(ctx.status(500), ctx.body('boom'));
        }),
      );
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
      server.use(
        rest.get(MARK_READ_PATH_MCM_URL, async (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json({
              action: 'user-message-mark-read',
              userMessage: updatedUserMessage,
            }),
          );
        }),
      );
      mockedGetCache.mockResolvedValue(undefined);
      const result = await markRead(osuId, onid, messageId);
      expect(result).toMatchObject({
        ...mockedUserMessages[0],
        status: 'READ',
      });
      expect(result).not.toMatchObject(mockedUserMessages[0]);
    });

    it('marks all user messages as read', async () => {
      server.use(
        rest.get(
          new RegExp(String.raw`${markReadPath(osuId, onid, 'all')}`),
          async (req, res, ctx) => {
            return res(
              ctx.status(200),
              ctx.json({
                action: 'user-message-mark-read',
                message: '1 marked as read.',
              }),
            );
          },
        ),
      );
      mockedGetCache.mockResolvedValue(undefined);
      const result = await markRead(osuId, onid);
      expect(result).toStrictEqual({ message: '1 marked as read.' });
    });

    it('catches an error response', async () => {
      server.use(
        rest.get(MARK_READ_PATH_MCM_URL, async (req, res, ctx) => {
          return res(ctx.status(500), ctx.body('boom'));
        }),
      );
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
