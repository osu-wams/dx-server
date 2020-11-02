import request from 'node-fetch'; // eslint-disable-line no-unused-vars
import { USE_MOCKS, OSU_API_CLIENT_ID, OSU_API_CLIENT_SECRET } from '../constants';
import { asyncTimedFunction } from '../tracer';

export const getToken = async (): Promise<string> => {
  const params = new URLSearchParams({
    client_id: OSU_API_CLIENT_ID,
    client_secret: OSU_API_CLIENT_SECRET,
    grant_type: 'client_credentials',
  });
  const requestInit = {
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

/**
 * Sort array of objects based on field names provided.
 *
 * Sort a list of objects by lastName and then firstName descending order:
 * ```
 *  [
 *   { firstName: "Steve", lastName: "Ross" },
 *   { firstName: "Bob", lastName: "Ross" },
 *   { firstName: "Rick", lastName: "Ross" }
 *  ].sort(sortBy(['lastName', '-firstName']));
 * ```
 *
 * Returns;
 * ```
 *  [
 *   { firstName: "Steve", lastName: "Ross" },
 *   { firstName: "Rick", lastName: "Ross" },
 *   { firstName: "Bob", lastName: "Ross" }
 *  ]
 * ```
 * @param f array of field names to sort (preceding - sorts in reverse order)
 */
export const sortBy = (f: string[]) => {
  const sortDirections = [];
  const fields = f.map((field, i) => {
    if (field[0] === '-') {
      sortDirections[i] = -1;
      return field.substring(1);
    }
    sortDirections[i] = 1;
    return field;
  });

  return (a: string, b: string) => {
    for (let i = 0; i < fields.length; i += 1) {
      const field = fields[i];
      if (a[field] > b[field]) return sortDirections[i];
      if (a[field] < b[field]) return -sortDirections[i];
    }
    return 0;
  };
};

export default getToken;
