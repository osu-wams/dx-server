import { Request, Response, NextFunction } from 'express'; // eslint-disable-line no-unused-vars
import config from 'config';
import { GROUPS } from '../api/models/user'; // eslint-disable-line no-unused-vars
import logger from '../logger';

const ENV: string = config.get('env');
const appRegex = RegExp(/^https?:\/\/[\w*.]?my\.oregonstate\.edu\/*/);

export const isMobileRedirect = (uri: string): boolean => uri?.startsWith('osu-dx://');
export const isAppUrl = (url: string = ''): boolean => appRegex.test(url) || url?.startsWith('/');

const parseSamlResult = (profile: any, done: any) => {
  const user = {
    osuId: parseInt(profile['urn:oid:1.3.6.1.4.1.5016.2.1.2.1'], 10), // '123456789'
    email: profile['urn:oid:1.3.6.1.4.1.5923.1.1.1.6'], // 'nobody@nobody.nobody'
    primaryAffiliation: profile['urn:oid:1.3.6.1.4.1.5923.1.1.1.5'], // 'employee'
    nameID: profile.nameID,
    nameIDFormat: profile.nameIDFormat,
    firstName: profile['urn:oid:2.5.4.42'], // 'Bob'
    lastName: profile['urn:oid:2.5.4.4'], // 'Ross'
    groups: [],
    affiliations: profile['urn:oid:1.3.6.1.4.1.5923.1.1.1.1'], // ['member', 'employee']
    isAdmin: false,
  };

  const permissions = profile['urn:oid:1.3.6.1.4.1.5923.1.1.1.7'] || [];
  if (permissions.includes(GROUPS.admin)) {
    user.isAdmin = true;
    user.groups.push('admin');
  }
  if (permissions.includes(GROUPS.masquerade)) {
    // On production, only administrators can also have access to masquerade,
    // regardless of grouper group assignment.
    if (ENV === 'production') {
      if (user.isAdmin) user.groups.push('masquerade');
    } else {
      user.groups.push('masquerade');
    }
  }
  return done(null, user);
};

export const setLoginSession = (req: Request, res: Response, next: NextFunction) => {
  const { returnTo, redirectUri } = req.query;

  let url = '/';
  if (isAppUrl(returnTo)) url = returnTo;
  if (isMobileRedirect(redirectUri)) {
    url = redirectUri;
    req.session.mobileAuth = true;
  }
  logger().debug(
    `handleReturnRequest with query:${JSON.stringify(
      req.query,
    )}, setting session return url:${url}`,
  );
  req.session.returnUrl = url;

  return next();
};

export default parseSamlResult;
