/* eslint-disable import/prefer-default-export */

import { rest } from 'msw';
import { server } from '@src/mocks/server';
import { OUTLOOK_API } from '@src/mocks/apis';
import { createTeamsPayload, sendTeamsMessage, cacheFailureOrPing } from '../notifications';

const mockedGetAsync = jest.fn();
const mockedSetAsync = jest.fn();
const mockedDelAsync = jest.fn();

jest.mock('../cache', () => ({
  ...jest.requireActual('../cache') as {},
  getAsync: (key) => mockedGetAsync(key),
  setAsync: (key, value) => mockedSetAsync(key, value),
  delAsync: (key) => mockedDelAsync(key),
}));

const teamsPayload = {
  '@type': 'MessageCard',
  '@context': 'http://schema.org/extensions',
  themeColor: '0076D7',
  summary: 'testing',
  sections: [
    {
      activityTitle: 'testing',
      activitySubtitle: 'testingSub',
      activityImage: 'https://teamsnodesample.azurewebsites.net/static/img/image5.png',
      facts: [
        {
          name: 'fact1',
          value: 'value1',
        },
        {
          name: 'fact2',
          value: 'value2',
        },
      ],
      markdown: true,
    },
  ],
};

describe('Notifications module', () => {
  it('creates the correct payload for MS Teams', () => {
    const title = 'testing';
    const subtitle = 'testingSub';
    const facts = [
      {
        name: 'fact1',
        value: 'value1',
      },
      {
        name: 'fact2',
        value: 'value2',
      },
    ];
    const result = createTeamsPayload(title, subtitle, facts);
    expect(result).toMatchObject(teamsPayload);
  });

  describe('Tests for cacheFailureOrPing', () => {
    it('replaces cache data when cache contents expired', async () => {
      const mockSecThreshhold = 10;
      const mockTime = Date.now() - (mockSecThreshhold + 1) * 1000;
      mockedGetAsync.mockReturnValue(JSON.stringify([{ d: mockTime, e: 'foo' }])); // Make this return cache format w time > timeThreshold
      const testconfig = { timeThreshold: mockSecThreshhold, errThreshold: 5 };
      await cacheFailureOrPing({ e: 'test' }, 'testkey', testconfig);
      expect(mockedSetAsync).toHaveBeenCalled();
      expect(JSON.parse(mockedSetAsync.mock.calls[0][1])).toHaveLength(1);
    });
    it('appends new error data to existing cache cache is not stale and error threshold has not been attained', async () => {
      const mockSecThreshhold = 10;
      const mockTime = Date.now() - (mockSecThreshhold - 1) * 1000;
      mockedGetAsync.mockReturnValue(JSON.stringify([{ d: mockTime, e: 'foo' }])); // time < timeThreshold
      const testconfig = { timeThreshold: mockSecThreshhold, errThreshold: 5 };
      await cacheFailureOrPing({ e: 'test' }, 'testkey', testconfig);
      expect(mockedSetAsync).toHaveBeenCalled();
      expect(JSON.parse(mockedSetAsync.mock.calls[0][1])).toHaveLength(2);
    });
    it('clears cache and sends team message upon reaching error threshold', async () => {
      const mockSecThreshhold = 10;
      const mockTime = Date.now() - (mockSecThreshhold - 1) * 1000;
      mockedGetAsync.mockReturnValue(JSON.stringify([{ d: mockTime, e: 'foo' }])); // time < timeThreshold
      const testconfig = { timeThreshold: mockSecThreshhold, errThreshold: 1 }; // Err threshold of 1, new error should send teams message
      await cacheFailureOrPing({ e: 'test' }, 'testkey', testconfig);
      expect(mockedDelAsync).toHaveBeenCalled();
    });
  });

  describe('Tests for MS Teams Webhook', () => {
    it('should throw error upon message teams failure', async () => {
      server.use(
        rest.post(OUTLOOK_API, async (req, res, ctx) => {
          return res(ctx.status(500));
        }),
      );
      try {
        await sendTeamsMessage(teamsPayload);
      } catch (e) {
        expect(e.status).toEqual(500);
      }
    });
  });
});
