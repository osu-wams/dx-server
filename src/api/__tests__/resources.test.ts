import config from 'config';
import supertest from 'supertest';
import nock from 'nock';
import app from '../../index';
import {
  resourcesData,
  categoriesData,
  resourcesEntityQueueData,
  resourcesEntityQueueDataNoMatchingMedia,
  filteredResourcesEntityQueueData,
  filteredResourcesEntityQueueDataNoMatchingMedia,
  emptyData,
  resourcesDataNoMatchingMedia,
  audienceData
} from '../__mocks__/resources.data';
import { BASE_URL } from '../modules/dx';
import cache from '../modules/cache'; // eslint-disable-line no-unused-vars
import { mockedGet, mockedGetResponse } from '../modules/__mocks__/cache';

jest.mock('redis');

const dxApiBaseUrl = config.get('dxApi.baseUrl');
let request: supertest.SuperTest<supertest.Test>;

beforeAll(async () => {
  request = supertest.agent(app);
});

describe('/resources', () => {
  it('should contain an icon when one exists', async () => {
    const url =
      '/api/resources?category=1b9b7a4b-5a64-41af-a40a-8bb01abedd19,e2730988-0614-43b7-b3ce-0b047e8219e0';
    const data = [
      {
        id: '2ff0aaa4-5ca2-4adb-beaa-decc8744396f',
        title: 'Student Jobs',
        icon: `${dxApiBaseUrl}/sites/default/files/2019-05/logo_sites_128px.png`,
        uri: '/image',
        audiences: ['Bend']
      }
    ];
    mockedGetResponse.mockReturnValue({
      'https://data.dx.oregonstate.edu/jsonapi/taxonomy_term/audience': audienceData,
      'https://data.dx.oregonstate.edu/jsonapi/node/services?include=field_service_category,field_icon.field_media_image&fields[taxonomy_term--categories]=name&filter[and-group][group][conjunction]=AND&filter[1b9b7a4b-5a64-41af-a40a-8bb01abedd19][condition][path]=field_service_category.id&filter[1b9b7a4b-5a64-41af-a40a-8bb01abedd19][condition][value]=1b9b7a4b-5a64-41af-a40a-8bb01abedd19&filter[1b9b7a4b-5a64-41af-a40a-8bb01abedd19][condition][memberOf]=and-group&filter[e2730988-0614-43b7-b3ce-0b047e8219e0][condition][path]=field_service_category.id&filter[e2730988-0614-43b7-b3ce-0b047e8219e0][condition][value]=e2730988-0614-43b7-b3ce-0b047e8219e0': resourcesData
    });
    cache.get = mockedGet;
    nock(BASE_URL)
      .get(uri => uri.includes('node/services'))
      .reply(200, resourcesData, { 'Content-Type': 'application/json' });
    nock(BASE_URL)
      .get(uri => uri.includes('taxonomy_term/audience'))
      .reply(200, audienceData, { 'Content-Type': 'application/json' });

    await request.get(url).expect(200, data);
  });

  it('should not find an icon when one does not exist', async () => {
    const url =
      '/api/resources?category=1b9b7a4b-5a64-41af-a40a-8bb01abedd19,e2730988-0614-43b7-b3ce-0b047e8219e0';
    const data = [
      {
        id: '2ff0aaa4-5ca2-4adb-beaa-decc8744396f',
        title: 'Student Jobs',
        icon: 'some-invalid-id-that-is-not-in-the-included-data',
        uri: '/image',
        audiences: []
      }
    ];
    mockedGetResponse.mockReturnValue({
      'https://data.dx.oregonstate.edu/jsonapi/taxonomy_term/audience': audienceData,
      'https://data.dx.oregonstate.edu/jsonapi/node/services?include=field_service_category,field_icon.field_media_image&fields[taxonomy_term--categories]=name&filter[and-group][group][conjunction]=AND&filter[1b9b7a4b-5a64-41af-a40a-8bb01abedd19][condition][path]=field_service_category.id&filter[1b9b7a4b-5a64-41af-a40a-8bb01abedd19][condition][value]=1b9b7a4b-5a64-41af-a40a-8bb01abedd19&filter[1b9b7a4b-5a64-41af-a40a-8bb01abedd19][condition][memberOf]=and-group&filter[e2730988-0614-43b7-b3ce-0b047e8219e0][condition][path]=field_service_category.id&filter[e2730988-0614-43b7-b3ce-0b047e8219e0][condition][value]=e2730988-0614-43b7-b3ce-0b047e8219e0': resourcesDataNoMatchingMedia
    });
    cache.get = mockedGet;
    nock(BASE_URL)
      .get(uri => uri.includes('node/services'))
      .reply(200, resourcesDataNoMatchingMedia, { 'Content-Type': 'application/json' });
    nock(BASE_URL)
      .get(uri => uri.includes('taxonomy_term/audience'))
      .reply(200, audienceData, { 'Content-Type': 'application/json' });

    await request.get(url).expect(200, data);
  });

  it('should return a 500 if the site is down', async () => {
    mockedGetResponse.mockReturnValue(undefined);
    cache.get = mockedGet;
    nock(BASE_URL)
      .get(/.*/)
      .reply(500);

    await request.get('/api/resources').expect(500);
  });

  it('should return elements with the matching name', async () => {
    mockedGetResponse.mockReturnValue({
      'https://data.dx.oregonstate.edu/jsonapi/taxonomy_term/audience': audienceData,
      'https://data.dx.oregonstate.edu/jsonapi/node/services?include=field_service_category,field_icon.field_media_image&filter[title-filter][condition][path]=title&filter[title-filter][condition][operator]=CONTAINS&filter[title-filter][condition][value]=Student': resourcesData
    });
    cache.get = mockedGet;
    nock(BASE_URL)
      .get(uri => uri.includes('node/services'))
      .reply(200, resourcesData, { 'Content-Type': 'application/json' });
    nock(BASE_URL)
      .get(uri => uri.includes('taxonomy_term/audience'))
      .reply(200, audienceData, { 'Content-Type': 'application/json' });

    await request
      .get('/api/resources?query=Student')
      .expect(200)
      .expect(r => r.body.length === 1);
  });

  it('should not return elements with the mismatching name', async () => {
    mockedGetResponse.mockReturnValue({
      'https://data.dx.oregonstate.edu/jsonapi/taxonomy_term/audience': audienceData,
      'https://data.dx.oregonstate.edu/jsonapi/node/services?include=field_service_category,field_icon.field_media_image&filter[title-filter][condition][path]=title&filter[title-filter][condition][operator]=CONTAINS&filter[title-filter][condition][value]=Students': emptyData
    });
    cache.get = mockedGet;

    nock(BASE_URL)
      .get(uri => uri.includes('node/services'))
      .reply(200, emptyData, { 'Content-Type': 'application/json' });
    nock(BASE_URL)
      .get(uri => uri.includes('taxonomy_term/audience'))
      .reply(200, audienceData, { 'Content-Type': 'application/json' });

    await request
      .get('/api/resources?query=Students')
      .expect(200)
      .expect(r => r.body.length === 0);
  });

  describe('/resources/categories', () => {
    it('should contain an icon when one exists', async () => {
      const data = [
        {
          id: '1b9b7a4b-5a64-41af-a40a-8bb01abedd19',
          name: 'Popular',
          icon: `${dxApiBaseUrl}/sites/default/files/2019-05/star.svg`
        }
      ];

      mockedGetResponse.mockReturnValue({
        'https://data.dx.oregonstate.edu/jsonapi/taxonomy_term/audience': audienceData,
        'https://data.dx.oregonstate.edu/jsonapi/taxonomy_term/categories?include=field_taxonomy_icon.field_media_image&sort=weight': categoriesData
      });
      cache.get = mockedGet;
      nock(BASE_URL)
        .get(/.*/)
        .reply(200, categoriesData, { 'Content-Type': 'application/json' });

      await request.get('/api/resources/categories').expect(200, data);
    });

    it('should return a 500 if the site is down', async () => {
      mockedGetResponse.mockReturnValue(undefined);
      cache.get = mockedGet;
      nock(BASE_URL)
        .get(/.*/)
        .reply(500);

      await request.get('/api/resources/categories').expect(500);
    });
  });

  describe('/resources/category/:machineName', () => {
    const query = { machineName: 'academic' };

    it('should filter the data', async () => {
      mockedGetResponse.mockReturnValue({
        'https://data.dx.oregonstate.edu/jsonapi/taxonomy_term/audience': audienceData,
        'https://data.dx.oregonstate.edu/jsonapi/entity_subqueue/academic?include=items,items.field_icon,items.field_icon.field_media_image&fields[node--services]=title,field_service_url,field_icon,field_audience': resourcesEntityQueueData
      });
      cache.get = mockedGet;
      nock(BASE_URL)
        .get(uri => uri.includes('entity_subqueue'))
        .reply(200, resourcesEntityQueueDataNoMatchingMedia, {
          'Content-Type': 'application/json'
        });
      nock(BASE_URL)
        .get(uri => uri.includes('taxonomy_term/audience'))
        .reply(200, audienceData, { 'Content-Type': 'application/json' });
      await request
        .get(`/api/resources/category/${query.machineName}`)
        .expect(200, filteredResourcesEntityQueueData);
    });

    it('should filter the data, ignoring media that does not match', async () => {
      mockedGetResponse.mockReturnValue({
        'https://data.dx.oregonstate.edu/jsonapi/taxonomy_term/audience': audienceData,
        'https://data.dx.oregonstate.edu/jsonapi/entity_subqueue/academic?include=items,items.field_icon,items.field_icon.field_media_image&fields[node--services]=title,field_service_url,field_icon,field_audience': resourcesEntityQueueDataNoMatchingMedia
      });
      cache.get = mockedGet;
      nock(BASE_URL)
        .get(uri => uri.includes('entity_subqueue'))
        .reply(200, resourcesEntityQueueDataNoMatchingMedia, {
          'Content-Type': 'application/json'
        });
      nock(BASE_URL)
        .get(uri => uri.includes('taxonomy_term/audience'))
        .reply(200, audienceData, { 'Content-Type': 'application/json' });
      await request
        .get(`/api/resources/category/${query.machineName}`)
        .expect(200, filteredResourcesEntityQueueDataNoMatchingMedia);
    });

    it('should return a 500 if the site is down', async () => {
      mockedGetResponse.mockReturnValue(undefined);
      cache.get = mockedGet;
      nock(BASE_URL)
        .get(/.*/)
        .reply(500);

      await request.get(`/api/resources/category/${query.machineName}`).expect(500);
    });
  });
});
