/* eslint-disable camelcase */
import request from 'node-fetch';
import config from 'config';
import logger from '../../logger';
import { fetchData } from '../util';
import mockedStudent from '../../mocks/ready-education/student.data';

export const BASE_URL: string = config.get('readyEducationApi.baseUrl');
export const AUTH_TOKEN: string = config.get('readyEducationApi.token');

interface ReadyEducationStudent {
  email: string;
  student_id: string;
  sis_id: string;
  lms_id: string;
}

const getRequest = async <T>(url: string): Promise<T> => {
  try {
    logger().debug(`Ready Education API GET request url:${url}`);
    const response = await request(url, {
      headers: { Authorization: AUTH_TOKEN },
    });
    if (response.ok) {
      const data = await response.json();
      return data;
    }
    throw Object({
      response: {
        statusCode: response.status,
        status: response.status,
        statusText: response.statusText,
      },
    });
  } catch (err) {
    logger().debug(`Ready Education API GET request url:${url} failed: ${err}`);
    throw err;
  }
};

/**
 * Get a user from Ready Educations API
 * * https://readyeducationpublicapi.docs.apiary.io/#reference/0/user/returns-students'-information
 */
export const getUser = async (user_token: string): Promise<ReadyEducationStudent> => {
  const url = `${BASE_URL}/public/v1/user/?user_token=${user_token}`;
  return fetchData(url, () => getRequest(url), mockedStudent);
};
