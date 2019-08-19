import supertest from 'supertest';
import nock from 'nock';
import { BASE_URL, ACADEMIC_GUID, FINANCIAL_GUID } from '../modules/dx';
import app from '../../index';
import {
  mockAnnouncementsData,
  mockAnnouncementResult,
  mockAnnouncementResultWithoutImage
} from '../__mocks__/announcements.data';

const request = supertest.agent(app);
const testId = 'testid';

let replyData;
let expectedData;

beforeEach(() => {
  replyData = mockAnnouncementsData(testId);
  expectedData = mockAnnouncementResult(testId);
});

describe('/api/announcements', () => {
  it('returns announcements', async () => {
    nock(BASE_URL)
      .get('/jsonapi/node/announcement')
      .query(true)
      .reply(200, replyData);
    await request.get('/api/announcements').expect(200, expectedData);
  });
  it('does not have included image data', async () => {
    nock(BASE_URL)
      .get('/jsonapi/node/announcement')
      .query(true)
      .reply(200, { data: replyData.data });
    await request.get('/api/announcements').expect(200, mockAnnouncementResultWithoutImage(testId));
  });
  it('does not have a matchingMedia', async () => {
    replyData.included[0].relationships.field_media_image.data.id = 'not-already-in-the-mock-data';
    expectedData[0].attributes.background_image = '';
    nock(BASE_URL)
      .get('/jsonapi/node/announcement')
      .query(true)
      .reply(200, replyData);
    await request.get('/api/announcements').expect(200, expectedData);
  });
  it('does not have a matchingAnnouncement', async () => {
    replyData.data[0].relationships.field_announcement_image.data.id =
      'not-already-in-the-mock-data';
    expectedData[0].relationships.field_announcement_image.data.id = 'not-already-in-the-mock-data';
    expectedData[0].attributes.background_image = '';
    nock(BASE_URL)
      .get('/jsonapi/node/announcement')
      .query(true)
      .reply(200, replyData);
    await request.get('/api/announcements').expect(200, expectedData);
  });
  it('returns an error', async () => {
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
    nock(BASE_URL)
      .get(`/jsonapi/entity_subqueue/announcements/${ACADEMIC_GUID}/items`)
      .query(true)
      .reply(200, replyData);
    await request.get('/api/announcements/academic').expect(200, expectedData);
  });
  it('returns an error', async () => {
    nock(BASE_URL)
      .get(`/jsonapi/entity_subqueue/announcements/${ACADEMIC_GUID}/items`)
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
    nock(BASE_URL)
      .get(`/jsonapi/entity_subqueue/announcements/${FINANCIAL_GUID}/items`)
      .query(true)
      .reply(200, replyData);
    await request.get('/api/announcements/financial').expect(200, expectedData);
  });
  it('returns an error', async () => {
    nock(BASE_URL)
      .get(`/jsonapi/entity_subqueue/announcements/${ACADEMIC_GUID}/items`)
      .query(true)
      .replyWithError('boom');
    await request
      .get('/api/announcements/financial')
      .expect(500)
      .expect(r => r.error.text === 'Unable to retrieve financial announcements.');
  });
});
