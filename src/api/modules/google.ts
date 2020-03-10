import { google } from 'googleapis';
import { JWT } from 'google-auth-library'; // eslint-disable-line no-unused-vars
import logger from '../../logger';
import { asyncTimedFunction } from '../../tracer';
import {
  GOOGLE_ANALYTICS_VIEW_ID,
  GOOGLE_PRIVATE_KEY,
  GOOGLE_SERVICE_ACCOUNT_EMAIL,
} from '../../constants';
import TrendingResource from '../models/trendingResource';

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
export const getGaData = async (jwt: JWT, start: string, end: string): Promise<string[][]> =>
  asyncTimedFunction(
    async () => {
      try {
        const response = await google.analytics('v3').data.ga.get({
          auth: jwt,
          ids: `ga:${GOOGLE_ANALYTICS_VIEW_ID}`,
          'start-date': start,
          'end-date': end,
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
/* eslint-enable camelcase */

export const getTrendingResources = async (
  start: string = 'yesterday',
  end: string = 'today',
): Promise<TrendingResource[]> => {
  const jwt = await getJWT();
  const rows = await getGaData(jwt, start, end);
  return rows?.map((r: string[]) => new TrendingResource(r[0], r[1], r[2], r[3]));
};
