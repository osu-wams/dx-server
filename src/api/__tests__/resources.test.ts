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
import app from '../../index';
import { BASE_URL } from '../modules/dx';
import cache from '../modules/cache'; // eslint-disable-line no-unused-vars
import { setAsync, getAsync, mockCachedData } from '../modules/__mocks__/cache';
import * as dynamoDb from '../../db';

jest.mock('../../db');
const mockDynamoDb = dynamoDb as jest.Mocked<any>; // eslint-disable-line no-unused-vars

let request: supertest.SuperTest<supertest.Test>;

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
    nock(BASE_URL)
      .get(/.*/)
      .reply(500);

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
      nock(BASE_URL)
        .get(/.*/)
        .reply(500);

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
      nock(BASE_URL)
        .get(/.*/)
        .reply(500);

      await request.get('/api/resources/category/featured').expect(500);
    });
  });

  describe('get: /resources/favorites', () => {
    beforeEach(async () => {
      // Authenticate before each request
      await request.get('/login');
    });

    it('should return an array of favorite resources', async () => {
      const created = new Date().toISOString();
      mockDynamoDb.scan.mockImplementationOnce(() =>
        Promise.resolve({
          Items: [
            {
              osuId: { N: '111111111' },
              active: { BOOL: true },
              order: { N: '1' },
              created: { S: created },
              resourceId: { S: 'asdf' },
            },
          ],
        }),
      );
      await request.get('/api/resources/favorites').expect(200, [
        {
          active: true,
          order: 1,
          created,
          osuId: 111111111,
          resourceId: 'asdf',
        },
      ]);
    });

    it('should return a 500 if an error occurs', async () => {
      mockDynamoDb.scan.mockImplementationOnce(() =>
        Promise.reject(new Error('happy little accident')),
      );

      await request.get('/api/resources/favorites').expect(500, { message: {} });
    });
  });

  describe('post: /resources/favorites', () => {
    beforeEach(async () => {
      // Authenticate before each request
      await request.get('/login');
    });

    it('should save a favorite resource', async () => {
      const created = new Date().toISOString();
      mockDynamoDb.putItem.mockImplementationOnce(() =>
        Promise.resolve({
          Item: {
            osuId: { N: '111111111' },
            active: { BOOL: true },
            order: { N: '1' },
            created: { S: created },
            resourceId: { S: 'asdf' },
          },
        }),
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
