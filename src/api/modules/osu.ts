import { Types } from '@osu-wams/lib'; // eslint-disable-line no-unused-vars
import { getToken, fetchData } from '../util';
import cache from './cache';
import {
  mockedAddresses,
  mockedMealPlans,
  mockedMedical,
  mockedPersons,
  mockedGpa,
  mockedAcademicStatus,
  mockedClassification,
  mockedClassSchedule,
  mockedGrades,
  mockedEmails,
  mockedPhones,
  mockedHolds,
  mockedAccountTransactions,
  mockedAccountBalance,
  mockedDegrees,
  mockedDirectory,
  mockedLocations,
} from '../../mocks/osu';
import {
  OSU_API_BASE_URL,
  OSU_API_CACHE_SEC,
  OSU_ERROR_SEC_THRESH,
  OSU_ERROR_OCCUR_THRESH,
  OSU_API_LONG_CACHE_SEC,
} from '../../constants';
import { cacheFailureOrPing } from './notifications';
import logger from '../../logger';

const STUDENT_BASE_URL: string = `${OSU_API_BASE_URL}/v1/students`;
const PERSON_BASE_URL: string = `${OSU_API_BASE_URL}/v2/persons`;
const DIRECTORY_BASE_URL: string = `${OSU_API_BASE_URL}/v2/directory`;
const LOCATION_BASE_URL: string = `${OSU_API_BASE_URL}/v1/locations`;

const getJson = async (
  url: string,
  exceptionKey: string,
  ttlSeconds: number = OSU_API_CACHE_SEC,
) => {
  // TODO: Can we cache this for a period of time and reuse the token reliably?
  const bearerToken = await getToken();

  // * Cached API call will not use the token until the time it's called
  // * after the cache had expired.
  try {
    const response = await cache.get(
      url,
      {
        headers: { Authorization: `Bearer ${bearerToken}` },
        json: true,
      },
      true,
      {
        key: url,
        ttlSeconds,
      },
      [502],
    );
    return response;
  } catch (err) {
    await cacheFailureOrPing(err, exceptionKey, {
      timeThreshold: OSU_ERROR_SEC_THRESH,
      errThreshold: OSU_ERROR_OCCUR_THRESH,
    });
    throw err;
  }
};

export const getAddresses = async (user: any): Promise<Types.Address[]> => {
  const response: Types.AddressesResponse = await fetchData(
    undefined, // module handles its own failure notification
    () =>
      getJson(
        `${PERSON_BASE_URL}/${user.masqueradeId || user.osuId}/addresses`,
        `ALERTS-${PERSON_BASE_URL}/addresses`,
      ),
    mockedAddresses,
  );
  return response.data;
};

export const getMealPlan = async (user: any): Promise<Types.MealPlan[]> => {
  const response: Types.MealPlansResponse = await fetchData(
    undefined, // module handles its own failure notification
    () =>
      getJson(
        `${PERSON_BASE_URL}/${user.masqueradeId || user.osuId}/meal-plans`,
        `ALERTS-${PERSON_BASE_URL}/meal-plans`,
      ),
    mockedMealPlans,
  );
  return response.data;
};

export const getProfile = async (user: any): Promise<Types.Persons> => {
  const response: Types.PersonsResponse = await fetchData(
    undefined, // module handles its own failure notification
    () =>
      getJson(
        `${PERSON_BASE_URL}/${user.masqueradeId || user.osuId}`,
        `ALERTS-${PERSON_BASE_URL}/`,
      ),
    mockedPersons,
  );
  return response.data;
};

export const getEmails = async (user: any): Promise<Types.Email[]> => {
  return fetchData(
    undefined, // module handles its own failure notification
    () =>
      getJson(
        `${PERSON_BASE_URL}/${user.masqueradeId || user.osuId}/emails`,
        `ALERTS-${PERSON_BASE_URL}/emails`,
      ),
    mockedEmails,
  ).then((e) => e.data);
};

export const getPhones = async (user: any): Promise<Types.Phone[]> => {
  return fetchData(
    undefined, // module handles its own failure notification
    () =>
      getJson(
        `${PERSON_BASE_URL}/${user.masqueradeId || user.osuId}/phones`,
        `ALERTS-${PERSON_BASE_URL}/phones`,
      ),
    mockedPhones,
  ).then((e) => e.data);
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
  const response: AcademicStatusResponse = await fetchData(
    undefined, // module handles its own failure notification
    () =>
      getJson(
        `${STUDENT_BASE_URL}/${user.masqueradeId || user.osuId}/academic-status${termQueryString}`,
        `ALERTS-${STUDENT_BASE_URL}/academic-status`,
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
    // Get the most recent term which has a valid academicStanding (at times the upcoming term will not include this,
    // in which case the academic standing isn't returned and falls through to the empty object return)
    const latestTermWithStanding = sorted.find((a) => a.attributes.academicStanding !== null);
    if (latestTermWithStanding) {
      return {
        academicStanding: latestTermWithStanding.attributes.academicStanding,
        term: latestTerm.attributes.term,
      };
    }
  }
  return {};
};

export const getAccountBalance = async (user: any) => {
  return fetchData(
    undefined, // module handles its own failure notification
    () =>
      getJson(
        `${STUDENT_BASE_URL}/${user.masqueradeId || user.osuId}/account-balance`,
        `ALERTS-${STUDENT_BASE_URL}/account-balance`,
      ),
    mockedAccountBalance,
  );
};

export const getAccountTransactions = async (user: any) => {
  return fetchData(
    undefined, // module handles its own failure notification
    () =>
      getJson(
        `${STUDENT_BASE_URL}/${user.masqueradeId || user.osuId}/account-transactions?term=current`,
        `ALERTS-${STUDENT_BASE_URL}/account-transactions?term=current`,
      ),
    mockedAccountTransactions,
  );
};

export const getClassSchedule = async (
  user: any,
  term: any,
): Promise<{ data: Types.CourseSchedule[] }> => {
  const response: Types.CourseScheduleResponse = await fetchData(
    undefined, // module handles its own failure notification
    () =>
      getJson(
        `${STUDENT_BASE_URL}/${user.masqueradeId || user.osuId}/class-schedule${term ? `?term=${term}` : ''}`,
        `ALERTS-${STUDENT_BASE_URL}/class-schedule`,
      ),
    mockedClassSchedule,
  );
  return {
    data: response.data.map((d: Types.CourseSchedule) => ({
      attributes: {
        ...d.attributes,
        faculty: d.attributes.faculty.map((f) => ({
          osuId: f.osuId,
          email: f.email,
          name: f.name,
          primary: f.primary,
        })),
        courseSubjectNumber: `${d.attributes.courseSubject} ${d.attributes.courseNumber}`,
      },
      type: d.type,
      id: d.id,
      links: d.links,
    })),
  };
};

export const getClassification = async (user: any): Promise<Types.Classification> => {
  const response: Types.ClassificationResponse = await fetchData(
    undefined, // module handles its own failure notification
    () =>
      getJson(
        `${STUDENT_BASE_URL}/${user.masqueradeId || user.osuId}/classification`,
        `ALERTS-${STUDENT_BASE_URL}/classification`,
      ),
    mockedClassification,
  );
  return response.data;
};

export const getGrades = async (user: any, term: any) => {
  let termParam = '';
  if (term) {
    termParam = `?term=${term}`;
  }
  const response = await fetchData(
    undefined, // module handles its own failure notification
    () =>
      getJson(
        `${STUDENT_BASE_URL}/${user.masqueradeId || user.osuId}/grades${termParam}`,
        `ALERTS-${STUDENT_BASE_URL}/grades`,
      ),
    mockedGrades,
  );
  if (!response.data) {
    return [];
  }
  return response.data.map((g) => ({
    ...g,
    attributes: {
      ...g.attributes,
      courseSubjectNumber: `${g.attributes.courseSubject} ${g.attributes.courseNumber}`,
    },
  }));
};

interface GpaResponse {
  links: { self: string };
  data: {
    attributes: {
      gpaLevels: Types.GpaLevel[];
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

export const getGpa = async (user: any): Promise<Types.GpaLevel[]> => {
  const response: GpaResponse = await fetchData(
    undefined, // module handles its own failure notification
    () =>
      getJson(
        `${STUDENT_BASE_URL}/${user.masqueradeId || user.osuId}/gpa`,
        `ALERTS-${STUDENT_BASE_URL}/gpa`,
      ),
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
      .reduce((p, c) => p.concat(c), [])
      .map((g) => ({ levelCode: g.levelCode, level: g.level, gpaType: g.gpaType, gpa: g.gpa }));
    return orderedGpaLevels;
  }
  return [];
};

interface Hold {
  toDate: string;
  fromDate: string;
  description: string;
  reason: string | null;
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
  const response: HoldsResponse = await fetchData(
    undefined, // module handles its own failure notification
    () =>
      getJson(
        `${STUDENT_BASE_URL}/${user.masqueradeId || user.osuId}/holds`,
        `ALERTS-${STUDENT_BASE_URL}/holds`,
      ),
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
    return currentHolds.map((h) => ({
      description: h.description,
      reason: h.reason,
      toDate: h.toDate,
      fromDate: h.fromDate,
    })) as [{ description: string; reason: string; toDate: string; fromDate: string }];
  }
  return [];
};

/**
 * Get the Degrees a user is on track on the given term
 * @param user
 * @param term
 */
export const getDegrees = async (user: any, term = 'current'): Promise<Types.Degree[]> => {
  let termParam = '';
  if (term) {
    termParam = `?term=${term}`;
  }
  return fetchData(
    undefined, // module handles its own failure notification
    () =>
      getJson(
        `${STUDENT_BASE_URL}/${user.masqueradeId || user.osuId}/degrees${termParam}`,
        `ALERTS-${STUDENT_BASE_URL}/degrees`,
      ),
    mockedDegrees,
  );
};

export const getDirectory = async (
  name: string,
): Promise<Partial<Types.Directory>[] | { error: { code: string; detail: string } }> => {
  try {
    const response: { data: { id?: string; attributes: Types.Directory }[] } = await fetchData(
      undefined, // module handles its own failure notification
      () =>
        getJson(
          `${DIRECTORY_BASE_URL}?page[size]=100&page[number]=1&filter[fullName][fuzzy]=${name}`,
          `ALERTS-${DIRECTORY_BASE_URL}?page[size]=100&page[number]=1&filter[fullName][fuzzy]=${name}`,
          OSU_API_LONG_CACHE_SEC,
        ),
      mockedDirectory,
    );

    return response.data
      .filter((d) => d.attributes.osuUid)
      .map((d) => ({
        id: d.id,
        firstName: d.attributes.firstName,
        lastName: d.attributes.lastName,
        department: d.attributes.department,
      }))
      .sort((a, b) => (a.lastName + a.firstName > b.lastName + b.firstName ? 1 : -1));
  } catch (err: any) {
    let errorMessage = err.response?.statusText;
    const body = err.response?.body;
    if (body) {
      let json: { errors: { code?: string; detail?: string }[] };
      try {
        json = JSON.parse(body);
      } catch {
        logger().error(`getDirectory handled error but could not parse response body: ${body}`);
      }
      if (json && json.errors.length) {
        const error = json.errors.find((e) => e.code === '1400');
        if (error) errorMessage = error.detail;
      } else {
        errorMessage = body;
      }
    }
    throw new Error(errorMessage);
  }
};

export const getLocations = async (location: string): Promise<Partial<Types.Location>[]> => {
  const response: { data: { id: string; attributes: Types.Location }[] } = await fetchData(
    undefined, // module handles its own failure notification
    () =>
      getJson(`${LOCATION_BASE_URL}?q=${encodeURIComponent(location)}`, `${LOCATION_BASE_URL}`, OSU_API_LONG_CACHE_SEC),
    mockedLocations,
  );
  return response.data
    .map(
      ({
        id,
        attributes: {
          name,
          website,
          thumbnails,
          description,
          descriptionHTML,
          address,
          city,
          state,
          zip,
          campus,
        },
      }) => ({
        id,
        name,
        link: website,
        image: thumbnails.length ? thumbnails[0] : null,
        description,
        descriptionHTML,
        address,
        city,
        state,
        zip,
        campus,
      }),
    )
    .filter((i) => i.link)
    .sort((a, b) => (a.name > b.name ? 1 : -1));
};

export const getMedical = async (user: any): Promise<Types.Medical[]> => {
  const response: {
    data: {
      id: string;
      attributes: { medicalType: { code: any; description: string }; codeDate?: string }; // code: any to cover any of the string codes (50+)
    }[];
  } = await fetchData(
    undefined, // module handles its own failure notification
    () =>
      getJson(
        `${PERSON_BASE_URL}/${user.masqueradeId || user.osuId}/medical`,
        `ALERTS-${PERSON_BASE_URL}/medical`,
      ),
    mockedMedical,
  );

  return response.data.map(
    ({
      id,
      attributes: {
        medicalType: { code, description },
        codeDate,
      },
    }) => ({
      id,
      code,
      description,
      codeDate,
    }),
  );
};
