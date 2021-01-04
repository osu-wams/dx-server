/* eslint-disable camelcase */

import { analytics_v3, google } from 'googleapis';
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
import TrendingResource, { GoogleTrendingResource } from '../models/trendingResource';
import { mockedTrendingResources } from '../../mocks/google/trendingResources';

const jwt = new google.auth.JWT(
  GOOGLE_SERVICE_ACCOUNT_EMAIL,
  null,
  GOOGLE_PRIVATE_KEY,
  'https://www.googleapis.com/auth/analytics.readonly',
);

// eslint-disable-next-line
const getGaData = async (params: analytics_v3.Params$Resource$Data$Ga$Get) =>
  google.analytics('v3').data.ga.get(params);

export const fetchActiveUsers = async (
  metrics: 'ga:1dayUsers' | 'ga:7dayUsers' | 'ga:14dayUsers' | 'ga:30dayUsers',
): Promise<string[][]> =>
  asyncTimedFunction(
    async () => {
      try {
        await jwt.authorize();
        const response = await getGaData({
          auth: jwt,
          ids: `ga:${GOOGLE_ANALYTICS_VIEW_ID}`,
          'start-date': `1daysAgo`,
          'end-date': `1daysAgo`,
          metrics,
          dimensions: 'ga:date',
        });
        return response.data.rows ?? [];
      } catch (err) {
        logger().error(`GoogleAPI:fetchActiveUsers API call failed: ${err}`);
        throw err;
      }
    },
    'GoogleAPI:fetchActiveUsers',
    [],
  );

export const fetchPageViews = async (
  daysAgo: number,
  rangeDays: number,
  maxResults: number,
): Promise<string[][]> =>
  asyncTimedFunction(
    async () => {
      try {
        await jwt.authorize();
        const response = await getGaData({
          auth: jwt,
          ids: `ga:${GOOGLE_ANALYTICS_VIEW_ID}`,
          'start-date': `${daysAgo}daysAgo`,
          'end-date': `${daysAgo - rangeDays}daysAgo`,
          metrics: 'ga:pageviews',
          dimensions: 'ga:pagePath',
          sort: '-ga:pageviews',
          'max-results': maxResults,
        });
        return response.data.rows ?? [];
      } catch (err) {
        logger().error(`GoogleAPI:fetchPageViews API call failed: ${err}`);
        throw err;
      }
    },
    'GoogleAPI:fetchPageViews',
    [],
  );

export const mappedTrendingResources = (rows: string[][], date: string): GoogleTrendingResource[] =>
  rows?.map((r: string[]) => ({
    resourceId: r[0],
    concatenatedTitle: r[1],
    totalEvents: r[2],
    uniqueEvents: r[3],
    date,
  }));

/**
 * Query Google API for a single day of trending resource events. `daysAgo` is best here because
 * the bulk queries using calculated dates were suffering from race conditions with nodejs, but
 * simple math with `daysAgo` is resilient. Throw caught errors upstream or return an empty array if
 * the day had no events to return but was a successful response.
 * @param daysAgo the number of days ago for the end-date
 *
 */
export const fetchTrendingResources = async (daysAgo: number): Promise<string[][]> =>
  asyncTimedFunction(
    async () => {
      try {
        await jwt.authorize();
        const response = await getGaData({
          auth: jwt,
          ids: `ga:${GOOGLE_ANALYTICS_VIEW_ID}`,
          'start-date': `${daysAgo + 1}daysAgo`,
          'end-date': `${daysAgo}daysAgo`,
          metrics: 'ga:totalEvents,ga:uniqueEvents',
          dimensions: 'ga:eventAction,ga:eventLabel',
          filters: 'ga:eventCategory==Trending-Resource',
        });
        return response.data.rows ?? [];
      } catch (err) {
        logger().error(`GoogleAPI:fetchTrendingResources API call failed: ${err}`);
        throw err;
      }
    },
    'GoogleAPI:fetchTrendingResources',
    [],
  );

const cacheResources = async (cacheKey: string, resources: TrendingResource[]) =>
  setCache(cacheKey, JSON.stringify(resources), {
    mode: 'EX',
    duration: GOOGLE_CACHE_SEC,
    flag: 'NX',
  });

/**
 * The nature of the Google API caused race conditions that lent itself to using `daysAgo` in order to
 * target and query a single days worth of analytics instead of calculating dates directly. See `fetchTrendingResources` for details.
 *
 * If an error is handled, consider this an failed request to Google API, so don't cache an empty array.. this helps to
 * cause the next time this date is requested to try fetching it from Google until it was successful (even if the sucessful query
 * was an empty data set because there were no events on that day)
 * @param dateKey date in the form of YYYY-MM-DD
 * @param daysAgo the number of days ago the dateKey is referencing
 * @param cacheKey the full cache key for persisting results to cache
 */
const getTrendingResourcesFromGoogle = async (
  dateKey: string,
  daysAgo: number,
  cacheKey: string,
): Promise<TrendingResource[]> => {
  try {
    const rows: string[][] = await fetchTrendingResources(daysAgo);
    const promises = mappedTrendingResources(rows, dateKey).map((r) => TrendingResource.upsert(r));
    const resources = await Promise.all(promises);
    await cacheResources(cacheKey, resources || []);
    return resources;
  } catch (err) {
    logger().error(`GoogleAPI:getTrendingResourcesFromGoogle failed: ${err}`);
    return [];
  }
};

/**
 * Try to fetch all records with the partition key (dateKey) from DynamoDb, in the case where the
 * cache had been cleared. The goal is to prevent the need for having to continually query Google API and
 * to have long term records to use for query and analysis.
 * @param dateKey date in the form of YYYY-MM-DD, the partition key for the dynamodb table
 * @param cacheKey the full cache key for persisting results to cache
 */
const getTrendingResourcesFromDatabase = async (
  dateKey: string,
  cacheKey: string,
): Promise<TrendingResource[]> => {
  try {
    const resources = await TrendingResource.findAll(dateKey);
    if (resources.length > 0) {
      await cacheResources(cacheKey, resources);
    }
    return resources;
  } catch (err) {
    logger().error(`GoogleAPI:getTrendingResourcesFromDatabase failed: ${err}`);
    return [];
  }
};

/**
 * Fetch the trending resources from persistent storage (prioritized by; redis cache, dynamodb, Google API).
 * @param daysAgo the number of days ago the dateKey is referencing
 * @param dateKey date in the form of YYYY-MM-DD
 */
const getCachedTrendingResources = async (
  daysAgo: number,
  dateKey: string,
): Promise<TrendingResource[]> => {
  try {
    const cacheKey = `trendingResources:${dateKey}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
    const resources = await getTrendingResourcesFromDatabase(dateKey, cacheKey);
    if (resources.length > 0) {
      return resources;
    }

    return getTrendingResourcesFromGoogle(dateKey, daysAgo, cacheKey);
  } catch (err) {
    logger().error(`GoogleAPI:getCachedTrendingResources failed: ${err}`);
    return [];
  }
};

/**
 * The primary method for fetching an array of trending resource objects on a given day.
 * @param date the date for the trending resource events
 */
export const getTrendingResources = async (
  daysAgo: number,
  date: Date,
): Promise<TrendingResource[]> => {
  const dateKey = date.toISOString().slice(0, 10);
  return fetchData(
    async () => getCachedTrendingResources(daysAgo, dateKey),
    mappedTrendingResources(mockedTrendingResources, dateKey),
  );
};

/**
 * The primary method for fetching an array of page view objects for a period of time
 * @param daysAgo the number of days to query back
 * @param rangeDays the number of days to include
 * @param maxResults the number of results to include
 */
export const getPageViews = async (
  daysAgo: number,
  rangeDays: number,
  maxResults: number,
): Promise<{
  fromDate: string;
  toDate: string;
  pageViews: { path: string; count: number }[];
}> => {
  const cacheKey = `pageViews.${daysAgo}.daysAgo.${rangeDays}.range.${maxResults}.maxResults`;

  const cached = await getCache(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const sd = new Date();
  sd.setDate(sd.getDate() - daysAgo);
  const fromDate = sd.toISOString().slice(0, 10);

  const ed = new Date();
  ed.setDate(ed.getDate() - (daysAgo - rangeDays));
  const toDate = ed.toISOString().slice(0, 10);

  const data = await fetchPageViews(daysAgo, rangeDays, maxResults);
  const pageViews = data.map((v) => ({ path: v[0], count: parseInt(v[1], 10) }));
  const results = { fromDate, toDate, pageViews };
  await setCache(cacheKey, JSON.stringify(results));
  return results;
};

/**
 * The primary method for fetching an array of active users for a period of time
 * @param metrics the google analytics metric to query
 */
export const getActiveUsers = async (
  metrics: 'ga:1dayUsers' | 'ga:7dayUsers' | 'ga:14dayUsers' | 'ga:30dayUsers',
): Promise<{ date: string; count: number }[]> => {
  const startDate = new Date().toISOString().slice(0, 10);
  const cacheKey = `activeUsers.${metrics}.date.${startDate}`;

  const cached = await getCache(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const data = await fetchActiveUsers(metrics);
  const users = data.map((v) => ({ date: v[0], count: parseInt(v[1], 10) }));
  await setCache(cacheKey, JSON.stringify(users));
  return users;
};
