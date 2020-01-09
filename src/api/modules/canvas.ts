import request from 'request-promise';
import config from 'config';
import querystring from 'querystring';
import { format } from 'date-fns';
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

// TODO: properly specify the interface members
export interface UpcomingAssignment {
  assignment: any;
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

const authHeader = (accessToken: string | undefined) => {
  return { bearer: accessToken || CANVAS_TOKEN };
};

const getRequest = async <T>(url: string, token: string | undefined): Promise<T> => {
  const auth = authHeader(token);
  logger().debug(`Canvas API GET request url:${url}`);
  return request.get(url, { auth }).promise();
};

/**
 * Get a users planner items from the Canvas API.
 * * https://canvas.instructure.com/doc/api/planner.html
 * @param params a masqueraded user or a users provide oAuth token
 */
export const getPlannerItems = async (params: ICanvasAPIParams): Promise<UpcomingAssignment[]> => {
  const today = format(Date.now(), 'yyyy-MM-dd');
  let url = `${CANVAS_BASE_URL}/planner/items?start_date=${today}`;
  if (params.osuId) {
    url = appendUserIdParam(url, params.osuId);
  }
  return fetchData(() => getRequest(url, params.oAuthToken), mockedCanvasPlannerItems);
};

/**
 * Performs a oauth2 token fetch against canvas.
 */
export const postRequest = async (u: User, query: string): Promise<User> => {
  const user: User = u;
  try {
    const body = await request({
      method: 'POST',
      uri: `${CANVAS_OAUTH_BASE_URL}${CANVAS_OAUTH_TOKEN_URL}?${query}`,
    });
    const response = JSON.parse(body);
    const expireTime = Math.floor(Date.now() / 1000) + parseInt(response.expires_in, 10);
    if (response.refresh_token) user.refreshToken = response.refresh_token;
    user.canvasOauthToken = response.access_token;
    user.canvasOauthExpire = expireTime;
    user.isCanvasOptIn = true;
    await updateOAuthData(user, {
      isCanvasOptIn: user.isCanvasOptIn,
      account: { refreshToken: user.refreshToken },
    });
    logger().debug(`canvas.postRequest refreshed user (${user.osuId}) OAuth credentials.`);
    return user;
  } catch (err) {
    logger().error(`canvas.postRequest token error: ${err.message}`);
    // Refresh token is no longer valid and we must update the database
    await updateOAuthData(user, { isCanvasOptIn: false, account: { refreshToken: null } });
    user.canvasOauthToken = null;
    user.canvasOauthExpire = null;
    user.isCanvasOptIn = false;
    user.refreshToken = null;
    return user;
  }
};

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
    refresh_token: user.refreshToken,
  };
  /* eslint-enable camelcase */
  if (CANVAS_OAUTH_SCOPE !== '') {
    params.scope = CANVAS_OAUTH_SCOPE;
  }

  const query = querystring.stringify(params as any);
  return postRequest(user, query);
};
