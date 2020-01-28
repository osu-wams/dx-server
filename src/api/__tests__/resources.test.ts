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
});
