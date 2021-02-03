import request from 'node-fetch';
import config from 'config';
import logger from '../../logger';
import cache from './cache';

export const MS_TEAMS_URL: string = config.get('msTeamsHook');

interface Facts {
  name: string;
  value: string | number;
}

interface Config {
  timeThreshold: number;
  errThreshold: number;
}

export const createTeamsPayload = (title: string, subtitle?: string, facts?: Facts[]) => {
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

const postTeamsMessage = async (url: string, payload: Object): Promise<boolean> => {
  try {
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

export const sendTeamsMessage = async (payload: Object): Promise<boolean> =>
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

  let cacheData = JSON.parse(await cache.getAsync(exceptionKey));

  let hasExpired = true;

  if (cacheData) {
    hasExpired = computeHasExpired(time, cacheData, configLocal);
  }

  if (!cacheData || hasExpired) {
    await cache.setAsync(exceptionKey, JSON.stringify(newData));
  } else {
    cacheData = cacheData.concat(newData);
    if (cacheData.length >= configLocal.errThreshold) {
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
      await cache.setAsync(exceptionKey, JSON.stringify(cacheData));
    }
  }
};

export default { createTeamsPayload, sendTeamsMessage, cacheFailureOrPing, computeHasExpired };
