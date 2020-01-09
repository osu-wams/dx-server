import request from 'request-promise';
import config from 'config';
import { useMocks } from '../index';
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
          grant_type: 'client_credentials',
        },
      }),
    'getToken',
    [],
  )) as { access_token: string };
  return response.access_token;
  /* eslint-enable camelcase */
};

/**
 * Fetch data from the API or return mocked data if the server is
 * configured to do so and mockData is provided.
 * @param fn the function to run when not using mocked data
 * @param mockData the mocked data to return when using mocks
 */
export const fetchData = async (fn: Function, mockData?: any) => {
  if (useMocks && mockData !== undefined) {
    return mockData;
  }
  return fn();
};

export default getToken;
