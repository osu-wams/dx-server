import request from 'node-fetch';
import logger from '../../logger';
import cache from './cache';
import { ENV, MS_TEAMS_URL } from '../../constants';

interface Facts {
  name: string;
  value: string | number;
}

interface Config {
  timeThreshold: number;
  errThreshold: number;
}

interface TeamsPayload {
  '@type': string;
  '@context': string;
  themeColor: string;
  summary: string;
  sections: {
    activityTitle: string;
    activitySubtitle?: string;
    activityImage: string;
    facts: Facts[];
    markdown: boolean;
  }[];
}

export const createTeamsPayload = (
  title: string,
  subtitle?: string,
  facts?: Facts[],
): TeamsPayload => {
  return {
    '@type': 'MessageCard',
    '@context': 'http://schema.org/extensions',
    themeColor: '0076D7',
    summary: title,
    sections: [
      {
        activityTitle: title,
        activitySubtitle: subtitle,
        activityImage: 'https://teamsnodesample.azurewebsites.net/static/img/image5.png',
        facts,
        markdown: true,
      },
    ],
  };
};

const postTeamsMessage = async (url: string, payload: TeamsPayload): Promise<boolean> => {
  try {
    if (!url) return false; // Do not attempt to post a message if the url hasn't been set
    if (ENV === 'test') return false; // Do not attempt to post a message during test

    logger().debug(`MS Teams API POST request url:${url}`);
    const response = await request(url, {
      method: 'post',
      body: JSON.stringify(payload),
    });
    if (response.ok) {
      return response.ok;
    }
    throw Object({
      response: {
        statusCode: response.status,
        status: response.status,
        statusText: response.statusText,
      },
    });
  } catch (err) {
    logger().debug(`MS Teams API POST request url:${url} failed: ${err}`);
    throw err;
  }
};

export const sendTeamsMessage = async (payload: TeamsPayload): Promise<boolean> =>
  postTeamsMessage(MS_TEAMS_URL, payload);

export const computeHasExpired = (time, cacheData, configLocal) => {
  return time - cacheData.slice(-1)[0].d > configLocal.timeThreshold * 1000;
};

export const cacheFailureOrPing = async (
  err: Object,
  exceptionKey: string,
  configLocal: Config,
) => {
  const time = Date.now();
  const newData = [{ d: time, e: err }];
  const cacheData = await cache.getAsync(exceptionKey);
  let hasExpired = true;
  if (cacheData) {
    hasExpired = computeHasExpired(time, JSON.parse(cacheData), configLocal);
  }
  if (!cacheData || hasExpired) {
    await cache.setAsync(exceptionKey, JSON.stringify(newData));
  } else {
    const moreCache = JSON.parse(cacheData).concat(newData);
    if (moreCache.length >= configLocal.errThreshold) {
      const facts = [
        {
          name: 'Failing endpoint',
          value: exceptionKey,
        },
        {
          name: 'Number of failed requests',
          value: configLocal.errThreshold,
        },
        {
          name: 'Within Timespan of',
          value: `${configLocal.timeThreshold} seconds`,
        },
      ];
      const payload = createTeamsPayload('API Endpoint Failing', 'DX-Server', facts);
      logger().debug(`Sending API Fail message to 'MOS-Alerts' in MS Teams`);
      await sendTeamsMessage(payload);
      await cache.delAsync(exceptionKey);
    } else {
      await cache.setAsync(exceptionKey, JSON.stringify(moreCache));
    }
  }
};

export default { createTeamsPayload, sendTeamsMessage, cacheFailureOrPing, computeHasExpired };
