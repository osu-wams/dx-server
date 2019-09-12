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
): Promise<{ academicStanding: string; term: string } | {}> => {
  try {
    const response: AcademicStatusResponse = await getJson(
      `${BASE_URL}/${user.masqueradeId || user.osuId}/academic-status${termQueryString}`
    );
    if (response.data.length > 0) {
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
        term: latestTerm.attributes.term
      };
    }
    return {};
  } catch (err) {
    throw err;
  }
};

export const getAccountBalance = async (user: any) => {
  try {
    return await getJson(`${BASE_URL}/${user.masqueradeId || user.osuId}/account-balance`);
  } catch (err) {
    throw err;
  }
};

export const getAccountTransactions = async (user: any) => {
  try {
    return await getJson(
      `${BASE_URL}/${user.masqueradeId || user.osuId}/account-transactions?term=current`
    );
  } catch (err) {
    throw err;
  }
};

export const getClassSchedule = async (user: any, term: any) => {
  try {
    return await getJson(
      `${BASE_URL}/${user.masqueradeId || user.osuId}/class-schedule?term=${term}`
    );
  } catch (err) {
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
    throw err;
  }
};

interface GpaLevel {
  gpa: string;
  gpaType: string;
}

interface GpaResponse {
  links: { self: string };
  data: {
    attributes: {
      gpaLevels: GpaLevel[];
    };
  };
}

export const getGpa = async (user: any): Promise<{ gpa: string } | {}> => {
  try {
    const response: GpaResponse = await getJson(
      `${BASE_URL}/${user.masqueradeId || user.osuId}/gpa`
    );
    if (response.data && response.data.attributes.gpaLevels.length > 0) {
      const { gpaLevels } = response.data.attributes;
      const overallGpaLevel = gpaLevels.find(g => g.gpaType.toLowerCase() === 'institution');
      if (overallGpaLevel.gpa) return { gpa: overallGpaLevel.gpa };
    }
    return {};
  } catch (err) {
    throw err;
  }
};

interface Hold {
  toDate: string;
  description: string;
  webDisplay: boolean;
}
interface HoldsResponse {
  links: { self: string };
  data: {
    attributes: {
      holds: Hold[];
    };
  };
}

export const getHolds = async (user: any): Promise<[{ description: string }] | []> => {
  try {
    const response: HoldsResponse = await getJson(
      `${BASE_URL}/${user.masqueradeId || user.osuId}/holds`
    );
    if (response.data && response.data.attributes.holds.length > 0) {
      const { holds } = response.data.attributes;
      const currentHolds = holds
        .filter(h => h.webDisplay)
        .filter(h => {
          const toDate = Date.parse(h.toDate);
          return toDate >= Date.now();
        });
      if (currentHolds.length === 0) return [];
      return currentHolds.map(h => ({ description: h.description })) as [{ description: string }];
    }
    return [];
  } catch (err) {
    throw err;
  }
};
