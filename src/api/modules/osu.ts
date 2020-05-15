import config from 'config';
import { Types } from '@osu-wams/lib'; // eslint-disable-line no-unused-vars
import { getToken, fetchData } from '../util';
import cache from './cache';
import {
  mockedAddresses,
  mockedMealPlans,
  mockedPersons,
  mockedGpa,
  mockedAcademicStatus,
  mockedClassification,
  mockedClassSchedule,
  mockedGrades,
  mockedHolds,
  mockedAccountTransactions,
  mockedAccountBalance,
  mockedDegrees,
} from '../../mocks/osu';

const STUDENT_BASE_URL = `${config.get('osuApi.baseUrl')}/students`;
const PERSON_BASE_URL = `${config.get('osuApi.baseUrl')}/persons`;
const CACHE_SEC = parseInt(config.get('osuApi.cacheEndpointSec'), 10);

const getJson = async (url: string) => {
  // TODO: Can we cache this for a period of time and reuse the token reliably?
  const bearerToken = await getToken();

  // * Cached API call will not use the token until the time it's called
  // * after the cache had expired.
  const response = await cache.get(
    url,
    {
      auth: { bearer: bearerToken },
      json: true,
    },
    true,
    {
      key: url,
      ttlSeconds: CACHE_SEC,
    },
  );
  return response;
};

export const getAddresses = async (user: any): Promise<Types.Address[]> => {
  try {
    const response: Types.AddressesResponse = await fetchData(
      () => getJson(`${PERSON_BASE_URL}/${user.masqueradeId || user.osuId}/addresses`),
      mockedAddresses,
    );
    return response.data;
  } catch (err) {
    throw err;
  }
};

export const getMealPlan = async (user: any): Promise<Types.MealPlan[]> => {
  try {
    const response: Types.MealPlansResponse = await fetchData(
      () => getJson(`${PERSON_BASE_URL}/${user.masqueradeId || user.osuId}/meal-plans`),
      mockedMealPlans,
    );
    return response.data;
  } catch (err) {
    throw err;
  }
};

export const getProfile = async (user: any): Promise<Types.Profile> => {
  try {
    const response: Types.ProfileResponse = await fetchData(
      () => getJson(`${PERSON_BASE_URL}/${user.masqueradeId || user.osuId}`),
      mockedPersons,
    );
    return response.data;
  } catch (err) {
    throw err;
  }
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
  termQueryString: any,
): Promise<{ academicStanding: string; term: string } | {}> => {
  try {
    const response: AcademicStatusResponse = await fetchData(
      () =>
        getJson(
          `${STUDENT_BASE_URL}/${
            user.masqueradeId || user.osuId
          }/academic-status${termQueryString}`,
        ),
      mockedAcademicStatus,
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
      const latestTermWithStanding = sorted.find((a) => a.attributes.academicStanding !== null);
      return {
        academicStanding: latestTermWithStanding.attributes.academicStanding,
        term: latestTerm.attributes.term,
      };
    }
    return {};
  } catch (err) {
    throw err;
  }
};

export const getAccountBalance = async (user: any) => {
  try {
    return await fetchData(
      () => getJson(`${STUDENT_BASE_URL}/${user.masqueradeId || user.osuId}/account-balance`),
      mockedAccountBalance,
    );
  } catch (err) {
    throw err;
  }
};

export const getAccountTransactions = async (user: any) => {
  try {
    return await fetchData(
      () =>
        getJson(
          `${STUDENT_BASE_URL}/${
            user.masqueradeId || user.osuId
          }/account-transactions?term=current`,
        ),
      mockedAccountTransactions,
    );
  } catch (err) {
    throw err;
  }
};

export const getClassSchedule = async (
  user: any,
  term: any,
): Promise<{ data: Types.ClassSchedule[] }> => {
  try {
    const response: Types.ClassScheduleResponse = await fetchData(
      () =>
        getJson(
          `${STUDENT_BASE_URL}/${user.masqueradeId || user.osuId}/class-schedule?term=${term}`,
        ),
      mockedClassSchedule,
    );
    return {
      data: response.data.map((d: Types.ClassSchedule) => ({
        attributes: {
          ...d.attributes,
          faculty: d.attributes.faculty.map((f) => ({
            email: f.email,
            name: f.name,
            primary: f.primary,
          })),
        },
        type: d.type,
        id: d.id,
      })),
    };
  } catch (err) {
    throw err;
  }
};

export const getClassification = async (user: any): Promise<Types.Classification> => {
  try {
    const response: Types.ClassificationResponse = await fetchData(
      () => getJson(`${STUDENT_BASE_URL}/${user.masqueradeId || user.osuId}/classification`),
      mockedClassification,
    );
    return response.data;
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
    return await fetchData(
      () => getJson(`${STUDENT_BASE_URL}/${user.masqueradeId || user.osuId}/grades${termParam}`),
      mockedGrades,
    );
  } catch (err) {
    throw err;
  }
};

interface GpaLevel {
  gpa: string;
  gpaType: string;
  level: string;
  levelCode: string;
}

interface GpaResponse {
  links: { self: string };
  data: {
    attributes: {
      gpaLevels: GpaLevel[];
    };
  };
}

const gpaLevelCodesByPriority = [
  '03', // Postbac Degree Seeking
  '05', // Professional
  '02', // Graduate
  'D2', // E-Campus Graduate Course
  'CG', // Cascades Partner Grad Course
  '01', // Undergraduate
  'D1', // E-Campus Undergraduate Course
  'D3', // ECampus CCLP & Counseling PHD
  'CP', // Cascades Partner
  '06', // INTO OSU GE/AE/Pathways
  '04', // Non-Degree / Credential
  'D0', // E-Campus Overlay Course
  'DR', // E-Campus Intermediate Course
  '00', // Level Not Declared
  'CX', // Obsolete - Do not use
  'NC', // Non Credit
];

// The order of each GpaLevel by type for display.
const gpaTypeOrder = ['Institution', 'Overall', 'Transfer'];

export const getGpa = async (user: any): Promise<GpaLevel[]> => {
  try {
    const response: GpaResponse = await fetchData(
      () => getJson(`${STUDENT_BASE_URL}/${user.masqueradeId || user.osuId}/gpa`),
      mockedGpa,
    );
    if (response.data && response.data.attributes.gpaLevels.length > 0) {
      const { gpaLevels } = response.data.attributes;
      // Produce an array of GpaLevel data to match the order of the levels by priority, and then each to match the order
      // of the types. The orders of these levels are important as the client expects the first GpaLevel/Type to be
      // the "preferred" GPA to display while the remaining GpaLevel data might be used in a tabular display.
      const orderedGpaLevels = gpaLevelCodesByPriority
        .map((l) => {
          return gpaLevels
            .filter((g) => g.levelCode.toLowerCase() === l.toLowerCase())
            .sort((a, b) => gpaTypeOrder.indexOf(a.gpaType) - gpaTypeOrder.indexOf(b.gpaType));
        })
        .reduce((p, c) => p.concat(c))
        .map((g) => ({ levelCode: g.levelCode, level: g.level, gpaType: g.gpaType, gpa: g.gpa }));
      return orderedGpaLevels;
    }
    return [];
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
    const response: HoldsResponse = await fetchData(
      () => getJson(`${STUDENT_BASE_URL}/${user.masqueradeId || user.osuId}/holds`),
      mockedHolds,
    );
    if (response.data && response.data.attributes.holds.length > 0) {
      const { holds } = response.data.attributes;
      const currentHolds = holds
        .filter((h) => h.webDisplay)
        .filter((h) => {
          const toDate = Date.parse(h.toDate);
          return toDate >= Date.now();
        });
      if (currentHolds.length === 0) return [];
      return currentHolds.map((h) => ({ description: h.description })) as [{ description: string }];
    }
    return [];
  } catch (err) {
    throw err;
  }
};

/**
 * Get the Degrees a user is on track on the given term
 * @param user
 * @param term
 */
export const getDegrees = async (user: any, term = 'current'): Promise<Types.Degree[]> => {
  try {
    let termParam = '';
    if (term) {
      termParam = `?term=${term}`;
    }
    return await fetchData(
      () => getJson(`${STUDENT_BASE_URL}/${user.masqueradeId || user.osuId}/degrees${termParam}`),
      mockedDegrees,
    );
  } catch (err) {
    throw err;
  }
};
