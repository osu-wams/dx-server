import request from 'request-promise';
import config from 'config';

const HANDSHAKE_BASE_URL: string = config.get('handshakeApi.baseUrl');
const HANDSHAKE_TOKEN: string = config.get('handshakeApi.token');

interface Jobs {
  jobs: any;
}

/**
 * Gets jobs.
 * @returns {Promise<Jobs>}
 */
export const getJobs = async (): Promise<Jobs> => {
  const data = await request({
    method: 'GET',
    url: `${HANDSHAKE_BASE_URL}/jobs?per_page=50`,
    auth: { bearer: HANDSHAKE_TOKEN },
    json: true
  });
  return data;
};

export default getJobs;
