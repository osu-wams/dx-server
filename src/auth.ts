/* eslint-disable consistent-return */
import { Request, Response, NextFunction } from 'express'; // eslint-disable-line no-unused-vars
import passport from 'passport';
import { Strategy as SamlStrategy } from 'passport-saml';
import { Strategy as OAuthStrategy } from 'passport-oauth2';
import { Strategy as LocalStrategy } from 'passport-local';
import DevStrategy from 'passport-dev';
import config from 'config';
import { isNullOrUndefined } from 'util';
import MockStrategy from './utils/mock-strategy';
import User, { GROUPS } from './api/models/user'; // eslint-disable-line no-unused-vars
import { refreshOAuthToken } from './api/modules/canvas';
import logger from './logger';
import { returnUrl } from './utils/routing';
import parseSamlResult from './utils/auth';

interface Auth {
  passportStrategy?: any;
  oAuth2Strategy?: any;
  localStrategy?: any;
  serializeUser?(user: any, done: any): void;
  deserializeUser?(user: any, done: any): void;
  login?(req: Request, res: Response, next: NextFunction): void;
  logout?(req: Request, res: Response): void;
  ensureAuthenticated?(req: Request, res: Response, next: NextFunction): void;
  ensureAdmin?(req: Request, res: Response, next: NextFunction): void;
  hasCanvasRefreshToken?(req: Request, res: Response, next: NextFunction): void;
}

interface ApiKey {
  key: string;
  isAdmin: boolean;
}

const CANVAS_OAUTH_BASE_URL: string = config.get('canvasOauth.baseUrl');
const CANVAS_OAUTH_TOKEN_URL: string = config.get('canvasOauth.tokenUrl');
const CANVAS_OAUTH_AUTH_URL: string = config.get('canvasOauth.authUrl');
const CANVAS_OAUTH_ID: string = config.get('canvasOauth.id');
const CANVAS_OAUTH_SECRET: string = config.get('canvasOauth.secret');
const CANVAS_OAUTH_CALLBACK_URL: string = config.get('canvasOauth.callbackUrl');
const CANVAS_OAUTH_SCOPE: string = config.get('canvasOauth.scope');
const canvasOAuthConfig = () => {
  const c = {
    authorizationURL: `${CANVAS_OAUTH_BASE_URL}${CANVAS_OAUTH_AUTH_URL}`,
    tokenURL: `${CANVAS_OAUTH_BASE_URL}${CANVAS_OAUTH_TOKEN_URL}`,
    clientID: CANVAS_OAUTH_ID,
    clientSecret: CANVAS_OAUTH_SECRET,
    callbackURL: CANVAS_OAUTH_CALLBACK_URL,
    scope: undefined,
  };
  if (CANVAS_OAUTH_SCOPE !== '') {
    c.scope = CANVAS_OAUTH_SCOPE;
  }
  return c;
};

const Auth: Auth = {};

const ENV: string = config.get('env');
const SAML_CERT: string = config.get('saml.cert');
const SAML_CALLBACK_URL: string = config.get('saml.callbackUrl');
const SAML_LOGOUT_CALLBACK_URL: string = config.get('saml.logoutCallbackUrl');
let SAML_PVK: string = config.get('saml.pvk');
// Need to replace the newlines pulled from environment variable with actual
// newlines, otherwise passport-saml breaks.
SAML_PVK = SAML_PVK.replace(/\\n/g, '\n');

// OSU SSO url (saml)
const samlUrl = 'https://login.oregonstate.edu/idp/profile/';
const samlLogout = `${samlUrl}Logout`;

const apiKeys: ApiKey[] = JSON.parse(config.get('apiKeys'));

switch (ENV) {
  case 'development':
  case 'stage':
  case 'production':
    Auth.passportStrategy = new SamlStrategy(
      {
        acceptedClockSkewMs: 500,
        disableRequestedAuthnContext: true,
        identifierFormat: 'urn:oasis:names:tc:SAML:2.0:nameid-format:transient',
        callbackUrl: SAML_CALLBACK_URL,
        logoutUrl: samlLogout,
        logoutCallbackUrl: SAML_LOGOUT_CALLBACK_URL,
        entryPoint: `${samlUrl}SAML2/Redirect/SSO`,
        issuer: 'https://my.oregonstate.edu',
        cert: SAML_CERT,
        privateCert: SAML_PVK,
        decryptionPvk: SAML_PVK,
        signatureAlgorithm: 'sha256',
      },
      parseSamlResult,
    );
    break;
  case 'localhost':
    // Configure Dev Strategy
    Auth.passportStrategy = new DevStrategy('saml', {
      email: 'fake-email@oregonstate.edu',
      firstName: 'Test',
      lastName: 'User',
      permissions: [GROUPS.admin, GROUPS.masquerade],
      osuId: 111111111,
      isAdmin: true,
      groups: Object.keys(GROUPS),
    });
    break;
  default:
    Auth.passportStrategy = new MockStrategy('saml');
    break;
}

Auth.oAuth2Strategy = new OAuthStrategy(canvasOAuthConfig(), (params: any, done) => {
  const user = {
    userId: params.user.id,
    fullName: params.user.name,
    expireTime: Math.floor(Date.now() / 1000) + parseInt(params.expires_in, 10),
  };
  done(null, user);
});

Auth.localStrategy = new LocalStrategy(
  {
    usernameField: 'osuId',
    passwordField: 'key',
  },
  async (osuId, key, done) => {
    // verify the username is a valid user, and the password is the API key
    logger().debug(`API key authentication attempted with osuId:${osuId} and key:${key}`);
    const apiKey = apiKeys.filter((k) => k.key !== '').find((k) => k.key === key);
    if (apiKey) {
      logger().debug(`API key found: ${apiKey}`);
      const user = await User.find(parseInt(osuId, 10));
      if (!user) {
        logger().debug('API user not found, returning unauthenticated.');
        return done(null, false);
      }

      user.isAdmin = apiKey.isAdmin;
      user.groups = [];
      if (user.isAdmin) {
        user.groups = Object.keys(GROUPS);
      }
      return done(null, user);
    }
    return done(null, false);
  },
);

Auth.serializeUser = (user, done) => {
  done(null, user);
};

Auth.deserializeUser = (user, done) => {
  done(null, user);
};

Auth.login = (req: Request, res: Response, next: NextFunction) => {
  if (req.query!.returnTo!) req.session.returnUrl = req.query.returnTo;

  return passport.authenticate(['local', 'saml'], (err, user) => {
    logger().debug(`User authenticated: ${user.osuId}`);
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(400).send({ message: 'Bad username or password' });
    }

    req.login(user, (innerErr: any) => {
      if (innerErr) {
        return next(innerErr);
      }
      const returnTo = returnUrl(req);
      logger().debug(`Auth.login redirecting to: ${returnTo}`);
      res.redirect(returnTo);
    });
  })(req, res, next);
};

Auth.logout = (req: Request, res: Response) => {
  try {
    if (!req.user) res.redirect('/');
    if (ENV === 'production') {
      const strategy: SamlStrategy = Auth.passportStrategy;
      strategy.logout(req, (err, uri) => {
        req.session.destroy((error) => logger().error(error));
        req.logout();
        res.redirect(uri);
      });
    } else {
      req.session.destroy((error) => logger().error(error));
      req.logout();
      res.redirect('/');
    }
  } catch (err) {
    logger().error(`Auth.logout error: ${err}`);
  }
};

Auth.ensureAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }

  return res.status(401).send({ message: 'Unauthorized' });
};

Auth.ensureAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated() && req.user.isAdmin) {
    return next();
  }

  return res.status(401).send({ message: 'Unauthorized' });
};

/**
 * If users canvasOauthExpire isn't set or is a unix date less than or equal to right now,
 * then get a new token. If the user isn't opt-in or somehow hasn't gotten thier refreshToken
 * then disallow access to the route protected by this middleware.
 */
Auth.hasCanvasRefreshToken = async (req: Request, res: Response, next: NextFunction) => {
  const user: User = req.user; // eslint-disable-line prefer-destructuring
  if (user.isCanvasOptIn && user.refreshToken) {
    if (
      isNullOrUndefined(user.canvasOauthExpire) ||
      user.canvasOauthExpire === 0 ||
      Math.floor(Date.now() / 1000) >= user.canvasOauthExpire
    ) {
      logger().debug('Auth.hasCanvasRefreshToken oauth token expired, refreshing.', user);
      const updatedUser = await refreshOAuthToken(user);
      req.session.passport.user.canvasOauthToken = updatedUser.canvasOauthToken;
      req.session.passport.user.canvasOauthExpire = updatedUser.canvasOauthExpire;
      req.user.canvasOauthToken = updatedUser.canvasOauthToken;
      req.user.canvasOauthExpire = updatedUser.canvasOauthExpire;
    }
    return next();
  }
  logger().debug(
    'Auth.hasCanvasRefreshToken opt-in or refresh token missing, returning unauthorized',
  );
  // Return 403 so the front-end knows to react to the change in users canvas opt-in
  return res.status(403).send({ message: 'User must opt-in to Canvas login' });
};

export default Auth;
