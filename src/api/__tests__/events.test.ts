import supertest from 'supertest';
import nock from 'nock';
import cache from '../modules/cache'; // eslint-disable-line no-unused-vars
import app from '../../index';
import employeeEventsData, { expectedEmployeeEvents } from '../../mocks/localist/events-employee';
import { academicCalendarData } from '../__mocks__/events-academic.data';
import { eventsData, eventsResult } from '../__mocks__/events.data';
import { mockedGet, mockedGetResponse } from '../modules/__mocks__/cache';
import { LOCALIST_BASE_URL, ACADEMIC_CALENDAR_URL } from '../modules/localist';

const request = supertest.agent(app);

describe('/events', () => {
  it('should return events when one is present', async () => {
    mockedGetResponse.mockReturnValue({ events: eventsData });
    cache.get = mockedGet;
    // Mock response from Localist
    nock(LOCALIST_BASE_URL, { encodedQueryParams: true })
      .get('')
      .query(true)
      .reply(200, { events: eventsData });

    await request.get('/api/events').expect(200, eventsResult);
  });

  it('should return "Unable to retrieve events." when there is a 500 error', async () => {
    mockedGetResponse.mockReturnValue(undefined);
    cache.get = jest.fn().mockRejectedValue(new Error('boom'));
    nock(LOCALIST_BASE_URL)
      .get(/.*/)
      .reply(500);

    await request.get('/api/events').expect(500, { message: 'Unable to retrieve events.' });
  });
});

describe('/events/academic-calendar', () => {
  it('should return events when one is present', async () => {
    mockedGetResponse.mockReturnValue(academicCalendarData.xml);
    cache.get = mockedGet;
    // Mock response from Localist
    nock(ACADEMIC_CALENDAR_URL)
      .get('')
      .query(true)
      .reply(200, academicCalendarData.xml, {
        'Content-Type': 'application/xml',
      });

    await request.get('/api/events/academic-calendar').expect(200, academicCalendarData.response);
  });

  it('should return "Unable to retrieve academic calendar events." when there is a 500 error', async () => {
    mockedGetResponse.mockReturnValue(undefined);
    cache.get = mockedGet;
    nock(ACADEMIC_CALENDAR_URL)
      .get('')
      .reply(500);

    await request
      .get('/api/events/academic-calendar')
      .expect(500, { message: 'Unable to retrieve academic calendar events.' });
  });
});

describe('/events/employee', () => {
  it('should return events when one is present', async () => {
    mockedGetResponse.mockReturnValue(employeeEventsData);
    cache.get = mockedGet;
    // Mock response from Localist
    nock(LOCALIST_BASE_URL)
      .get('')
      .query(true)
      .reply(200, employeeEventsData);

    await request.get('/api/events/employee').expect(200, expectedEmployeeEvents);
  });

  it('should return "Unable to retrieve employee events." when there is a 500 error', async () => {
    mockedGetResponse.mockReturnValue(undefined);
    cache.get = mockedGet;
    nock(LOCALIST_BASE_URL)
      .get('')
      .reply(500);

    await request
      .get('/api/events/employee')
      .expect(500, { message: 'Unable to retrieve employee events.' });
  });
});
