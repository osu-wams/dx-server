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
  userMessageResults?: {
    items: Types.UserMessage[];
    count: number;
    lastKey?: string;
  };
  userMessage?: Types.UserMessage;
  message?: string;
}

const authHeader = () => {
  return { 'x-api-key': DX_MCM_TOKEN };
};

export const findByChannelPath = (osuId: string, onid: string) =>
  `/api/v1/userMessages/channel/${DX_MCM_DASHBOARD_CHANNEL}/${onid}-${osuId}`;
export const findByChannelUrl = (osuId: string, onid: string) =>
  `${DX_MCM_BASE_URL}${findByChannelPath(osuId, onid)}`;

export const markReadPath = (osuId: string, onid: string, messageIdOrAll: string) =>
  `/api/v1/userMessages/read/${DX_MCM_DASHBOARD_CHANNEL}/${messageIdOrAll}/${onid}-${osuId}`;
export const markReadUrl = (osuId: string, onid: string, messageIdOrAll: string) =>
  `${DX_MCM_BASE_URL}${markReadPath(osuId, onid, messageIdOrAll)}`;

/**
 * Get the users messages
 * @returns {Promise<UserMessageItems>}
 */
export const getUserMessages = async (
  osuId: string,
  onid: string,
): Promise<Types.UserMessageItems> => {
  try {
    const url = findByChannelUrl(osuId, onid);

    const {
      userMessageResults: { items, lastKey },
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
 * Update the UserMessage status to mark as read
 * @returns {Promise<UserMessage>}
 */
export const markRead = async (
  osuId: string,
  onid: string,
  messageId: string = 'all',
): Promise<Types.UserMessage | { message: string }> => {
  try {
    const url = markReadUrl(osuId, onid, messageId);

    const { userMessage, message }: UserMessageApiResponse = await fetchData(
      () =>
        cache.get(url, { json: true, headers: authHeader() }, true, {
          key: url,
          ttlSeconds: DX_MCM_CACHE_SEC,
        }),
      mockedUserMessages[0],
    );
    return userMessage || { message };
  } catch (err) {
    throw err;
  }
};
