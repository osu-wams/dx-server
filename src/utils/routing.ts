import { Request, Response, NextFunction } from 'express'; // eslint-disable-line no-unused-vars
import logger from '../logger';

const appRegex = RegExp(/^https?:\/\/[\w*.]?my\.oregonstate\.edu\/*/);
export const isMobileRedirect = (uri: string): boolean => uri?.startsWith('osu-dx://');
export const isAppUrl = (url: string = ''): boolean => appRegex.test(url) || url?.startsWith('/');

export const handleReturnRequest = (req: Request, res: Response, next: NextFunction) => {
  const { returnTo, redirectUri } = req.query;

  let url = '/';
  if (isAppUrl(returnTo)) url = returnTo;
  if (isMobileRedirect(redirectUri)) url = redirectUri;
  logger().debug(
    `handleReturnRequest with query:${JSON.stringify(
      req.query,
    )}, setting session return url:${url}`,
  );
  req.session.returnUrl = url;

  return next();
};

export default handleReturnRequest;
