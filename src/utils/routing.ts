import { Request, Response, NextFunction } from 'express'; // eslint-disable-line no-unused-vars
import logger from '../logger';
import { APP_URL_REGEX, ENCRYPTION_KEY, JWT_KEY } from '../constants';
import { decrypt, userFromJWT, issueJWT } from './auth';
import User from '../api/models/user'; // eslint-disable-line no-unused-vars

export const isMobileRedirect = (uri: string): boolean =>
  uri?.startsWith('osu-dx://') || uri?.startsWith('exp://');
export const isAppUrl = (url: string = ''): boolean =>
  APP_URL_REGEX.test(url) || url?.startsWith('/');

export const setSessionReturnUrl = (req: Request, res: Response, next: NextFunction) => {
  const { returnTo, redirectUri } = req.query;

  let url = req.session.returnUrl || '/';
  if (isAppUrl(returnTo)) url = returnTo;
  if (isMobileRedirect(redirectUri)) {
    url = redirectUri;
    req.session.mobileLogin = true;
  }
  logger().debug(
    `setSessionReturnUrl with query:${JSON.stringify(
      req.query,
    )}, setting session return url:${url}`,
  );
  req.session.returnUrl = url;

  return next();
};

export const setJWTSessionUser = (req: Request, res: Response, next: NextFunction) => {
  const { authorization } = req.headers;
  if (authorization) {
    const jwt = decrypt(authorization, ENCRYPTION_KEY, JWT_KEY);
    const user = userFromJWT(jwt, JWT_KEY);
    if (user) {
      req.session.jwtAuth = true;
      req.user = user;
    } else {
      return res.status(500).send({ error: 'Invalid token, unable identify user.' });
    }
  }
  return next();
};

export const redirectReturnUrl = (req: Request, res: Response, user: User) => {
  if (req.session.mobileLogin) {
    res.redirect(`${req.session.returnUrl}?token=${issueJWT(user, ENCRYPTION_KEY, JWT_KEY)}`);
  } else {
    res.redirect(req.session.returnUrl);
  }
};
