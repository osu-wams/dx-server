import { Pool } from 'promise-mysql'; // eslint-disable-line no-unused-vars
import { pool, dbQuery } from '../../db';
import User from '../models/user'; // eslint-disable-line no-unused-vars

export interface DbUser {
  osu_id: string; // eslint-disable-line camelcase
  first_name: string; // eslint-disable-line camelcase
  last_name: string; // eslint-disable-line camelcase
  email: string;
  phone: string;
}

interface FindOrCreateUser {
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

export const findOrCreateUser = async (u: User): Promise<FindOrCreateUser> => {
  try {
    const dbPool = await pool;
    let user: User = await User.find(u.osuId, dbPool);
    let isNew = false;

    if (user === null) {
      user = await User.insert(u, dbPool);
      isNew = true;
    } else {
      const oauthData = await dbPool.query(dbQuery.selectOAuthData, [u.osuId]);
      if (oauthData.length > 0) {
        user.refreshToken = oauthData[0].refresh_token || '';
        user.isCanvasOptIn = oauthData[0].opt_in !== 0 || false;
      }
    }
    user.isAdmin = u.isAdmin;
    console.debug('findOrCreateUser returns:', user); // eslint-disable-line no-console
    return { user, isNew };
  } catch (err) {
    console.error('findOrCreateUser db failed:', err); // eslint-disable-line no-console
    throw err;
  }
};

export const updateOAuthData = async (user: User, oAuthData: OAuthData): Promise<void> => {
  try {
    const dbPool = await pool;
    const result = await dbPool.query(dbQuery.updateOAuthData, [
      oAuthData.isCanvasOptIn,
      oAuthData.account.refreshToken,
      user.osuId
    ]);
    if (result.affectedRows > 0) {
      return;
    }
  } catch (err) {
    console.error('updateOAuthData db failed:', err); // eslint-disable-line no-console
    throw err;
  }
};
