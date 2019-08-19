import request from 'request-promise';
import config from 'config';
import querystring from 'querystring';
import { format } from 'date-fns';
import User from '../models/user'; // eslint-disable-line no-unused-vars
import { updateOAuthData } from './user-account'; // eslint-disable-line no-unused-vars

export const CANVAS_BASE_URL: string = config.get('canvasApi.baseUrl');
const CANVAS_TOKEN: string = config.get('canvasApi.token');
export const CANVAS_OAUTH_BASE_URL: string = config.get('canvasOauth.baseUrl');
export const CANVAS_OAUTH_TOKEN_URL: string = config.get('canvasOauth.tokenUrl');

// TODO: properly specify the interface members
export interface UpcomingAssignment {
  assignment: any;
}

/**
 * Fetch the planner items associated to a specific users id
 * @param osuId - a specific users id
 */
export const getPlannerItemsMask = async (osuId: number): Promise<UpcomingAssignment[]> => {
  const today = format(Date.now(), 'YYYY-MM-DD');
  return request({
    method: 'GET',
    url: `${CANVAS_BASE_URL}/planner/items?as_user_id=sis_user_id:${osuId}&start_date=${today}`,
    auth: { bearer: CANVAS_TOKEN }
  }).promise();
};

/**
 * Fetch the planner items associated to the oauth token provided by the logged in user
 * @param accessToken - the currently valid oauth token
 */
export const getPlannerItemsOAuth = async (accessToken: string): Promise<UpcomingAssignment[]> => {
  const today = format(Date.now(), 'YYYY-MM-DD');
  return request({
    method: 'GET',
    url: `${CANVAS_BASE_URL}/planner/items?start_date=${today}`,
    auth: { bearer: accessToken }
  }).promise();
};

/**
 * Performs a oauth2 token refresh against canvas.
 * @param {string} refreshToken
 */
export const performRefresh = async (u: User): Promise<User> => {
  const user: User = u;
  const query = querystring.stringify({
    grant_type: 'refresh_token',
    client_id: config.get('canvasOauth.id'),
    client_secret: config.get('canvasOauth.secret'),
    refresh_token: user.refreshToken
  });

  try {
    const body = await request({
      method: 'POST',
      uri: `${CANVAS_OAUTH_BASE_URL}${CANVAS_OAUTH_TOKEN_URL}?${query}`
    });
    const response = JSON.parse(body);
    const expireTime = Math.floor(Date.now() / 1000) + parseInt(response.expires_in, 10);
    user.canvasOauthToken = response.access_token;
    user.canvasOauthExpire = expireTime;
    user.isCanvasOptIn = true;
    console.debug('performRefresh token after refreshing:', user.canvasOauthToken); // eslint-disable-line no-console
    return user;
  } catch (err) {
    console.error('performRefresh token error:', err); // eslint-disable-line no-console
    // Refresh token is no longer valid and we must update the database
    await updateOAuthData(user, { isCanvasOptIn: false, account: { refreshToken: '' } });
    user.canvasOauthToken = null;
    user.canvasOauthExpire = null;
    user.isCanvasOptIn = false;
    return user;
  }
};

// If token is valid return token else refresh and return the updated token
export const getOAuthToken = async (u: User): Promise<User> => {
  const user = await performRefresh(u);
  return user;
};
