import request from 'node-fetch';
import config from 'config';
import logger from '../../logger';
import cache from './cache';

import { OSU_ERROR_SEC_THRESH, OSU_ERROR_OCCUR_THRESH } from '../../constants';

export const MS_TEAMS_URL: string = config.get('msTeamsHook');

// TODO: Change 'facts?: any' to correct format for facts:
/*
facts interface : {
    name: string,
    value: string | number
}
*/
export const createTeamsPayload = (title: string, subtitle?: string, facts?: any) => {
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
        facts: facts,
        markdown: true,
      },
    ],
  };
};

export const cacheFailureOrPing = async (err: Object, exceptionKey: string) => {
  const time = Date.now();

  let newData = [{ d: time, e: err }];

  let cacheData = JSON.parse(await cache.getAsync(exceptionKey));

  let hasExpired = true;

  if (cacheData) {
    hasExpired = time - cacheData.slice(-1)[0].d > OSU_ERROR_SEC_THRESH * 1000;
  }

  if (!cacheData || hasExpired) {
    await cache.setAsync(exceptionKey, JSON.stringify(newData));
  } else {
    cacheData = cacheData.concat(newData);
    if (cacheData.length >= OSU_ERROR_OCCUR_THRESH) {
      let facts = [
        {
          name: 'Failing endpoint',
          value: exceptionKey,
        },
        {
          name: 'Number of failed requests',
          value: OSU_ERROR_OCCUR_THRESH,
        },
        {
          name: 'Within Timespan of',
          value: `${OSU_ERROR_SEC_THRESH} seconds`,
        },
      ];
      let payload = createTeamsPayload('API Endpoint Failing', 'DX-Server', facts);

      logger().debug(`Sending API Fail message to 'MOS-Alerts' in MS Teams`);

      await sendTeamsMessage(payload);

      await cache.delAsync(exceptionKey);
    } else {
      await cache.setAsync(exceptionKey, JSON.stringify(cacheData));
    }
  }
};

const postTeamsMessage = async <T>(url: string, payload: Object): Promise<T> => {
  try {
    logger().debug(`MS Teams API POST request url:${url}`);
    const response = await request(url, {
      method: 'post',
      body: JSON.stringify(payload),
    });
    if (response.ok) {
      const data = await response.json();
      return data;
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

export const sendTeamsMessage = async (payload: Object): Promise<void> => {
  return postTeamsMessage(MS_TEAMS_URL, payload);
};
