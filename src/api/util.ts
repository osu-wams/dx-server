import request from 'request-promise';
import config from 'config';
import { asyncTimedFunction } from '../tracer';

const CLIENT_ID: string = config.get('osuApi.clientId');
const CLIENT_SECRET: string = config.get('osuApi.clientSecret');

export const getToken = async (): Promise<string> => {
  /* eslint-disable camelcase */
  const response = (await asyncTimedFunction(
    () =>
      request({
        method: 'post',
        url: 'https://api.oregonstate.edu/oauth2/token',
        json: true,
        form: {
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          grant_type: 'client_credentials'
        }
      }),
    'getToken',
    []
  )) as { access_token: string };
  return response.access_token;
  /* eslint-enable camelcase */
};

export default getToken;
