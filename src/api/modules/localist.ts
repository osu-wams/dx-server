import Parser from 'rss-parser';
import { Types, User } from '@osu-wams/lib'; // eslint-disable-line no-unused-vars
import cache from './cache';
import { fetchData } from '../util';
import {
  mockedAcademicCalendar,
  mockedCampusEvents,
  mockedEventsDx,
  mockedEventsEmployee,
} from '../../mocks/localist';
import {
  LOCALIST_ACADEMIC_CALENDAR_URL,
  LOCALIST_BASE_URL,
  LOCALIST_CACHE_SEC,
  LOCALIST_CAMPUS_IDS,
  LOCALIST_EVENT_DAYS_AGO,
  LOCALIST_EVENT_DX_QUERY,
  LOCALIST_EVENT_TYPES,
} from '../../constants';

const parser = new Parser();

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

const getCampus = (campus_id?: number): { campus_code?: string; campus_name?: string } => {
  if (!campus_id) return { campus_code: undefined, campus_name: undefined };
  // get the key name matching by provided campus_id, then get the campus code value for that key.
  // CAMPUS_IDS from configuration (ie. { corvallis: 1234, bend: 4321 })
  // CAMPUS_CODES from @osu-wams/lib (ie. { corvallis: ['C', 'J'], bend: ['B'], ecampus: ['DSC'] })
  const campus_name = Object.keys(LOCALIST_CAMPUS_IDS).find(
    (k) => LOCALIST_CAMPUS_IDS[k] === campus_id,
  );
  // If there is no matching campus ID configuration, revert to it being applied to all (undefined)
  if (!campus_name) return { campus_code: undefined, campus_name: undefined };
  // Safe to use the first value of the campus codes for this campus name because filtering methods
  // take into account all codes when checking for association.
  return { campus_code: User.CAMPUS_CODES[campus_name][0], campus_name };
};

const mappedEvents = (events: ILocalistEvent[]): Types.LocalistEvent[] => {
  return events.map((e: ILocalistEvent) => {
    const { campus_code, campus_name } = getCampus(e.event.campus_id);
    return {
      action: {
        link: e.event.localist_url,
      },
      bg_image: e.event.photo_url,
      date: e.event.event_instances[0].event_instance.start,
      id: e.event.event_instances[0].event_instance.id,
      title: e.event.title,
      type: 'localist',
      campus_id: e.event.campus_id,
      campus_code,
      campus_name,
      city: e.event.geo.city,
    };
  });
};
/* eslint-enable camelcase */

/**
 * Gets events from Localist.
 * @param {Object} query - An object containing key/value pairs to be used as query parameters.
 * @returns {Promise<LocalistEvent[]>}
 */
export const getEvents = async (): Promise<Types.LocalistEvent[]> => {
  const url = `${LOCALIST_BASE_URL}/events/search?search=${LOCALIST_EVENT_DX_QUERY}&days=${LOCALIST_EVENT_DAYS_AGO}`;
  const data: ILocalistEvents = await fetchData(
    url,
    () =>
      cache.get(url, { json: true, headers: { 'Content-Type': 'application/json' } }, true, {
        key: url,
        ttlSeconds: LOCALIST_CACHE_SEC,
      }),
    mockedEventsDx,
  );
  return mappedEvents(data.events);
};

/**
 * Gets events from Localist.
 * @param {Object} campus - The campus name (ie. Corvallis, Bend)
 * @returns {Promise<LocalistEvent[]>}
 */
export const getCampusEvents = async (campus: string): Promise<Types.LocalistEvent[]> => {
  const url = `${LOCALIST_BASE_URL}/events?campus_id=${LOCALIST_CAMPUS_IDS[campus]}&days=${LOCALIST_EVENT_DAYS_AGO}`;
  const data: ILocalistEvents = await fetchData(
    url,
    () =>
      cache.get(url, { json: true, headers: { 'Content-Type': 'application/json' } }, true, {
        key: url,
        ttlSeconds: LOCALIST_CACHE_SEC,
      }),
    mockedCampusEvents[campus],
  );
  return mappedEvents(data.events);
};

/**
 * Gets academic calendar events from Localist.
 * @returns {Promise<AcademicEvent[]>}
 */
export const getAcademicCalendarEvents = async (): Promise<Types.AcademicEvent[]> => {
  // Note: Getting academic calendar items via RSS as a workaround due to
  //       unlisted/restricted events not being visible via API.
  const xml = await fetchData(
    LOCALIST_ACADEMIC_CALENDAR_URL,
    () =>
      cache.get(LOCALIST_ACADEMIC_CALENDAR_URL, {}, true, {
        key: LOCALIST_ACADEMIC_CALENDAR_URL,
        ttlSeconds: LOCALIST_CACHE_SEC,
      }),
    mockedAcademicCalendar,
  );
  const { items } = await parser.parseString(xml);

  return items as Types.AcademicEvent[];
};

/**
 * Gets employee events from Localist.
 * @returns {Promise<LocalistEvent[]>}
 */
export const getEmployeeEvents = async (): Promise<Types.LocalistEvent[]> => {
  const url = `${LOCALIST_BASE_URL}/events?type[]=${LOCALIST_EVENT_TYPES.employee}&days=${LOCALIST_EVENT_DAYS_AGO}`;
  const data: ILocalistEvents = await fetchData(
    url,
    () =>
      cache.get(url, { json: true, headers: { 'Content-Type': 'application/json' } }, true, {
        key: url,
        ttlSeconds: LOCALIST_CACHE_SEC,
      }),
    mockedEventsEmployee,
  );
  return mappedEvents(data.events);
};
