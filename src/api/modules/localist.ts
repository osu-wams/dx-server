import Parser from 'rss-parser';
import config from 'config';
import cache from './cache';
import { fetchData } from '../util';
import {
  mockedAcademicCalendar,
  mockedCampusEvents,
  mockedEventsDx,
  mockedEventsEmployee,
} from '../../mocks/localist';

const parser = new Parser();

export const LOCALIST_BASE_URL: string = config.get('localist.baseUrl');
export const ACADEMIC_CALENDAR_URL: string = config.get('localist.academicCalendarRSS');
const CACHE_SEC = parseInt(config.get('localist.cacheEndpointSec'), 10);
const CAMPUS_IDS = JSON.parse(config.get('localist.campusIds'));
const EVENT_TYPES = JSON.parse(config.get('localist.eventTypes'));
const EVENT_DAYS_AGO = parseInt(config.get('localist.eventDaysAgo'), 10);
const EVENT_DX_QUERY: string = config.get('localist.eventDxQuery');

/* eslint-disable camelcase */
export interface IEvent {
  action: {
    link: string;
    title?: string;
  };
  bg_image: string;
  body?: string;
  date: string;
  id: string;
  title: string;
  type: string;
}

const mappedEvents = (events): IEvent[] => {
  return events.map((e) => ({
    action: {
      link: e.event.localist_url,
    },
    bg_image: e.event.photo_url,
    date: e.event.event_instances[0].event_instance.start,
    id: e.event.event_instances[0].event_instance.id,
    title: e.event.title,
    type: 'localist',
  }));
};
/* eslint-enable camelcase */

/**
 * Gets events from Localist.
 * @param {Object} query - An object containing key/value pairs to be used as query parameters.
 * @returns {Promise<Object[]>}
 */
export const getEvents = async (): Promise<object[]> => {
  try {
    const url = `${LOCALIST_BASE_URL}/events/search?search=${EVENT_DX_QUERY}&days=${EVENT_DAYS_AGO}`;
    const data = await fetchData(
      () => cache.get(url, { json: true }, true, { key: url, ttlSeconds: CACHE_SEC }),
      mockedEventsDx,
    );
    return mappedEvents(data.events);
  } catch (err) {
    throw err;
  }
};

export const getCampusEvents = async (campus: string): Promise<object[]> => {
  try {
    const url = `${LOCALIST_BASE_URL}/events?campus_id=${CAMPUS_IDS[campus]}&days=${EVENT_DAYS_AGO}`;
    const data = await fetchData(
      () => cache.get(url, { json: true }, true, { key: url, ttlSeconds: CACHE_SEC }),
      mockedCampusEvents[campus],
    );
    return mappedEvents(data.events);
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
    const xml = await fetchData(
      () =>
        cache.get(ACADEMIC_CALENDAR_URL, {}, true, {
          key: ACADEMIC_CALENDAR_URL,
          ttlSeconds: CACHE_SEC,
        }),
      mockedAcademicCalendar,
    );
    const { items } = await parser.parseString(xml);

    return items;
  } catch (err) {
    throw err;
  }
};

/**
 * Gets employee events from Localist.
 * @returns {Promise<Object[]>}
 */
export const getEmployeeEvents = async (): Promise<object[]> => {
  try {
    const url = `${LOCALIST_BASE_URL}/events?event_type=${EVENT_TYPES.employee}&days=${EVENT_DAYS_AGO}`;
    const data = await fetchData(
      () => cache.get(url, { json: true }, true, { key: url, ttlSeconds: CACHE_SEC }),
      mockedEventsEmployee,
    );
    return mappedEvents(data.events);
  } catch (err) {
    throw err;
  }
};
