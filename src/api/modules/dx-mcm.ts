import { Types } from '@osu-wams/lib'; // eslint-disable-line no-unused-vars
import cache from './cache';
import { fetchData } from '../util';
import {
  DX_MCM_BASE_URL,
  DX_MCM_DASHBOARD_CHANNEL,
  DX_MCM_CACHE_SEC,
  DX_MCM_TOKEN,
} from '../../constants';
import { mockedUserMessages } from '../../mocks/dx-mcm';

const BASE_URL = `${DX_MCM_BASE_URL}/api/v1`;
const authHeader = () => {
  return { 'x-api-key': DX_MCM_TOKEN };
};

/**
 * Get the users messages
 * @returns {Promise<UserMessage[]>}
 */
export const getUserMessages = async (osuId: string): Promise<Types.UserMessage[]> => {
  try {
    const url = `${BASE_URL}/userMessages/${DX_MCM_DASHBOARD_CHANNEL}/${osuId}`;

    const userMessages = await fetchData(
      () =>
        cache.get(url, { json: true, headers: authHeader() }, true, {
          key: BASE_URL,
          ttlSeconds: DX_MCM_CACHE_SEC,
        }),
      mockedUserMessages,
    );
    return userMessages;
  } catch (err) {
    throw err;
  }
};

export default getUserMessages;
