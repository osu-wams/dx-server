import supertest from 'supertest';
import nock from 'nock';
import { BASE_URL } from '../modules/dx';
import app from '../../index';
import {
  mockAnnouncementsData,
  mockAnnouncementsEntityQueueData,
  mockAnnouncementResult,
  mockAnnouncementResultWithoutRelatedData,
  mockAcademicAnnouncementResult,
  mockFinancialAnnouncementResult
} from '../__mocks__/announcements.data';
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
      .reply(200, { data: mockAnnouncementsData });
    await request.get('/api/announcements').expect(200, mockAnnouncementResult);
  });
  it('returns cached announcements', async () => {
    mockCachedData.mockReturnValue(JSON.stringify(mockAnnouncementsData));
    cache.getAsync = getAsync;
    await request.get('/api/announcements').expect(200, mockAnnouncementResult);
  });
  it('does not have included image, action, or audience data', async () => {
    mockCachedData.mockReturnValue(JSON.stringify([mockAnnouncementsData[0]]));
    cache.getAsync = getAsync;
    await request.get('/api/announcements').expect(200, mockAnnouncementResultWithoutRelatedData);
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
      .expect(500)
      .expect(r => r.error.text === 'Unable to retrieve announcements.');
  });
});

describe('/api/announcements/academic', () => {
  it('returns announcements', async () => {
    mockCachedData.mockReturnValue(JSON.stringify(mockAnnouncementsEntityQueueData));
    cache.getAsync = getAsync;
    await request.get('/api/announcements/academic').expect(200, mockAcademicAnnouncementResult);
  });
  it('returns an error', async () => {
    mockCachedData.mockReturnValue(null);
    cache.getAsync = getAsync;
    nock(BASE_URL)
      .get('/jsonapi/entity_subqueue/announcements')
      .query(true)
      .replyWithError('boom');
    await request
      .get('/api/announcements/academic')
      .expect(500)
      .expect(r => r.error.text === 'Unable to retrieve academic announcements.');
  });
});

describe('/api/announcements/financial', () => {
  it('returns announcements', async () => {
    mockCachedData.mockReturnValue(JSON.stringify(mockAnnouncementsEntityQueueData));
    cache.getAsync = getAsync;
    nock(BASE_URL)
      .get('/jsonapi/entity_subqueue/announcements')
      .query(true)
      .reply(200, mockAnnouncementsEntityQueueData);
    await request.get('/api/announcements/financial').expect(200, mockFinancialAnnouncementResult);
  });
  it('returns an error', async () => {
    mockCachedData.mockReturnValue(null);
    cache.getAsync = getAsync;
    nock(BASE_URL)
      .get('/jsonapi/entity_subqueue/announcements')
      .query(true)
      .replyWithError('boom');
    await request
      .get('/api/announcements/financial')
      .expect(500)
      .expect(r => r.error.text === 'Unable to retrieve financial announcements.');
  });
});
