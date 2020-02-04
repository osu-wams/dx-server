import supertest from 'supertest';
import nock from 'nock';
import { BASE_URL } from '../modules/dx';
import app from '../../index';
import {
  mockedAnnouncements,
  mockedAnnouncementsExpected,
  mockedAnnouncementsFinancesExpected,
  mockedAnnouncementsAcademicsExpected,
} from '../../mocks/dx';
import cache from '../modules/cache'; // eslint-disable-line no-unused-vars
import { setAsync, getAsync, mockCachedData } from '../modules/__mocks__/cache';

const request = supertest.agent(app);

describe('/api/announcements', () => {
  it('returns announcements without null values', async () => {
    // JSON.parse/stringify to enforce a deep copied array as to not mutate the original!
    const announcements = JSON.parse(JSON.stringify(mockedAnnouncements)).slice(0, 1);
    announcements[0].field_locations = announcements[0].field_locations.slice(0, 1);
    announcements[0].field_locations[0].name = null;
    announcements[0].field_pages[0].name = null;
    mockCachedData.mockReturnValueOnce(JSON.stringify(announcements));
    cache.getAsync = getAsync;
    await request.get('/api/announcements').expect(200, [
      {
        id: 'd67dd5d0-5aab-4941-a1d1-fa81b51630a1',
        title: 'SNAP for OSU Students',
        body:
          '   Supplemental Nutrition Assistance Program (SNAP) can help eligible students afford up to $194 in groceries each month. Find out if you are eligible and where to sign up. ',
        bg_image: 'https://data.dx.oregonstate.edu/sites/default/files/2019-11/HSRC_Basket.jpg',
        affiliation: ['Student'],
        locations: [],
        audiences: [],
        pages: [],
        action: {
          title: 'Learn about SNAP',
          link:
            'https://proxy.qualtrics.com/proxy/?url=https%3A%2F%2Fbeav.es%2FSNAP&token=N1dOAVMk%2B5bq7mRPjK3wNU3g7zZLzG7DskwS4u5uySs%3D',
        },
      },
    ]);
  });
  it('returns uncached announcements', async () => {
    mockCachedData.mockReturnValue(null);
    cache.getAsync = getAsync;
    cache.setAsync = setAsync;
    nock(BASE_URL)
      .get('/jsonapi/node/announcement')
      .query(true)
      .reply(200, { data: mockedAnnouncements });
    await request.get('/api/announcements').expect(200, mockedAnnouncementsExpected);
  });
  it('returns cached announcements', async () => {
    mockCachedData.mockReturnValue(JSON.stringify(mockedAnnouncements));
    cache.getAsync = getAsync;
    await request.get('/api/announcements').expect(200, mockedAnnouncementsExpected);
  });
  it('returns an error', async () => {
    mockCachedData.mockReturnValue(null);
    cache.getAsync = getAsync;
    nock(BASE_URL)
      .get('/jsonapi/node/announcement')
      .query(true)
      .replyWithError('boom');
    await request
      .get('/api/announcements')
      .expect(500, { message: 'Unable to retrieve announcements.' });
  });
});

describe('/api/announcements/academics', () => {
  it('returns announcements', async () => {
    mockCachedData.mockReturnValue(JSON.stringify(mockedAnnouncements));
    cache.getAsync = getAsync;
    await request
      .get('/api/announcements/academics')
      .expect(200, mockedAnnouncementsAcademicsExpected);
  });
  it('returns an error', async () => {
    mockCachedData.mockReturnValue(null);
    cache.getAsync = getAsync;
    nock(BASE_URL)
      .get('/jsonapi/node/announcement')
      .query(true)
      .replyWithError('boom');
    await request
      .get('/api/announcements/academics')
      .expect(500, { message: 'Unable to retrieve announcements.' });
  });
});

describe('/api/announcements/finances', () => {
  it('returns announcements', async () => {
    mockCachedData.mockReturnValue(JSON.stringify(mockedAnnouncements));
    cache.getAsync = getAsync;
    nock(BASE_URL)
      .get('/jsonapi/node/announcement')
      .query(true)
      .reply(200, mockedAnnouncements);
    await request
      .get('/api/announcements/finances')
      .expect(200, mockedAnnouncementsFinancesExpected);
  });
  it('returns an error', async () => {
    mockCachedData.mockReturnValue(null);
    cache.getAsync = getAsync;
    nock(BASE_URL)
      .get('/jsonapi/node/announcement')
      .query(true)
      .replyWithError('boom');
    await request
      .get('/api/announcements/finances')
      .expect(500, { message: 'Unable to retrieve announcements.' });
  });
});
