import nock from 'nock';
import config from 'config';

import { createTeamsPayload, sendTeamsMessage, cacheFailureOrPing } from '../notifications';
export const MS_TEAMS_URL: string = config.get('msTeamsHook');

const mockedGetAsync = jest.fn();
const mockedSetAsync = jest.fn();
const mockedDelAsync = jest.fn();

jest.mock('../cache', () => ({
  ...jest.requireActual('../cache'),
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
  beforeEach(() => {
    nock('https://outlook.office.com')
      .filteringPath((path) => '/')
      .post('/')
      .reply(200);
  });
  afterEach(() => nock.cleanAll());

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

      mockedGetAsync.mockReturnValue(JSON.stringify([{ d: mockTime, e: 'foo' }])); //Make this return cache format w time > timeThreshold

      const config = { timeThreshold: mockSecThreshhold, errThreshold: 5 };

      await cacheFailureOrPing({ e: 'test' }, 'testkey', config);

      expect(mockedSetAsync).toHaveBeenCalled();

      expect(JSON.parse(mockedSetAsync.mock.calls[0][1])).toHaveLength(1);
    });
    it('appends new error data to existing cache cache is not stale and error threshold has not been attained', async () => {
      const mockSecThreshhold = 10;

      const mockTime = Date.now() - (mockSecThreshhold - 1) * 1000;

      mockedGetAsync.mockReturnValue(JSON.stringify([{ d: mockTime, e: 'foo' }])); // time < timeThreshold

      const config = { timeThreshold: mockSecThreshhold, errThreshold: 5 };

      await cacheFailureOrPing({ e: 'test' }, 'testkey', config);

      expect(mockedSetAsync).toHaveBeenCalled();

      expect(JSON.parse(mockedSetAsync.mock.calls[0][1])).toHaveLength(2);
    });
    it('clears cache and sends team message upon reaching error threshold', async () => {
      const mockSecThreshhold = 10;

      const mockTime = Date.now() - (mockSecThreshhold - 1) * 1000;

      mockedGetAsync.mockReturnValue(JSON.stringify([{ d: mockTime, e: 'foo' }])); // time < timeThreshold

      const config = { timeThreshold: mockSecThreshhold, errThreshold: 1 }; //Err threshold of 1, new error should send teams message

      await cacheFailureOrPing({ e: 'test' }, 'testkey', config);

      expect(mockedDelAsync).toHaveBeenCalled();
    });
  });

  describe('Tests for MS Teams Webhook', () => {
    it('should send message to teams', async () => {
      const result = await sendTeamsMessage(teamsPayload);
      expect(result).toBeTruthy();
    });

    it('should throw error upon message teams failure', async () => {
      nock('https://outlook.office.com')
        .filteringPath((path) => '/')
        .post('/')
        .reply(500);
      try {
        await sendTeamsMessage(teamsPayload);
      } catch (e) {
        expect(e.status).toEqual(500);
      }
    });
  });
});
