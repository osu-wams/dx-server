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

interface UserMessageApiResponse {
  action: string;
  object: {
    userMessageResults: {
      items: Types.UserMessage[];
      count: number;
      lastKey?: string;
    };
  };
}
interface UserMessageResponse {
  items: Types.UserMessage[];
  lastKey?: string;
}

const authHeader = () => {
  return { 'x-api-key': DX_MCM_TOKEN };
};

/**
 * Get the users messages
 * @returns {Promise<UserMessageResponse>}
 */
export const getUserMessages = async (osuId: string): Promise<UserMessageResponse> => {
  try {
    const url = `${BASE_URL}/userMessages/channel/${DX_MCM_DASHBOARD_CHANNEL}/${osuId}`;

    const {
      object: {
        userMessageResults: { items, lastKey },
      },
    }: UserMessageApiResponse = await fetchData(
      () =>
        cache.get(url, { json: true, headers: authHeader() }, true, {
          key: url,
          ttlSeconds: DX_MCM_CACHE_SEC,
        }),
      mockedUserMessages,
    );
    // TODO: if userMessage.lastKey exists, fetch more messages by appending it to the url?
    return { items, lastKey };
  } catch (err) {
    throw err;
  }
};

export default getUserMessages;
