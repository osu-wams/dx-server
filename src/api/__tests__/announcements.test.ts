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
