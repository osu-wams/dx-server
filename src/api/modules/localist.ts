import request from 'request-promise';
import Parser from 'rss-parser';
import querystring from 'querystring';
import config from 'config';
import { asyncTimedRequest } from '../../datadog';

const parser = new Parser();

const LOCALIST_BASE_URL: string = config.get('localist.baseUrl');
const ACADEMIC_CALENDAR_URL: string = config.get('localist.academicCalendarRSS');

/**
 * Gets events from Localist.
 * @param {Object} query - An object containing key/value pairs to be used as query parameters.
 * @returns {Promise<Object[]>}
 */
export const getEvents = async (query: any): Promise<object[]> => {
  try {
    const urlParams = querystring.stringify(query);
    const data = await asyncTimedRequest(
      request,
      [`${LOCALIST_BASE_URL}/events?${urlParams}`, { json: true }],
      'localist.get_events.response_time'
    );

    if (urlParams) {
      return data.events;
    }
    return data;
  } catch (err) {
    throw err;
  }
};

/**
 * Gets academic calendar events from Localist.
 * @returns {Promise<Object[]>}
 */
export const getAcademicCalendarEvents = async (): Promise<object[]> => {
  try {
    // Note: Getting academic calendar items via RSS as a workaround due to
    //       unlisted/restricted events not being visible via API.
    const { items } = await asyncTimedRequest(
      async () => parser.parseURL(ACADEMIC_CALENDAR_URL),
      [],
      'localist.academic_calendar.response_time'
    );
    return items;
  } catch (err) {
    throw err;
  }
};
