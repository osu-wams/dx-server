/* eslint-disable consistent-return */
import { Request, Response, NextFunction } from 'express'; // eslint-disable-line no-unused-vars
import passport from 'passport';
import { Strategy as SamlStrategy } from 'passport-saml';
import { Strategy as OAuthStrategy } from 'passport-oauth2';
import { Strategy as LocalStrategy } from 'passport-local';
import DevStrategy from 'passport-dev';
import config from 'config';
import User from './api/models/user'; // eslint-disable-line no-unused-vars
import { getOAuthToken } from './api/modules/canvas';
import logger from './logger';
import { returnUrl } from './utils/routing';

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
  hasValidCanvasRefreshToken?(req: Request, res: Response, next: NextFunction): void;
}

interface ApiKey {
  key: string;
  isAdmin: boolean;
}

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

function parseSamlResult(profile: any, done: any) {
  const user = {
    osuId: parseInt(profile['urn:oid:1.3.6.1.4.1.5016.2.1.2.1'], 10),
    email: profile['urn:oid:1.3.6.1.4.1.5923.1.1.1.6'],
    nameID: profile.nameID,
    nameIDFormat: profile.nameIDFormat,
    firstName: profile['urn:oid:2.5.4.42'],
    lastName: profile['urn:oid:2.5.4.4'],
    isAdmin: false
  };

  const permissions = profile['urn:oid:1.3.6.1.4.1.5923.1.1.1.7'] || [];
  if (permissions.includes('urn:mace:oregonstate.edu:entitlement:dx:dx-admin')) {
    user.isAdmin = true;
  }

  return done(null, user);
}

if (ENV === 'production') {
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
      signatureAlgorithm: 'sha256'
    },
    parseSamlResult
  );
} else {
  // Configure Dev Strategy
  Auth.passportStrategy = new DevStrategy('saml', {
    email: 'fake-email@oregonstate.edu',
    firstName: 'Test',
    lastName: 'User',
    permissions: ['urn:mace:oregonstate.edu:entitlement:dx:dx-admin'],
    osuId: 111111111,
    isAdmin: true
  });
}

Auth.oAuth2Strategy = new OAuthStrategy(
  {
    authorizationURL: `${config.get('canvasOauth.baseUrl')}${config.get('canvasOauth.authUrl')}`,
    tokenURL: `${config.get('canvasOauth.baseUrl')}${config.get('canvasOauth.tokenUrl')}`,
    clientID: config.get('canvasOauth.id'),
    clientSecret: config.get('canvasOauth.secret'),
    callbackURL: config.get('canvasOauth.callbackUrl')
  },
  (accessToken: string, refreshToken: string, params: any, profile: any, done) => {
    const user = {
      userId: params.user.id,
      fullName: params.user.name,
      accessToken,
      refreshToken,
      expireTime: Math.floor(Date.now() / 1000) + parseInt(params.expires_in, 10)
    };
    done(null, user);
  }
);

Auth.localStrategy = new LocalStrategy(
  {
    usernameField: 'osuId',
    passwordField: 'key'
  },
  async (osuId, key, done) => {
    // verify the username is a valid user, and the password is the API key
    logger.debug(`API key authentication attempted with osuId:${osuId} and key:${key}`);
    const apiKey = apiKeys.filter(k => k.key !== '').find(k => k.key === key);
    if (apiKey) {
      logger.debug(`API key found: ${apiKey}`);
      const user = await User.find(parseInt(osuId, 10));
      if (!user) logger.debug('API user not found, returning unauthenticated.');
      if (!user) return done(null, false);

      user.isAdmin = apiKey.isAdmin;
      return done(null, user);
    }
    return done(null, false);
  }
);

Auth.serializeUser = (user, done) => {
  done(null, user);
};

Auth.deserializeUser = (user, done) => {
  done(null, user);
};

Auth.login = (req: Request, res: Response, next: NextFunction) => {
  if (req.query) {
    if (req.query.returnTo) req.session.returnUrl = req.query.returnTo;
  }

  return passport.authenticate(['local', 'saml'], (err, user) => {
    logger.debug(`User authenticated: ${user.osuId}`);
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(400).send({
        message: 'Bad username or password'
      });
    }

    req.login(user, (innerErr: any) => {
      if (innerErr) {
        return next(innerErr);
      }
      const returnTo = returnUrl(req);
      logger.debug(`Auth.login redirecting to: ${returnTo}`);
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
        req.session.destroy(error => logger.error(error));
        req.logout();
        return res.redirect(uri);
      });
    } else {
      req.session.destroy(error => logger.error(error));
      req.logout();
      res.redirect('/');
    }
  } catch (err) {
    logger.error(`Auth.logout error: ${err}`);
  }
};

Auth.ensureAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }

  res.status(401).send('Unauthorized');
};

Auth.ensureAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated() && req.user.isAdmin) {
    return next();
  }

  return res.status(401).send('Unauthorized');
};

/**
 * If users canvasOauthExpire isn't set or is a unix date less than or equal to right now,
 * then get a new token. If the user isn't opt-in or somehow hasn't gotten thier refreshToken
 * then disallow access to the route protected by this middleware.
 */
Auth.hasValidCanvasRefreshToken = async (req: Request, res: Response, next: NextFunction) => {
  const user: User = req.user; // eslint-disable-line prefer-destructuring
  if (user.isCanvasOptIn && user.refreshToken) {
    if (!user.canvasOauthExpire || Math.floor(Date.now() / 1000) >= user.canvasOauthExpire) {
      logger.debug('Auth.hasValidCanvasRefreshToken oauth token expired, refreshing.', user);
      const updatedUser = await getOAuthToken(user);
      req.session.passport.user.canvasOauthToken = updatedUser.canvasOauthToken;
      req.session.passport.user.canvasOauthExpire = updatedUser.canvasOauthExpire;
    }
    return next();
  }
  logger.debug(
    'Auth.hasValidCanvasRefreshToken opt-in or refresh token missing, returning unauthorized',
    user
  );
  // Return 403 so the front-end knows to react to the change in users canvas opt-in
  return res.status(403).send('User must opt-in to Canvas login');
};

export default Auth;
