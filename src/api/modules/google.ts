import { google } from 'googleapis';
import { JWT } from 'google-auth-library'; // eslint-disable-line no-unused-vars
import { getCache, setCache } from './cache';
import logger from '../../logger';
import { asyncTimedFunction } from '../../tracer';
import {
  GOOGLE_ANALYTICS_VIEW_ID,
  GOOGLE_CACHE_SEC,
  GOOGLE_PRIVATE_KEY,
  GOOGLE_SERVICE_ACCOUNT_EMAIL,
} from '../../constants';
import { fetchData } from '../util';
import TrendingResource from '../models/trendingResource';
import { mockedTrendingResources } from '../../mocks/google/trendingResources';

export const mappedTrendingResources = (rows: string[][], date: string): TrendingResource[] =>
  rows?.map(
    (r: string[]) =>
      new TrendingResource({
        trendingResource: {
          resourceId: r[0],
          concatenatedTitle: r[1],
          totalEvents: r[2],
          uniqueEvents: r[3],
          date,
        },
      }),
  );

export const getJWT = async (): Promise<JWT> =>
  asyncTimedFunction<JWT>(
    async () => {
      const jwt = new google.auth.JWT(
        GOOGLE_SERVICE_ACCOUNT_EMAIL,
        null,
        GOOGLE_PRIVATE_KEY,
        'https://www.googleapis.com/auth/analytics.readonly',
      );
      await jwt.authorize();
      return jwt;
    },
    'GoogleAPI:JWT',
    [],
  );

/* eslint-disable camelcase */
export const getGaData = async (jwt: JWT, start: Date): Promise<string[][]> => {
  const end = new Date();
  end.setDate(start.getDate() - 1);

  return asyncTimedFunction(
    async () => {
      try {
        const response = await google.analytics('v3').data.ga.get({
          auth: jwt,
          ids: `ga:${GOOGLE_ANALYTICS_VIEW_ID}`,
          'start-date': start.toISOString().slice(0, 10),
          'end-date': end.toISOString().slice(0, 10),
          metrics: 'ga:totalEvents,ga:uniqueEvents',
          dimensions: 'ga:eventAction,ga:eventLabel',
          filters: 'ga:eventCategory==Trending-Resource',
        });
        return response.data.rows;
      } catch (err) {
        logger().error(`GoogleAPI:getGaData API call failed: ${err}`);
        return null;
      }
    },
    'GoogleAPI:getGaData',
    [],
  );
};
/* eslint-enable camelcase */

/**
 * Return a cached multi-array of strings, the trending resource event data from Google Analytics.
 * If the data is not found in the cache, query it from Google and cache it before return.
 * @param date the date for the trending resource events
 * @param dateKey a string key of the date, intended to be YYYY-MM-DD
 */
const getCachedTrendingResources = async (
  date: Date,
  dateKey: string,
): Promise<TrendingResource[]> => {
  const cacheKey = `trendingResources:${dateKey}`;
  let rows: string[][];
  const cached = await getCache(cacheKey);
  if (cached) {
    rows = JSON.parse(cached);
  } else {
    const jwt = await getJWT();
    rows = await getGaData(jwt, date);
    await setCache(cacheKey, JSON.stringify(rows), {
      mode: 'EX',
      duration: GOOGLE_CACHE_SEC,
      flag: 'NX',
    });
  }
  return mappedTrendingResources(rows, dateKey);
};

/**
 * The primary method for fetching an array of trending resource objects on a given day.
 * @param date the date for the trending resource events
 */
export const getTrendingResources = async (date: Date): Promise<TrendingResource[]> => {
  const dateKey = date.toISOString().slice(0, 10);
  return fetchData(
    async () => getCachedTrendingResources(date, dateKey),
    mappedTrendingResources(mockedTrendingResources, dateKey),
  );
};
