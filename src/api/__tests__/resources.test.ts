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

let request: supertest.SuperTest<supertest.Test>;

beforeAll(async () => {
  request = supertest.agent(app);
});

describe('/resources', () => {
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
});
