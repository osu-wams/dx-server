import supertest from 'supertest';
import nock from '@src/mocks/nock';
import { mockedCards, mockedCardsExpected } from '../../mocks/dx';
import app from '../../index';
import { BASE_URL } from '../modules/dx';
import cache from '../modules/cache';
import { getAsync, mockCachedData } from '../modules/__mocks__/cache';

const mockedGetCache = jest.fn();
jest.mock('../modules/cache.ts', () => ({
  ...jest.requireActual('../modules/cache.ts') as {},
  selectDbAsync: () => jest.fn(),
  getCache: () => mockedGetCache(),
}));

let request: ReturnType<typeof supertest.agent>;

beforeAll(async () => {
  request = supertest.agent(app);
});

describe('/cards', () => {
  it('should contain an icon when one exists', async () => {
    const url = '/api/cards';
    mockCachedData.mockReturnValue(JSON.stringify(mockedCards));
    cache.getAsync = getAsync;
    await request.get(url).expect(200, mockedCardsExpected);
  });

  it('should not find an icon or related data when it does not exist', async () => {
    const url = '/api/cards';
    mockCachedData.mockReturnValue(JSON.stringify(mockedCards.slice(-1)));
    cache.getAsync = getAsync;
    await request.get(url).expect(200, mockedCardsExpected.slice(-1));
  });

  it('should return a 500 if the site is down', async () => {
    mockCachedData.mockReturnValue(null);
    cache.getAsync = getAsync;
    nock(BASE_URL).get(/.*/).reply(500);

    await request.get('/api/cards').expect(500);
  });
});
