import request from 'request-promise';
import config from 'config';

const CLIENT_ID: string = config.get('osuApi.clientId');
const CLIENT_SECRET: string = config.get('osuApi.clientSecret');

export const getToken = async (): Promise<string> => {
  const response = await request({
    method: 'post',
    url: 'https://api.oregonstate.edu/oauth2/token',
    json: true,
    form: {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'client_credentials'
    }
  });
  return response.access_token;
};

export default getToken;
