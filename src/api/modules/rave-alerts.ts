import Parser from 'rss-parser';
import config from 'config';
import { Types } from '@osu-wams/lib'; // eslint-disable-line no-unused-vars
import cache from './cache';
import { fetchData } from '../util';
import { mockedRaveAlerts } from '../../mocks/rave';

const parser: Parser = new Parser();
const BASE_URL: string = config.get('raveApi.baseUrl');
const CACHE_SEC = parseInt(config.get('raveApi.cacheEndpointSec'), 10);
/**
 * Gets active alerts from RAVE.
 * @returns {Promise<Object[]>}
 */
export const getAlerts = async (): Promise<Types.Alert[]> => {
  // Rave alerts come as an RSS feed, always containing a single item.
  const xml = await fetchData(
    () =>
      cache.get(BASE_URL, {}, true, {
        key: BASE_URL,
        ttlSeconds: CACHE_SEC,
      }),
    mockedRaveAlerts,
  );
  const { items } = await parser.parseString(xml);
  const alert: Types.Alert = {
    title: items[0].title,
    content: items[0].content,
    date: items[0].date,
    type: 'rave',
    updated: items[0].date,
  };

  // Check for the presence of 'all clear' text in the message body
  // 'all clear' indicates that an alert is NOT active and should not be displayed.
  const isAlertActive = !alert.title.match(/all clear/im) && !alert.content.match(/all clear/im);
  const data = isAlertActive ? [alert] : [];
  return data;
};

export default getAlerts;
