import supertest from 'supertest';
import nock from 'nock';
import app from '../../index';
import {
  resourcesData,
  categoriesData,
  emptyData,
  resourcesDataNoMatchingMedia
} from '../__mocks__/resources.data';
import { BASE_URL } from '../modules/dx';

const request = supertest.agent(app);

describe('/resources', () => {
  it('should contain an icon when one exists', async () => {
    const url =
      '/api/resources?category=1b9b7a4b-5a64-41af-a40a-8bb01abedd19,e2730988-0614-43b7-b3ce-0b047e8219e0';
    const data = [
      {
        id: '2ff0aaa4-5ca2-4adb-beaa-decc8744396f',
        title: 'Student Jobs',
        icon: 'http://dev-api-dx.pantheonsite.io/sites/default/files/2019-05/logo_sites_128px.png',
        uri: '/image'
      }
    ];
    nock(BASE_URL)
      .get(/.*/)
      .reply(200, resourcesData, { 'Content-Type': 'application/json' });

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
        uri: '/image'
      }
    ];
    nock(BASE_URL)
      .get(/.*/)
      .reply(200, resourcesDataNoMatchingMedia, { 'Content-Type': 'application/json' });

    await request.get(url).expect(200, data);
  });

  it('should return a 500 if the site is down', async () => {
    nock(BASE_URL)
      .get(/.*/)
      .reply(500);

    await request.get('/api/resources').expect(500);
  });

  it('should return elements with the matching name', async () => {
    nock(BASE_URL)
      .get(/.*/)
      .reply(200, resourcesData, { 'Content-Type': 'application/json' });

    await request
      .get('/api/resources?query=Student')
      .expect(200)
      .expect(r => r.body.length === 1);

    nock(BASE_URL)
      .get(/.*/)
      .reply(200, emptyData, { 'Content-Type': 'application/json' });

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
          icon: 'http://dev-api-dx.pantheonsite.io/sites/default/files/2019-05/star.svg'
        }
      ];

      nock(BASE_URL)
        .get(/.*/)
        .reply(200, categoriesData, { 'Content-Type': 'application/json' });

      await request.get('/api/resources/categories').expect(200, data);
    });

    it('should return a 500 if the site is down', async () => {
      nock(BASE_URL)
        .get(/.*/)
        .reply(500);

      await request.get('/api/resources/categories').expect(500);
    });
  });
});
