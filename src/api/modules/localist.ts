import Parser from 'rss-parser';
import { Types, User } from '@osu-wams/lib'; // eslint-disable-line no-unused-vars
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
interface ILocalistEvent {
  event: {
    id: number;
    title: string;
    localist_url: string;
    photo_url: string;
    campus_id?: number;
    geo: {
      city?: string;
      state?: string;
      country?: string;
      zip?: string;
    };
    event_instances: {
      event_instance: {
        start: string;
        id: number;
      };
    }[];
  };
}

interface ILocalistEvents {
  events: ILocalistEvent[];
}

const getCampusCode = (campus_id?: number): string | undefined => {
  if (campus_id === undefined) return undefined;
  // get the key name matching by provided campus_id, then get the campus code value for that key.
  // CAMPUS_IDS from configuration (ie. { corvallis: 1234, bend: 4321 })
  // CAMPUS_CODES from @osu-wams/lib (ie. { corvallis: 'C', bend: 'B', ecampus: 'DSC' })
  const campus_name = Object.keys(CAMPUS_IDS).find((k) => CAMPUS_IDS[k] === campus_id);
  return User.CAMPUS_CODES[campus_name];
};

const mappedEvents = (events: ILocalistEvent[]): Types.LocalistEvent[] => {
  return events.map((e: ILocalistEvent) => ({
    action: {
      link: e.event.localist_url,
    },
    bg_image: e.event.photo_url,
    date: e.event.event_instances[0].event_instance.start,
    id: e.event.event_instances[0].event_instance.id,
    title: e.event.title,
    type: 'localist',
    campus_id: e.event.campus_id,
    campus_code: getCampusCode(e.event.campus_id),
    city: e.event.geo.city,
  }));
};
/* eslint-enable camelcase */

/**
 * Gets events from Localist.
 * @param {Object} query - An object containing key/value pairs to be used as query parameters.
 * @returns {Promise<LocalistEvent[]>}
 */
export const getEvents = async (): Promise<Types.LocalistEvent[]> => {
  try {
    const url = `${LOCALIST_BASE_URL}/events/search?search=${EVENT_DX_QUERY}&days=${EVENT_DAYS_AGO}`;
    const data: ILocalistEvents = await fetchData(
      () => cache.get(url, { json: true }, true, { key: url, ttlSeconds: CACHE_SEC }),
      mockedEventsDx,
    );
    return mappedEvents(data.events);
  } catch (err) {
    throw err;
  }
};

/**
 * Gets events from Localist.
 * @param {Object} campus - The campus name (ie. Corvallis, Bend)
 * @returns {Promise<LocalistEvent[]>}
 */
export const getCampusEvents = async (campus: string): Promise<Types.LocalistEvent[]> => {
  try {
    const url = `${LOCALIST_BASE_URL}/events?campus_id=${CAMPUS_IDS[campus]}&days=${EVENT_DAYS_AGO}`;
    const data: ILocalistEvents = await fetchData(
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
 * @returns {Promise<AcademicEvent[]>}
 */
export const getAcademicCalendarEvents = async (): Promise<Types.AcademicEvent[]> => {
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

    return items as Types.AcademicEvent[];
  } catch (err) {
    throw err;
  }
};

/**
 * Gets employee events from Localist.
 * @returns {Promise<LocalistEvent[]>}
 */
export const getEmployeeEvents = async (): Promise<Types.LocalistEvent[]> => {
  try {
    const url = `${LOCALIST_BASE_URL}/events?type[]=${EVENT_TYPES.employee}&days=${EVENT_DAYS_AGO}`;
    const data: ILocalistEvents = await fetchData(
      () => cache.get(url, { json: true }, true, { key: url, ttlSeconds: CACHE_SEC }),
      mockedEventsEmployee,
    );
    return mappedEvents(data.events);
  } catch (err) {
    throw err;
  }
};
