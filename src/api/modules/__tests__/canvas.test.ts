/* eslint-disable no-unused-vars */

import nock from 'nock';
import querystring from 'querystring';
import {
  getPlannerItems,
  refreshOAuthToken,
  postRequest,
  CANVAS_BASE_URL,
  CANVAS_OAUTH_BASE_URL,
  CANVAS_OAUTH_TOKEN_URL,
} from '../canvas';

const mockFindReturn = jest.fn();
const mockUpdateCanvasDataReturn = jest.fn();
jest.mock('../../models/user', () => ({
  ...jest.requireActual('../../models/user'),
  find: () => mockFindReturn(),
  updateCanvasData: () => mockUpdateCanvasDataReturn(),
}));

const user = {
  osuId: 123456,
  firstName: 'f',
  lastName: 'l',
  email: 'e',
  primaryAffiliation: 'employee',
  affiliations: ['employee'],
  groups: [],
};
const assignment = { assignment: 'test' };

describe('Canvas module', () => {
  describe('postRequest', () => {
    it('refreshes oauth from canvas', async () => {
      nock(CANVAS_OAUTH_BASE_URL)
        .post(CANVAS_OAUTH_TOKEN_URL)
        .query(true)
        .reply(200, { access_token: 'bobross', expires_in: '8675309' });
      const query = querystring.stringify({
        grant_type: 'refresh_token',
        client_id: 'bogus',
        client_secret: 'bogus',
        refresh_token: 'bogus',
        // scope: config.get('canvasOauth.scope'),
      });
      const result = await postRequest(user, query);
      expect(result.canvasOptIn).toBeTruthy();
      expect(result.canvasOauthToken).toBe('bobross');
      // make sure the token expiration is moved forward (but don't get tripped by a race-condition in timing on CI)
      expect(result.canvasOauthExpire).toBeGreaterThan(Math.floor(Date.now() / 1000) + 867500);
    });

    it('resets canvas fields on method exception', async () => {
      nock(CANVAS_OAUTH_BASE_URL)
        .post(CANVAS_OAUTH_TOKEN_URL)
        .query(true)
        .reply(200, '-unparsable-should-blow-up-the.method-');
      mockUpdateCanvasDataReturn.mockImplementation(() => new Promise((res, rej) => res(user)));
      const query = querystring.stringify({
        grant_type: 'refresh_token',
        client_id: 'bogus',
        client_secret: 'bogus',
        refresh_token: 'bogus',
        // scope: config.get('canvasOauth.scope'),
      });
      const result = await postRequest(user, query);
      expect(JSON.stringify(result)).toEqual(
        JSON.stringify({
          osuId: 123456,
          firstName: 'f',
          lastName: 'l',
          email: 'e',
          primaryAffiliation: 'employee',
          affiliations: ['employee'],
          groups: [],
          canvasOauthToken: null,
          canvasOauthExpire: null,
          canvasOptIn: false,
          canvasRefreshToken: null,
        }),
      );
    });
  });

  describe('refreshOAuthToken', () => {
    it('refreshes oauth from canvas', async () => {
      nock(CANVAS_OAUTH_BASE_URL)
        .post(CANVAS_OAUTH_TOKEN_URL)
        .query(true)
        .reply(200, { access_token: 'bobross', expires_in: '8675309' });
      const result = await refreshOAuthToken(user);
      expect(result.canvasOptIn).toBeTruthy();
      expect(result.canvasOauthToken).toBe('bobross');
      // make sure the token expiration is moved forward (but don't get tripped by a race-condition in timing on CI)
      expect(result.canvasOauthExpire).toBeGreaterThan(Math.floor(Date.now() / 1000) + 867500);
    });
  });

  describe('getPlannerItems using oAuth', () => {
    it('returns upcoming assignments', async () => {
      nock(CANVAS_BASE_URL).get('/planner/items').query(true).reply(200, [assignment]);
      const result = await getPlannerItems({ oAuthToken: 'someToken' });
      expect(result).toStrictEqual(JSON.stringify([assignment]));
    });
  });

  describe('getPlannerItems as user', () => {
    it('returns upcoming assignments', async () => {
      nock(CANVAS_BASE_URL).get('/planner/items').query(true).reply(200, [assignment]);
      const result = await getPlannerItems({ osuId: 123456 });
      expect(result).toStrictEqual(JSON.stringify([assignment]));
    });
  });
});
