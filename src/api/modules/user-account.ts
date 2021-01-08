import { Types } from '@osu-wams/lib'; // eslint-disable-line no-unused-vars
import { COLLEGES } from '../../constants';
import { User, find, upsert, updateCanvasData } from '../models/user'; // eslint-disable-line no-unused-vars
import logger from '../../logger';

export interface SamlUser {
  osu_id: string; // eslint-disable-line camelcase
  first_name: string; // eslint-disable-line camelcase
  last_name: string; // eslint-disable-line camelcase
  email: string;
  phone: string;
  primaryAffiliation: string;
  affiliations: string[];
  groups: string[];
  onid: string;
  lastLogin: string;
}

interface FindOrUpsertUser {
  user: User;
  isNew: boolean;
}

interface Account {
  refreshToken: string;
}

interface OAuthData {
  account: Account;
  isCanvasOptIn: boolean;
}

/**
 * Check if the two arrays of strings match regardless of current order of values
 * @param a an array of strings to consider
 * @param b an array of strings to consider
 */
const arraysMatch = (a: string[], b: string[]) => {
  return a.length === b.length && a.sort().every((v, i) => v === b.sort()[i]);
};

export const findOrUpsertUser = async (u: Partial<User>): Promise<FindOrUpsertUser> => {
  try {
    let user: User = await find(u.osuId);
    let isNew = false;

    if (!user) {
      isNew = true;
      user = await upsert(u);
    } else if (
      user.email !== u.email ||
      user.firstName !== u.firstName ||
      user.lastName !== u.lastName ||
      user.primaryAffiliation !== u.primaryAffiliation ||
      user.onid !== u.onid ||
      user.lastLogin !== u.lastLogin ||
      (u.groups && !arraysMatch(user.groups ?? [], u.groups ?? [])) ||
      (u.affiliations && !arraysMatch(user.affiliations ?? [], u.affiliations ?? [])) ||
      (u.colleges && !arraysMatch(user.colleges ?? [], u.colleges ?? []))
    ) {
      user.email = u.email;
      user.firstName = u.firstName;
      user.lastName = u.lastName;
      user.primaryAffiliation = u.primaryAffiliation;
      user.affiliations = u.affiliations;
      user.groups = u.groups;
      user.colleges = u.colleges;
      user.onid = u.onid;
      user.lastLogin = u.lastLogin;
      user = await upsert(user);
    }

    user.isAdmin = u.isAdmin;
    user.groups = u.groups;
    user.colleges = u.colleges ?? user.colleges;
    logger().debug('user-account.findOrUpsertUser returned user.', user);
    return { user, isNew };
  } catch (err) {
    logger().error(`user-account.findOrUpsertUser db failed: ${err.message}`);
    throw err;
  }
};

export const updateOAuthData = async (u: Partial<User>, oAuthData: OAuthData): Promise<User> => {
  try {
    const user = await updateCanvasData(u, oAuthData.account.refreshToken, oAuthData.isCanvasOptIn);
    logger().silly('user-account.updateOAuthData returned user.', user);
    return user;
  } catch (err) {
    logger().error(`user-account.updateOAuthData db failed: ${err.message}`);
    throw err;
  }
};

export const setColleges = async (u: Partial<User>, degrees: Types.Degree[]): Promise<User> => {
  if (!degrees.length) return u as User;

  const colleges = degrees.map((d) => d.college);
  const dualDegrees = degrees.filter((d) => d.dualDegree).map((dd) => dd.dualDegree.college);
  colleges.push(...dualDegrees);
  // eslint-disable-next-line
  u.colleges = [...new Set(colleges)].map((name) => COLLEGES[name.toLowerCase()]).filter(Boolean);
  const { user } = await findOrUpsertUser(u);
  return user;
};
