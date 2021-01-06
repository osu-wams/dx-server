import request from 'node-fetch';
import config from 'config';
import querystring from 'querystring';
import { format } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';
import { Types } from '@osu-wams/lib'; // eslint-disable-line no-unused-vars
import User from '../models/user'; // eslint-disable-line no-unused-vars
import { updateOAuthData } from './user-account'; // eslint-disable-line no-unused-vars
import { fetchData } from '../util';
import logger from '../../logger';
import mockedCanvasPlannerItems from '../../mocks/canvas/planner-items.data';

export const CANVAS_BASE_URL: string = config.get('canvasApi.baseUrl');
const CANVAS_TOKEN: string = config.get('canvasApi.token');
export const CANVAS_OAUTH_BASE_URL: string = config.get('canvasOauth.baseUrl');
export const CANVAS_OAUTH_TOKEN_URL: string = config.get('canvasOauth.tokenUrl');
export const CANVAS_OAUTH_ID: string = config.get('canvasOauth.id');
export const CANVAS_OAUTH_SECRET: string = config.get('canvasOauth.secret');
export const CANVAS_OAUTH_SCOPE: string = config.get('canvasOauth.scope');

export interface ICanvasAPIParams {
  osuId?: number;
  oAuthToken?: string;
}

/* eslint-disable camelcase */
interface ICanvasRefreshTokenGrant {
  grant_type: string;
  client_id: string;
  client_secret: string;
  refresh_token: string;
  scope?: string;
}

interface ICanvasAuthorizationCodeGrant {
  grant_type: string;
  client_id: string;
  client_secret: string;
  code: string;
  scope?: string;
}
/* eslint-enable camelcase */

const appendUserIdParam = (url: string, osuId: number) => {
  return `${url}&as_user_id=sis_user_id:${osuId}`;
};

const filtered = (plannerItems: Types.PlannerItem[]): Types.PlannerItem[] => {
  return plannerItems.filter(
    (p) =>
      !p.planner_override ||
      !(p.planner_override?.marked_complete || p.planner_override?.dismissed),
  );
};

const getRequest = async (url: string, token: string | undefined): Promise<any> => {
  try {
    logger().debug(`Canvas API GET request url:${url}`);
    const response = await request(url, {
      headers: { Authorization: `Bearer ${token || CANVAS_TOKEN}` },
    });
    if (response.ok) {
      const data = await response.json();
      return JSON.stringify(filtered(data));
    }
    throw Object({
      response: {
        statusCode: response.status,
        status: response.status,
        statusText: response.statusText,
      },
    });
  } catch (err) {
    logger().debug(`Canvas API GET request url:${url} failed: ${err}`);
    throw err;
  }
};

/**
 * Get a users planner items from the Canvas API.
 * * https://canvas.instructure.com/doc/api/planner.html
 * @param params a masqueraded user or a users provide oAuth token
 */
export const getPlannerItems = async (params: ICanvasAPIParams): Promise<Types.PlannerItem[]> => {
  // set time to PST
  const pst = utcToZonedTime(Date.now(), 'America/Los_Angeles');
  const today = format(pst, 'yyyy-MM-dd');
  let url = `${CANVAS_BASE_URL}/planner/items?start_date=${today}`;
  if (params.osuId) {
    url = appendUserIdParam(url, params.osuId);
  }
  return fetchData(() => getRequest(url, params.oAuthToken), mockedCanvasPlannerItems);
};

/**
 * Performs a oauth2 token fetch against canvas.
 */
/* eslint-disable camelcase */
export const postRequest = async (u: User, query: string): Promise<User> => {
  const user: User = u;
  try {
    const response = await request(`${CANVAS_OAUTH_BASE_URL}${CANVAS_OAUTH_TOKEN_URL}?${query}`, {
      method: 'POST',
    });

    if (response.ok) {
      const { refresh_token, access_token, expires_in } = await response.json();
      const expireTime = Math.floor(Date.now() / 1000) + parseInt(expires_in, 10);
      if (refresh_token) user.canvasRefreshToken = refresh_token;
      user.canvasOauthToken = access_token;
      user.canvasOauthExpire = expireTime;
      user.canvasOptIn = true;
      await updateOAuthData(user, {
        isCanvasOptIn: user.canvasOptIn,
        account: { refreshToken: user.canvasRefreshToken },
      });
      logger().debug(`canvas.postRequest refreshed user (${user.osuId}) OAuth credentials.`);
      return user;
    }
    throw Object({
      response: {
        statusCode: response.status,
        status: response.status,
        statusText: response.statusText,
      },
    });
  } catch (err) {
    logger().error(`canvas.postRequest token error: ${JSON.stringify(err)}`);
    // Refresh token is no longer valid and we must update the database
    await updateOAuthData(user, { isCanvasOptIn: false, account: { refreshToken: null } });
    user.canvasOauthToken = null;
    user.canvasOauthExpire = null;
    user.canvasOptIn = false;
    user.canvasRefreshToken = null;
    return user;
  }
};
/* eslint-enable camelcase */

// If token is valid return token else refresh and return the updated token
export const getOAuthToken = async (u: User, code: string): Promise<User> => {
  const user: User = u;
  /* eslint-disable camelcase */
  const params: ICanvasAuthorizationCodeGrant = {
    grant_type: 'authorization_code',
    client_id: CANVAS_OAUTH_ID,
    client_secret: CANVAS_OAUTH_SECRET,
    code,
  };
  /* eslint-enable camelcase */
  if (CANVAS_OAUTH_SCOPE !== '') {
    params.scope = CANVAS_OAUTH_SCOPE;
  }
  const query = querystring.stringify(params as any);
  return postRequest(user, query);
};

// If token is valid return token else refresh and return the updated token
export const refreshOAuthToken = async (u: User): Promise<User> => {
  const user: User = u;
  /* eslint-disable camelcase */
  const params: ICanvasRefreshTokenGrant = {
    grant_type: 'refresh_token',
    client_id: CANVAS_OAUTH_ID,
    client_secret: CANVAS_OAUTH_SECRET,
    refresh_token: user.canvasRefreshToken,
  };
  /* eslint-enable camelcase */
  if (CANVAS_OAUTH_SCOPE !== '') {
    params.scope = CANVAS_OAUTH_SCOPE;
  }

  const query = querystring.stringify(params as any);
  return postRequest(user, query);
};
