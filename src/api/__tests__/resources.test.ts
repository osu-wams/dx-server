import supertest from 'supertest';
import nock from 'nock';
import {
  mockedCuratedResources,
  mockedCuratedResourcesAcademicExpected,
  mockedCuratedResourcesFeaturedExpected,
  mockedResources,
  mockedResourcesExpected,
  mockedCategories,
  mockedCategoriesExpected,
} from '../../mocks/dx';
import { fromApi } from '../../mocks/google/trendingResources';
import app from '../../index';
import { BASE_URL } from '../modules/dx';
import cache from '../modules/cache'; // eslint-disable-line no-unused-vars
import { setAsync, getAsync, mockCachedData } from '../modules/__mocks__/cache';
import * as dynamoDb from '../../db';

jest.mock('../../db');
const mockDynamoDb = dynamoDb as jest.Mocked<any>; // eslint-disable-line no-unused-vars

const mockedSetCache = jest.fn();
const mockedGetCache = jest.fn();
jest.mock('../modules/cache.ts', () => ({
  ...jest.requireActual('../modules/cache.ts'),
  setCache: () => mockedSetCache(),
  selectDbAsync: () => jest.fn(),
  getCache: () => mockedGetCache(),
}));

let request: supertest.SuperTest<supertest.Test>;

const mockedGetTrendingResources = jest.fn();
const mockedDaysInDuration = jest.fn();
jest.mock('../modules/google', () => ({
  ...jest.requireActual('../modules/google'),
  getTrendingResources: () => mockedGetTrendingResources(),
}));
jest.mock('../../utils/resources', () => ({
  ...jest.requireActual('../../utils/resources'),
  getDaysInDuration: () => mockedDaysInDuration(),
}));

beforeAll(async () => {
  request = supertest.agent(app);
});

describe('/resources', () => {
  it('returns associated data without null values', async () => {
    // JSON.parse/stringify to enforce a deep copied array as to not mutate the original!
    const resources = JSON.parse(JSON.stringify(mockedResources)).slice(0, 1);
    resources[0].field_locations = resources[0].field_locations.slice(0, 1);
    resources[0].field_locations[0].name = null;
    resources[0].field_audience[0].name = null;
    const url = '/api/resources';
    mockCachedData.mockReturnValue(JSON.stringify(resources));
    cache.getAsync = getAsync;
    await request.get(url).expect(200, [
      {
        id: '4c78c92a-baca-480d-97e7-384bb76e3b48',
        title: 'Academic Advising',
        link: 'https://catalog.oregonstate.edu/advising/',
        iconName: 'fal.comments-alt',
        affiliation: [],
        locations: [],
        audiences: ['Ecampus'],
        categories: [],
        synonyms: [],
        excludeTrending: false,
      },
    ]);
  });

  it('should contain an icon when one exists', async () => {
    const url = '/api/resources';
    mockCachedData.mockReturnValue(JSON.stringify(mockedResources));
    cache.getAsync = getAsync;
    await request.get(url).expect(200, mockedResourcesExpected);
  });

  it('should not find an icon or related data when it does not exist', async () => {
    const url = '/api/resources';
    mockCachedData.mockReturnValue(JSON.stringify(mockedResources.slice(-1)));
    cache.getAsync = getAsync;
    await request.get(url).expect(200, mockedResourcesExpected.slice(-1));
  });

  it('should return a 500 if the site is down', async () => {
    mockCachedData.mockReturnValue(null);
    cache.getAsync = getAsync;
    nock(BASE_URL).get(/.*/).reply(500);

    await request.get('/api/resources').expect(500);
  });

  describe('/resources/categories', () => {
    it('should contain an icon when one exists', async () => {
      mockCachedData.mockReturnValue(JSON.stringify(mockedCategories));
      cache.getAsync = getAsync;
      await request.get('/api/resources/categories').expect(200, mockedCategoriesExpected);
    });

    it('should return a 500 if the site is down', async () => {
      mockCachedData.mockReturnValue(null);
      cache.getAsync = getAsync;
      nock(BASE_URL).get(/.*/).reply(500);

      await request.get('/api/resources/categories').expect(500);
    });
  });

  describe('Entityqueue /resources/category/:machineName', () => {
    it('should fetch and filter the data', async () => {
      mockCachedData.mockReturnValue(null);
      cache.getAsync = getAsync;
      cache.setAsync = setAsync;
      nock(BASE_URL)
        .get(/.*/)
        .reply(200, { data: mockedCuratedResources('featured') });
      await request
        .get('/api/resources/category/featured')
        .expect(200, mockedCuratedResourcesFeaturedExpected);
    });
    it('should filter cached the data', async () => {
      mockCachedData.mockReturnValue(JSON.stringify(mockedCuratedResources('featured')));
      cache.getAsync = getAsync;
      await request
        .get('/api/resources/category/featured')
        .expect(200, mockedCuratedResourcesFeaturedExpected);
    });

    it('should filter cached data that does not include related data', async () => {
      mockCachedData.mockReturnValue(JSON.stringify(mockedCuratedResources('academic')));
      cache.getAsync = getAsync;
      await request
        .get('/api/resources/category/academic')
        .expect(200, mockedCuratedResourcesAcademicExpected);
    });

    it('should return a 500 if the site is down', async () => {
      mockCachedData.mockReturnValue(null);
      cache.getAsync = getAsync;
      nock(BASE_URL).get(/.*/).reply(500);

      await request.get('/api/resources/category/featured').expect(500);
    });
  });

  describe('TrendingResources /resources/trending/:period/:affiliation', () => {
    const dateKey = new Date().toISOString().slice(0, 10);
    const period = '1daysAgo';
    const resourcesFromGoogleModule = fromApi(dateKey, period).map(
      ({ resourceId, date, affiliation, campus, title, totalEvents, uniqueEvents }) => ({
        resourceId,
        date,
        affiliation,
        campus,
        title,
        totalEvents,
        uniqueEvents,
      }),
    );

    beforeEach(() => {
      mockedDaysInDuration.mockReturnValue([[1, new Date()]]);
      mockedGetTrendingResources.mockReturnValue(resourcesFromGoogleModule);
    });

    describe('without an affiliation specified', () => {
      it('returns all trending resources', async () => {
        await request
          .get(`/api/resources/trending/${period}`)
          .expect(200, fromApi(dateKey, period));
      });
      it('should return a 500 something fails', async () => {
        mockedDaysInDuration.mockReturnValue(null);
        await request.get(`/api/resources/trending/${period}`).expect(500);
      });
    });
    describe('employee affiliation', () => {
      it('returns all employee trending resources', async () => {
        await request
          .get(`/api/resources/trending/${period}/employee`)
          .expect(200, [fromApi(dateKey, period)[0]]);
      });
    });
    describe('student affiliation', () => {
      it('returns all student trending resources', async () => {
        await request
          .get(`/api/resources/trending/${period}/student`)
          .expect(200, [fromApi(dateKey, period)[1]]);
      });
    });
  });

  describe('FavoriteResources', () => {
    const created = new Date().toISOString();
    const favoriteResourceItem = {
      osuId: { N: '111111111' },
      active: { BOOL: true },
      order: { N: '1' },
      created: { S: created },
      resourceId: { S: 'asdf' },
    };
    const favoriteResource = {
      active: true,
      order: 1,
      created,
      osuId: 111111111,
      resourceId: 'asdf',
    };

    describe('get: /resources/favorites', () => {
      it('should return an empty array when a user session does not exist', async () => {
        await request.get('/api/resources/favorites').expect(200, []);
      });

      describe('with a logged in user', () => {
        beforeEach(async () => {
          // Authenticate before each request
          await request.get('/login');
        });

        afterEach(() => {
          jest.resetAllMocks();
        });

        it('should return an array of favorite resources from dynamodb', async () => {
          mockedGetCache.mockReturnValue(null);
          mockDynamoDb.scan.mockImplementationOnce(() =>
            Promise.resolve({ Items: [favoriteResourceItem] }),
          );
          await request.get('/api/resources/favorites').expect(200, [favoriteResource]);
        });

        it('should return an array of favorite resources from cache', async () => {
          mockedGetCache.mockReturnValue(JSON.stringify([favoriteResource]));
          await request.get('/api/resources/favorites').expect(200, [favoriteResource]);
          expect(mockDynamoDb.scan).not.toBeCalled();
        });

        it('should return a 500 if an error occurs', async () => {
          mockDynamoDb.scan.mockImplementationOnce(() =>
            Promise.reject(new Error('happy little accident')),
          );

          await request.get('/api/resources/favorites').expect(500, { message: {} });
        });
      });
    });

    describe('post: /resources/favorites', () => {
      describe('without a user session', () => {
        beforeEach(async () => {
          jest.resetAllMocks();
          // hackish way to kill the temporary test session
          await request.get('/logout/saml');
        });

        it('should return an empty resource', async () => {
          await request
            .post('/api/resources/favorites')
            .send({
              active: true,
              order: 1,
              resourceId: 'asdf',
            })
            .expect(400);
        });
      });

      describe('as a logged in user', () => {
        beforeEach(async () => {
          // Authenticate before each request
          await request.get('/login');
        });

        it('should save a favorite resource', async () => {
          mockedSetCache.mockReturnValue(true);
          mockDynamoDb.scan.mockImplementationOnce(() =>
            Promise.resolve({ Items: [favoriteResourceItem] }),
          );
          mockDynamoDb.putItem.mockImplementationOnce(() =>
            Promise.resolve({ Item: favoriteResourceItem }),
          );
          const response = await request
            .post('/api/resources/favorites')
            .send({
              active: true,
              order: 1,
              resourceId: 'asdf',
            })
            .expect(200);
          expect(response.body.active).toBe(true);
          expect(response.body.order).toBe(1);
          expect(response.body.osuId).toBe(111111111);
          expect(response.body.resourceId).toBe('asdf');
          expect(response.body.created).not.toBeNull();
        });

        it('should return a 500 if an error occurs', async () => {
          mockDynamoDb.putItem.mockImplementationOnce(() =>
            Promise.reject(new Error('happy little accident')),
          );

          await request
            .post('/api/resources/favorites')
            .send({
              active: true,
              order: 1,
              resourceId: 'asdf',
            })
            .expect(500, { message: {} });
        });
      });
    });
  });
});
