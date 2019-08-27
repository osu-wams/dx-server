import request from 'request-promise';
import config from 'config';
import { getToken } from '../util';

export const BASE_URL = `${config.get('osuApi.baseUrl')}/students`;

const getJson = async (url: string) => {
  const bearerToken = await getToken();
  const response = await request({
    method: 'GET',
    url,
    auth: { bearer: bearerToken },
    json: true
  });
  return response;
};

export const getAcademicStatus = async (user: any, term: any) => {
  try {
    return await getJson(
      `${BASE_URL}/${user.masqueradeId || user.osuId}/academic-status?term=${term}`
    );
  } catch (err) {
    console.error(err); // eslint-disable-line no-console
    throw err;
  }
};

export const getAccountBalance = async (user: any) => {
  try {
    return await getJson(`${BASE_URL}/${user.masqueradeId || user.osuId}/account-balance`);
  } catch (err) {
    console.error(err); // eslint-disable-line no-console
    throw err;
  }
};

export const getAccountTransactions = async (user: any) => {
  try {
    return await getJson(
      `${BASE_URL}/${user.masqueradeId || user.osuId}/account-transactions?term=current`
    );
  } catch (err) {
    console.error(err); // eslint-disable-line no-console
    throw err;
  }
};

export const getClassSchedule = async (user: any, term: any) => {
  try {
    return await getJson(
      `${BASE_URL}/${user.masqueradeId || user.osuId}/class-schedule?term=${term}`
    );
  } catch (err) {
    console.error(err); // eslint-disable-line no-console
    throw err;
  }
};

export const getGrades = async (user: any, term: any) => {
  try {
    let termParam = '';
    if (term) {
      termParam = `?term=${term}`;
    }
    return await getJson(`${BASE_URL}/${user.masqueradeId || user.osuId}/grades${termParam}`);
  } catch (err) {
    console.error(err); // eslint-disable-line no-console
    throw err;
  }
};

export const getGpa = async (user: any) => {
  try {
    return await getJson(`${BASE_URL}/${user.masqueradeId || user.osuId}/gpa`);
  } catch (err) {
    console.error(err); // eslint-disable-line no-console
    throw err;
  }
};

export const getHolds = async (user: any) => {
  try {
    return await getJson(`${BASE_URL}/${user.masqueradeId || user.osuId}/holds`);
  } catch (err) {
    console.error(err); // eslint-disable-line no-console
    throw err;
  }
};
