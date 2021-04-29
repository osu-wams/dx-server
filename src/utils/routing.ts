import { Request, Response, NextFunction } from 'express'; // eslint-disable-line no-unused-vars
import logger from '../logger';
import { APP_URL_REGEX, ENCRYPTION_KEY, JWT_KEY } from '../constants';
import { decrypt, userFromJWT, issueRefresh, verifiedJwt } from './auth';
import { User } from '../api/models/user';

// Detect if the uri is using a dx-mobile redirect scheme
export const isMobileRedirect = (uri: any): boolean =>
  uri?.startsWith('osu-dx://') || uri?.startsWith('exp://');

// Detect if the url is relative or looks like a dx web url
export const isAppUrl = (url: any = ''): boolean => APP_URL_REGEX.test(url) || url?.startsWith('/');

/**
 * Express middleware to set the session returnUrl provided either by the web application (returnTo) or
 * the mobile native app during login (redirectUri)
 * @param req the Express Request
 * @param res the Express Response
 * @param next the Express middleware next function
 */

export const setSessionReturnUrl = (req: Request, res: Response, next: NextFunction) => {
  const { redirectUri } = req.query;
  const returnTo = req.query.return as string;
  let url = req.session.returnUrl || '/';
  if (isAppUrl(returnTo)) url = returnTo;
  if (isMobileRedirect(redirectUri)) {
    url = redirectUri as string;
    req.session.mobileLogin = true;
  }
  if (url !== '/') {
    logger().debug(
      `setSessionReturnUrl with query:${JSON.stringify(
        req.query,
      )}, setting session return url:${url}`,
    );
  }

  req.session.returnUrl = url;

  return next();
};

/**
 * Express middleware to validate the JWT provided has the required scope
 */
export const hasToken = (requiredScope: string) => (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.session.jwtAuth) return next();
  const { authorization } = req.headers;
  if (authorization) {
    const jwt = decrypt(authorization, ENCRYPTION_KEY);
    const { scope } = verifiedJwt(jwt, JWT_KEY);
    if (scope === requiredScope) {
      return next();
    }
    logger().error(`hasToken(${requiredScope}) scope failed for request`);
    return res.status(500).send({ error: 'Invalid token scope to access endpoint.' });
  }
  logger().error(
    `hasToken(${requiredScope}) missing authorization header on a jwtAuth session, this is a serious problem. jwtAuth shouldn't be detected without an Authorization header.`,
  );
  return res.status(500).send({ error: 'Missing authorization header.' });
};

/**
 * Express middleware to set the session user if it's been provided by a valid jwt in the authorization header
 * @param req the Express Request
 * @param res the Express Response
 * @param next the Express middleware next function
 */
export const setJWTSessionUser = async (req: Request, res: Response, next: NextFunction) => {
  const { authorization } = req.headers;
  if (authorization && !req.user) {
    const jwt = decrypt(authorization, ENCRYPTION_KEY);
    const user = await userFromJWT(jwt, JWT_KEY);
    if (user) {
      logger().debug(`setJWTSessionUser set user ${user.email} from a valid JWT`);
      req.session.jwtAuth = true;
      req.user = user;
    } else {
      return res.status(500).send({ error: 'Invalid token, unable to identify user.' });
    }
  }
  return next();
};

/**
 * Conditionally set the redirect to include a new jwt refresh token for mobile login flow, otherwise a regular redirect
 * @param req the Express Request
 * @param res the Express Response
 * @param user the User data
 */
export const redirectReturnUrl = async (req: Request, res: Response, user: User) => {
  if (req.session.mobileLogin) {
    logger().debug(`mobileLogin: ${req.session.mobileLogin}, issue new JWT refresh token to user`);
    const token = await issueRefresh(user, ENCRYPTION_KEY, JWT_KEY);
    res.redirect(`${req.session.returnUrl}?token=${token}`);
  } else {
    logger().debug(`redirecting to ${req.session.returnUrl}`);
    res.redirect(req.session.returnUrl);
  }
};
