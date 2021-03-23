/* eslint-disable consistent-return */
import { Request, Response, NextFunction } from 'express'; // eslint-disable-line no-unused-vars
import passport from 'passport';
import { Strategy as SamlStrategy } from 'passport-saml';
import { Strategy as OAuthStrategy } from 'passport-oauth2';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy, VerifiedCallback } from 'passport-jwt'; // eslint-disable-line no-unused-vars
import DevStrategy from 'passport-dev';
import MockStrategy from './utils/mock-strategy';
import { User, find } from './api/models/user'; // eslint-disable-line no-unused-vars
import { refreshOAuthToken } from './api/modules/canvas';
import logger from './logger';
import parseSamlResult, { decrypt } from './utils/auth';
import {
  API_KEYS,
  CANVAS_OAUTH_BASE_URL,
  CANVAS_OAUTH_TOKEN_URL,
  CANVAS_OAUTH_AUTH_URL,
  CANVAS_OAUTH_ID,
  CANVAS_OAUTH_SECRET,
  CANVAS_OAUTH_CALLBACK_URL,
  CANVAS_OAUTH_SCOPE,
  ENCRYPTION_KEY,
  ENV,
  GROUPS,
  JWT_KEY,
  SAML_CALLBACK_URL,
  SAML_CERT,
  SAML_LOGOUT,
  SAML_LOGOUT_CALLBACK_URL,
  SAML_PVK,
  SAML_URL,
  COOKIE_NAME,
} from './constants';
import { getUser } from './api/modules/ready-education';

/* eslint-disable no-unused-vars */
interface IAuth {
  passportStrategy?: any;
  oAuth2Strategy?: any;
  localStrategy?: any;
  jwtStrategy?: any;
  readyEducationStrategy?: any;
  serializeUser?(user: any, done: any): void;
  deserializeUser?(user: any, done: any): void;
  login?(req: Request, res: Response, next: NextFunction): void;
  logout?(req: Request, res: Response): void;
  ensureAuthenticated?(req: Request, res: Response, next: NextFunction): void;
  ensureAdmin?(req: Request, res: Response, next: NextFunction): void;
  hasCanvasRefreshToken?(req: Request, res: Response, next: NextFunction): void;
}
/* eslint-enable */

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

const Auth: IAuth = {};

switch (ENV) {
  case 'preview':
  case 'development':
  case 'stage':
  case 'production':
    Auth.passportStrategy = new SamlStrategy(
      {
        acceptedClockSkewMs: 500,
        disableRequestedAuthnContext: true,
        identifierFormat: 'urn:oasis:names:tc:SAML:2.0:nameid-format:transient',
        callbackUrl: SAML_CALLBACK_URL,
        logoutUrl: SAML_LOGOUT,
        logoutCallbackUrl: SAML_LOGOUT_CALLBACK_URL,
        entryPoint: `${SAML_URL}SAML2/Redirect/SSO`,
        issuer: 'https://my.oregonstate.edu',
        cert: SAML_CERT,
        privateKey: SAML_PVK.replace(/\\n/g, '\n'),
        decryptionPvk: SAML_PVK.replace(/\\n/g, '\n'),
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
      primaryAffiliation: 'employee',
      affiliations: ['member', 'employee'],
    });
    break;
  default:
    Auth.passportStrategy = new MockStrategy('saml');
    break;
}

Auth.jwtStrategy = new JwtStrategy(
  {
    secretOrKey: JWT_KEY,
    jwtFromRequest: (req) => {
      const decrypted = decrypt(req.headers.authorization, ENCRYPTION_KEY);
      return decrypted;
    },
  },
  (user: any, done: VerifiedCallback) => {
    return done(null, user);
  },
);

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
    const apiKey = API_KEYS.filter((k) => k.key !== '').find((k) => k.key === key);
    if (apiKey) {
      logger().debug(`API key found: ${apiKey}`);
      const user = await find(parseInt(osuId, 10));
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

Auth.readyEducationStrategy = new LocalStrategy(
  {
    usernameField: 'u',
    passwordField: 't',
  },
  async (u, t, done) => {
    logger().debug(
      `User from mobile app with Ready Education auth user token:${t} with username: ${u}`,
    );
    if (!t) return done(null, false);

    const { student_id: osuId } = await getUser(t);
    if (osuId) {
      const user = await find(parseInt(osuId, 10));
      if (!user) {
        logger().debug('Ready Education auth user not found, returning unauthenticated.');
        return done(null, false);
      }
      return done(null, user);
    }
    return done(null, false);
  },
);
Auth.readyEducationStrategy.name = 'readyEducation';

Auth.serializeUser = (user, done) => {
  done(null, user);
};

Auth.deserializeUser = (user, done) => {
  done(null, user);
};

Auth.login = (req: Request, res: Response, next: NextFunction) => {
  // eslint-disable-next-line
  return passport.authenticate('readyEducation', (reaErr, reaUser) => {
    logger().debug(`Ready Education User authenticated: ${reaUser}`);
    if (reaErr) {
      logger().error(`Error during Ready Education User authentication: ${reaErr.message}`);
    }
    if (!reaUser) {
      passport.authenticate(['local', 'saml'], (err, user) => {
        logger().debug(`User authenticated: ${user.osuId}`);
        if (err) {
          next(err);
        }
        if (!user) {
          res.status(400).send({ message: 'Bad username or password' });
        } else {
          // eslint-disable-next-line
          req.login(user, (innerErr: any) => {
            if (innerErr) {
              return next(innerErr);
            }
            logger().debug(`Auth.login redirecting to: ${req.session.returnUrl}`);
            res.redirect(req.session.returnUrl);
          });
        }
      })(req, res, next);
    } else {
      // Explicitly identify this session as having been initiated through the mobile app auth flow
      req.session.isMobile = true;
      // eslint-disable-next-line
      req.login(reaUser, (innerErr: any) => {
        if (innerErr) {
          return next(innerErr);
        }
        req.session.cookie.maxAge = 1000 * 60 * 60 * 24 * 30; // 30 days in milliseconds
        // Provide the means for a Ready Education auth flow to include returnUrl=page_name
        // to direct the users browser to a specific page.
        const { returnUrl }: { returnUrl?: string } = req.query;
        logger().debug(`Auth.login Ready Education auth redirecting to: ${returnUrl || '/'}`);
        res.redirect(returnUrl || '/');
      });
    }
  })(req, res, next);
};

// eslint-disable-next-line
Auth.logout = (req: Request, res: Response) => {
  try {
    if (!req.user) return res.redirect('/');
    Auth.passportStrategy.logout(req, (err, uri) => {
      if (err) logger().error('Auth.passportStrategy.logout failed.', err);
      logger().info(`Auth.passportStrategy.logout redirect uri ${uri}`);
      req.session.destroy((sessionError) => {
        if (sessionError) {
          logger().error('Auth.passportStrategy.logout session destroy failed.', sessionError);
        }
        res.clearCookie(COOKIE_NAME);
        res.redirect(uri);
      });
    });
  } catch (err) {
    logger().error(`Auth.logout error: ${err}`);
  }
};

Auth.ensureAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  // TODO: Check if request is a JWT from mobile, set session to the user presented in the JWT
  if (req.isAuthenticated()) {
    return next();
  }

  return res.status(401).send({ message: 'Unauthorized' });
};

Auth.ensureAdmin = (req: Request, res: Response, next: NextFunction) => {
  // TODO: Check if request is a JWT from mobile, set session to the user presented in the JWT
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
  if (user.canvasOptIn && user.canvasRefreshToken) {
    if (!user.canvasOauthExpire || Math.floor(Date.now() / 1000) >= user.canvasOauthExpire) {
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
