import supertest from 'supertest';
import nock from 'nock';
import config from 'config';
import app from '../../index';
import { academicCalendarData } from '../__mocks__/events-academic.data';
import { eventsData } from '../__mocks__/events.data';

const LOCALIST_BASE_URL = config.get('localist.baseUrl');
const ACADEMIC_CALENDAR_URL = config.get('localist.academicCalendarRSS');

const request = supertest.agent(app);

describe('/events', () => {
  it('should return events when one is present', async () => {
    // Mock response from Localist
    nock(LOCALIST_BASE_URL, { encodedQueryParams: true })
      .get('/events')
      .query(true)
      .reply(200, { eventsData });

    await request.get('/api/events').expect(200, { eventsData });
  });

  it('should return "Unable to retrieve events." when there is a 500 error', async () => {
    nock(LOCALIST_BASE_URL)
      .get('')
      .reply(500);

    await request
      .get('/api/events')
      .expect(500)
      .expect(r => r.error.text === 'Unable to retrieve events.');
  });
});

describe('/events/academic-calendar', () => {
  it('should return events when one is present', async () => {
    // Mock response from Localist
    nock(ACADEMIC_CALENDAR_URL)
      .get('')
      .query(true)
      .reply(200, academicCalendarData.xml, {
        'Content-Type': 'application/xml'
      });

    await request.get('/api/events/academic-calendar').expect(200, academicCalendarData.response);
  });

  it('should return "Unable to retrieve academic calendar events." when there is a 500 error', async () => {
    nock(ACADEMIC_CALENDAR_URL)
      .get('')
      .reply(500);

    await request
      .get('/api/events/academic-calendar')
      .expect(500)
      .expect(r => r.error.text === 'Unable to retrieve academic calendar events.');
  });
});
