import logger from '../logger';

export const returnUrl = (req: any) => {
  if (req.session.returnUrl) {
    logger().debug(`Found session returnUrl:${req.session.returnUrl}`);
    return req.session.returnUrl;
  }
  if (req.query!.returnTo!) {
    logger().debug(`Set session returnUrl:${req.query.returnTo}`);
    req.session.returnUrl = req.query.returnTo;
    return req.session.returnUrl;
  }
  return '/';
};

export default returnUrl;
