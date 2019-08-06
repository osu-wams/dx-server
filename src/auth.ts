/* eslint-disable consistent-return */
import { Request, Response, NextFunction } from 'express'; // eslint-disable-line no-unused-vars
import passport from 'passport';
import { Strategy as SamlStrategy } from 'passport-saml';
import DevStrategy from 'passport-dev';
import config from 'config';

interface Auth {
  passportStrategy?: any;
  serializeUser?(user: any, done: any): void;
  deserializeUser?(user: any, done: any): void;
  login?(req: Request, res: Response, next: NextFunction): void;
  logout?(req: Request, res: Response): void;
  ensureAuthenticated?(req: Request, res: Response, next: NextFunction): void;
  ensureAdmin?(req: Request, res: Response, next: NextFunction): void;
}

const Auth: Auth = {};

const ENV: string = config.get('env');
const SAML_CERT: string = config.get('saml.cert');
const SAML_CALLBACK_URL: string = config.get('saml.callbackUrl');
let SAML_PVK: string = config.get('saml.pvk');
// Need to replace the newlines pulled from environment variable with actual
// newlines, otherwise passport-saml breaks.
SAML_PVK = SAML_PVK.replace(/\\n/g, '\n');

// OSU SSO url (saml)
const samlUrl = 'https://login.oregonstate.edu/idp/profile/';
const samlLogout = `${samlUrl}Logout`;

function parseSamlResult(user: any, done: any) {
  const samlUser = {
    email: user['urn:oid:1.3.6.1.4.1.5923.1.1.1.6'],
    firstName: user['urn:oid:2.5.4.42'],
    lastName: user['urn:oid:2.5.4.4'],
    isAdmin: false
  };

  const permissions = user['urn:oid:1.3.6.1.4.1.5923.1.1.1.7'] || [];
  if (permissions.includes('urn:mace:oregonstate.edu:entitlement:dx:dx-admin')) {
    samlUser.isAdmin = true;
  }

  return done(null, samlUser);
}

if (ENV === 'production') {
  Auth.passportStrategy = new SamlStrategy(
    {
      acceptedClockSkewMs: 500,
      disableRequestedAuthnContext: true,
      identifierFormat: 'urn:oasis:names:tc:SAML:2.0:nameid-format:transient',
      callbackUrl: SAML_CALLBACK_URL,
      logoutUrl: samlLogout,
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
  req.logout();
  req.session.destroy(err => console.error(`Failed to destroy the session: ${err}`)); // eslint-disable-line no-console
  res.redirect(samlLogout);
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

export default Auth;
