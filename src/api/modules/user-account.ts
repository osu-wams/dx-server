import User from '../models/user'; // eslint-disable-line no-unused-vars

export interface SamlUser {
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
    let user: User = await User.find(u.osuId);
    let isNew = false;

    if (user === null) {
      user = await User.insert(u);
      isNew = true;
    }
    user.isAdmin = u.isAdmin;
    console.debug('findOrCreateUser returns:', user); // eslint-disable-line no-console
    return { user, isNew };
  } catch (err) {
    console.error('findOrCreateUser db failed:', err); // eslint-disable-line no-console
    throw err;
  }
};

export const updateOAuthData = async (u: User, oAuthData: OAuthData): Promise<User> => {
  try {
    const user = await User.updateCanvasData(
      u,
      oAuthData.account.refreshToken,
      oAuthData.isCanvasOptIn
    );
    console.debug('updateOAuthData returns:', user); // eslint-disable-line no-console
    return user;
  } catch (err) {
    console.error('updateOAuthData db failed:', err); // eslint-disable-line no-console
    throw err;
  }
};
