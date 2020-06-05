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

interface UserMessageApiResponse {
  action: string;
  object: {
    userMessageResults?: {
      items: Types.UserMessage[];
      count: number;
      lastKey?: string;
    };
    userMessage?: Types.UserMessage;
  };
}

const authHeader = () => {
  return { 'x-api-key': DX_MCM_TOKEN };
};

export const channelMessagesUrl = (osuId: string) =>
  `/api/v1/userMessages/channel/${DX_MCM_DASHBOARD_CHANNEL}/${osuId}`;

export const userMessageStatusUrl = (status: string, messageId: string, osuId: string) =>
  `/api/v1/userMessages/${status}/${DX_MCM_DASHBOARD_CHANNEL}/${messageId}/${osuId}`;

/**
 * Get the users messages
 * @returns {Promise<UserMessageItems>}
 */
export const getUserMessages = async (osuId: string): Promise<Types.UserMessageItems> => {
  try {
    const url = `${DX_MCM_BASE_URL}${channelMessagesUrl(osuId)}`;

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

/**
 * Update the UserMessage status
 * @returns {Promise<UserMessage>}
 */
export const updateUserMessage = async (
  status: string,
  messageId: string,
  osuId: string,
): Promise<Types.UserMessage> => {
  try {
    const url = `${DX_MCM_BASE_URL}${userMessageStatusUrl(status, messageId, osuId)}`;

    const {
      object: { userMessage },
    }: UserMessageApiResponse = await fetchData(
      () =>
        cache.get(url, { json: true, headers: authHeader() }, true, {
          key: url,
          ttlSeconds: DX_MCM_CACHE_SEC,
        }),
      mockedUserMessages[0],
    );
    return userMessage;
  } catch (err) {
    throw err;
  }
};
