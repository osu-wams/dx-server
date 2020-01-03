import User from '../models/user'; // eslint-disable-line no-unused-vars
import logger from '../../logger';

export interface SamlUser {
  osu_id: string; // eslint-disable-line camelcase
  first_name: string; // eslint-disable-line camelcase
  last_name: string; // eslint-disable-line camelcase
  email: string;
  phone: string;
  primaryAffiliation: string;
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

export const findOrUpsertUser = async (u: User): Promise<FindOrUpsertUser> => {
  try {
    let user: User = await User.find(u.osuId);
    let isNew = false;

    if (user === null) {
      isNew = true;
      user = await User.upsert(u);
    } else if (
      user.email !== u.email ||
      user.firstName !== u.firstName ||
      user.lastName !== u.lastName ||
      user.primaryAffiliation !== u.primaryAffiliation
    ) {
      user.email = u.email;
      user.firstName = u.firstName;
      user.lastName = u.lastName;
      user.primaryAffiliation = u.primaryAffiliation;
      user = await User.upsert(user);
    }

    user.isAdmin = u.isAdmin;
    user.groups = u.groups;
    logger().silly('user-account.findOrUpsertUser returned user.', user);
    return { user, isNew };
  } catch (err) {
    logger().error(`user-account.findOrUpsertUser db failed: ${err.message}`);
    throw err;
  }
};

export const updateOAuthData = async (u: User, oAuthData: OAuthData): Promise<User> => {
  try {
    const user = await User.updateCanvasData(
      u,
      oAuthData.account.refreshToken,
      oAuthData.isCanvasOptIn,
    );
    logger().silly('user-account.updateOAuthData returned user.', user);
    return user;
  } catch (err) {
    logger().error(`user-account.updateOAuthData db failed: ${err.message}`);
    throw err;
  }
};
