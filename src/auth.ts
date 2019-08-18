/* eslint-disable consistent-return */
import { Request, Response, NextFunction } from 'express'; // eslint-disable-line no-unused-vars
import passport from 'passport';
import { Strategy as SamlStrategy } from 'passport-saml';
import { Strategy as OAuthStrategy } from 'passport-oauth2';
import DevStrategy from 'passport-dev';
import config from 'config';
import User from './api/models/user'; // eslint-disable-line no-unused-vars
import { getOAuthToken } from './api/modules/canvas';

interface Auth {
  passportStrategy?: any;
  oAuth2Strategy?: any;
  serializeUser?(user: any, done: any): void;
  deserializeUser?(user: any, done: any): void;
  login?(req: Request, res: Response, next: NextFunction): void;
  logout?(req: Request, res: Response): void;
  ensureAuthenticated?(req: Request, res: Response, next: NextFunction): void;
  ensureAdmin?(req: Request, res: Response, next: NextFunction): void;
  hasValidCanvasRefreshToken?(req: Request, res: Response, next: NextFunction): void;
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
    authorizationURL: config.get('canvasOauth.authUrl'),
    tokenURL: config.get('canvasOauth.tokenUrl'),
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

Auth.serializeUser = (user, done) => {
  done(null, user);
};

Auth.deserializeUser = (user, done) => {
  done(null, user);
};

Auth.login = (req: Request, res: Response, next: NextFunction) => {
  return passport.authenticate('saml', (err, user) => {
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
      res.redirect('/');
    });
  })(req, res, next);
};

Auth.logout = (req: Request, res: Response) => {
  try {
    if (!req.user) res.redirect('/');
    req.session.destroy(err => console.error(`Failed to destroy the session: ${err}`)); // eslint-disable-line no-console
    req.logout();
    if (ENV === 'production') {
      const strategy: SamlStrategy = Auth.passportStrategy;
      strategy.logout(req, (err, uri) => {
        return res.redirect(uri);
      });
    } else {
      res.redirect('/');
    }
  } catch (err) {
    console.error(`Auth.logout error: ${err}`); // eslint-disable-line no-console
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
  if (!user.isCanvasOptIn || !user.refreshToken) {
    console.debug('Canvas opt-in or refresh token missing, returning unauthorized', user); // eslint-disable-line no-console
  } else {
    if (!user.canvasOauthExpire || Math.floor(Date.now() / 1000) >= user.canvasOauthExpire) {
      console.debug('Canvas oauth token expired, refreshing.', user); // eslint-disable-line no-console
      await getOAuthToken(user);
    }
    return next();
  }
  return res.status(401).send('User must opt-in to Canvas login');
};

export default Auth;
