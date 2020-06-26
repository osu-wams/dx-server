import request from 'node-fetch';
import { USE_MOCKS, OSU_API_CLIENT_ID, OSU_API_CLIENT_SECRET } from '../constants';
import { asyncTimedFunction } from '../tracer';

export const getToken = async (): Promise<string> => {
  const params = new URLSearchParams({
    client_id: OSU_API_CLIENT_ID,
    client_secret: OSU_API_CLIENT_SECRET,
    grant_type: 'client_credentials',
  });
  const requestInit: RequestInit = {
    method: 'POST',
    body: params,
  };

  /* eslint-disable camelcase */
  const response = (await asyncTimedFunction(
    async () => {
      // @ts-ignore
      const res = await request('https://api.oregonstate.edu/oauth2/token', requestInit);
      return res.json();
    },
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
  if (USE_MOCKS && mockData !== undefined) {
    return mockData;
  }
  return fn();
};

export default getToken;
