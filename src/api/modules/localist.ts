import Parser from 'rss-parser';
import querystring from 'querystring';
import config from 'config';
import cache from './cache';

const parser = new Parser();

export const LOCALIST_BASE_URL: string = config.get('localist.baseUrl');
export const ACADEMIC_CALENDAR_URL: string = config.get('localist.academicCalendarRSS');
const CACHE_SEC = parseInt(config.get('localist.cacheEndpointSec'), 10);

/**
 * Gets events from Localist.
 * @param {Object} query - An object containing key/value pairs to be used as query parameters.
 * @returns {Promise<Object[]>}
 */
export const getEvents = async (query: any): Promise<object[]> => {
  try {
    const urlParams = querystring.stringify(query);
    const url = `${LOCALIST_BASE_URL}/events?${urlParams}`;
    const data = await cache.get(url, { json: true }, true, { key: url, ttlSeconds: CACHE_SEC });
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
    const xml = await cache.get(ACADEMIC_CALENDAR_URL, {}, true, {
      key: ACADEMIC_CALENDAR_URL,
      ttlSeconds: CACHE_SEC
    });
    const { items } = await parser.parseString(xml);

    return items;
  } catch (err) {
    throw err;
  }
};
