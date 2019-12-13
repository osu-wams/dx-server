import supertest from 'supertest';
import nock from 'nock';
import app from '../../index';
import {
  resourcesData,
  categoriesData,
  resourcesFeaturedEntityQueueData,
  resourcesAcademicEntityQueueData,
  resourcesDataNoRelatedData,
} from '../__mocks__/resources.data';
import { BASE_URL } from '../modules/dx';
import cache from '../modules/cache'; // eslint-disable-line no-unused-vars
import { setAsync, getAsync, mockCachedData } from '../modules/__mocks__/cache';

// jest.mock('redis');

let request: supertest.SuperTest<supertest.Test>;

beforeAll(async () => {
  request = supertest.agent(app);
});

describe('/resources', () => {
  it('should contain an icon when one exists', async () => {
    const url = '/api/resources?category=featured';
    const data = [
      {
        id: '2ff0aaa4-5ca2-4adb-beaa-decc8744396f',
        type: 'service--categories',
        title: 'Student Jobs',
        link: 'http://ask/jeeves',
        iconName: 'osu.logo_sites_128px',
        affiliation: [],
        audiences: ['Corvallis'],
        categories: ['category1', 'category2'],
        synonyms: ['blah', 'bob', 'ross'],
      },
    ];
    mockCachedData.mockReturnValue(JSON.stringify(resourcesData));
    cache.getAsync = getAsync;
    await request.get(url).expect(200, data);
  });

  it('should not find an icon or related data when it does not exist', async () => {
    const url = '/api/resources?category=featured';
    const data = [
      {
        id: '2ff0aaa4-5ca2-4ad-beaa-decc8744396f',
        type: 'service--categories',
        title: 'Something Bogus',
        link: '',
        affiliation: [],
        audiences: [],
        categories: [],
        synonyms: [],
      },
    ];
    mockCachedData.mockReturnValue(JSON.stringify(resourcesDataNoRelatedData));
    cache.getAsync = getAsync;
    await request.get(url).expect(200, data);
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
      const data = [
        {
          id: '6b7cd598-d71e-45f7-911c-d71551ec0a7c',
          name: 'Featured',
          icon: `${BASE_URL}/sites/default/files/2019-05/star.svg`,
        },
        {
          id: '6b7cd598-d71e-45f7-911c-d71551ec0a7c',
          name: 'BadOne',
        },
      ];
      mockCachedData.mockReturnValue(JSON.stringify(categoriesData));
      cache.getAsync = getAsync;
      await request.get('/api/resources/categories').expect(200, data);
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
      const data = {
        entityQueueTitle: 'Liz',
        items: [
          {
            id: '2ff0aaa4-5ca2-4adb-beaa-decc8744396f',
            type: 'service--categories',
            title: 'Student Jobs',
            link: 'http://ask/jeeves',
            iconName: 'osu.logo_sites_128px',
            affiliation: [],
            audiences: ['Corvallis'],
            categories: ['category1', 'category2'],
            synonyms: ['blah', 'bob', 'ross'],
          },
        ],
      };
      mockCachedData.mockReturnValue(null);
      cache.getAsync = getAsync;
      cache.setAsync = setAsync;
      nock(BASE_URL)
        .get(/.*/)
        .reply(200, { data: resourcesFeaturedEntityQueueData });
      await request.get('/api/resources/category/featured').expect(200, data);
    });
    it('should filter cached the data', async () => {
      const data = {
        entityQueueTitle: 'Liz',
        items: [
          {
            id: '2ff0aaa4-5ca2-4adb-beaa-decc8744396f',
            type: 'service--categories',
            title: 'Student Jobs',
            link: 'http://ask/jeeves',
            iconName: 'osu.logo_sites_128px',
            affiliation: [],
            audiences: ['Corvallis'],
            categories: ['category1', 'category2'],
            synonyms: ['blah', 'bob', 'ross'],
          },
        ],
      };

      mockCachedData.mockReturnValue(JSON.stringify(resourcesFeaturedEntityQueueData));

      cache.getAsync = getAsync;
      await request.get('/api/resources/category/featured').expect(200, data);
    });

    it('should filter cached data that does not include related data', async () => {
      const data = {
        entityQueueTitle: 'Liz',
        items: [
          {
            id: '2ff0aaa4-5ca2-4ad-beaa-decc8744396f',
            type: 'service--categories',
            title: 'Something Bogus',
            link: '',
            affiliation: [],
            audiences: [],
            categories: [],
            synonyms: [],
          },
        ],
      };
      mockCachedData.mockReturnValue(JSON.stringify(resourcesAcademicEntityQueueData));
      cache.getAsync = getAsync;
      await request.get('/api/resources/category/academic').expect(200, data);
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
