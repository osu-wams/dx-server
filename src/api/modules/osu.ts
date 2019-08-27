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

interface AcademicStatus {
  id: string;
  attributes: {
    academicStanding: string | undefined;
    term: string;
    gpa: [{ creditHoursAttempted: number }];
  };
}
interface AcademicStatusResponse {
  links: { self: string };
  data: AcademicStatus[];
}

export const getAcademicStatus = async (
  user: any,
  termQueryString: any
): Promise<{ academicStanding: string; term: string; creditHoursAttempted: number } | {}> => {
  try {
    const response: AcademicStatusResponse = await getJson(
      `${BASE_URL}/${user.masqueradeId || user.osuId}/academic-status${termQueryString}`
    );
    if (response.data) {
      // Sort the academic status data in descending order based on the id to get the most recent terms first.
      // * id format : <osuId>-<YYYYMM>
      const sorted = response.data.sort((a, b) => {
        if (a.id > b.id) return -1;
        if (a.id < b.id) return 1;
        return 0;
      });
      const latestTerm = sorted[0];
      // Get the most recent term which has a valid academicStanding (at times the upcoming term will not include this)
      const latestTermWithStanding = sorted.find(a => a.attributes.academicStanding !== null);
      return {
        academicStanding: latestTermWithStanding.attributes.academicStanding,
        term: latestTerm.attributes.term,
        creditHoursAttempted: latestTerm.attributes.gpa[0].creditHoursAttempted
      };
    }
    return {};
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
