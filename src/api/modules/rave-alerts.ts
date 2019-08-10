import Parser from 'rss-parser';
import config from 'config';
import { asyncTimedRequest } from '../../datadog';

const parser: Parser = new Parser();
const BASE_URL: string = config.get('raveApi.baseUrl');

/**
 * Gets active alerts from RAVE.
 * @returns {Promise<Object[]>}
 */
export const getAlerts = async (): Promise<object[]> => {
  try {
    // Rave alerts come as an RSS feed, always containing a single item.
    const { items } = await asyncTimedRequest(
      async () => parser.parseURL(BASE_URL),
      [],
      'rave.channel2.response_time'
    );
    const alert = items[0];

    // Check for the presence of 'all clear' text in the message body
    // 'all clear' indicates that an alert is NOT active and should not be displayed.
    const isAlertActive = !alert.title.match(/all clear/im) && !alert.content.match(/all clear/im);
    const data = isAlertActive ? [alert] : [];
    return data;
  } catch (err) {
    throw err;
  }
};

export default getAlerts;
