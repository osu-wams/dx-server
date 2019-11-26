/* eslint-disable no-console */
import express, { Application, Request, Response, NextFunction } from 'express'; // eslint-disable-line no-unused-vars
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import session from 'express-session';
import redis from 'connect-redis';
import config from 'config';
import Auth from './auth';
import logger, { expressLogger } from './logger';
import ApiRouter from './api';
import { findOrCreateUser, updateOAuthData } from './api/modules/user-account';
import { getRefreshToken, getOAuthToken } from './api/modules/canvas';
import { returnUrl } from './utils/routing';
import User from './api/models/user'; // eslint-disable-line no-unused-vars

const appVersion = config.get('appVersion');

const RedisStore = redis(session);
// const ENV = config.get('env');

const setUserSession = (user: User, req) => {
  req.session.passport.user = {
    osuId: user.osuId,
    email: user.email,
    nameID: user.nameID,
    nameIDFormat: user.nameIDFormat,
    firstName: user.firstName,
    lastName: user.lastName,
    isAdmin: user.isAdmin,
    canvasOauthToken: user.canvasOauthToken,
    canvasOauthExpire: user.canvasOauthExpire,
    isCanvasOptIn: user.isCanvasOptIn,
    refreshToken: user.refreshToken,
  };
};

// App Configuration
const app: Application = express();
app.use(expressLogger);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

interface SessionOptions {
  name: string;
  secret: string;
  saveUninitialized: boolean;
  resave: boolean;
  rolling: boolean;
  cookie: {
    httpOnly: boolean;
    maxAge: number;
  };
  store?: redis.RedisStore;
}
// Configure Sessions
const sessionOptions: SessionOptions = {
  name: 'dx',
  // NOTE: Session secret should be set via environment variable
  //       during deploy. Do not use the default value in production.
  secret: process.env.SESSION_SECRET || 'dx',
  saveUninitialized: false,
  resave: false,
  rolling: true,
  cookie: {
    httpOnly: false,
    maxAge: 1000 * 60 * 60,
  },
};

logger.info(`Server started with ENV=${config.get('env')}, VERSION=${appVersion}`);

if (config.get('env') === 'production') {
  sessionOptions.store = new RedisStore({
    host: config.get('redis.host'),
    port: config.get('redis.port'),
    logErrors: true,
  });
}

app.use(session(sessionOptions));

// Configure Passport
app.use(passport.initialize());
app.use(passport.session());
passport.use(Auth.passportStrategy);
passport.use(Auth.oAuth2Strategy);
passport.use(Auth.localStrategy);
passport.serializeUser(Auth.serializeUser);
passport.deserializeUser(Auth.deserializeUser);

app.get('/login', Auth.login);
app.get('/logout', Auth.logout);

// Health Check (path configured in cloudformation template)
app.get('/healthcheck', (req, res) => {
  logger.debug('Health Check Request');
  res.send({
    version: appVersion,
  });
});

app.post('/login/saml', passport.authenticate('saml'), async (req, res) => {
  const { user, isNew } = await findOrCreateUser(req.user);
  setUserSession(user, req);
  if (isNew) {
    res.redirect('/canvas/login');
  } else if (user.isCanvasOptIn) {
    res.redirect('/canvas/refresh');
  } else {
    const returnTo = returnUrl(req);
    logger.debug(`/login/saml redirecting to: ${returnTo}`);
    res.redirect(returnTo);
  }
});

app.get('/logout/saml', (req, res) => {
  req.logout();
  res.redirect('/');
});

app.get('/canvas/login', passport.authorize('oauth2'));
app.get(
  '/canvas/auth',
  async (req: any, res: Response, next: NextFunction) => {
    if (req.query.error) {
      await updateOAuthData(req.user, { account: { refreshToken: null }, isCanvasOptIn: false });
      req.user.isCanvasOptIn = false;
      req.session.user = req.user;
      const returnTo = returnUrl(req);
      logger.debug(`/canvas/auth error in OAuth redirecting to: ${returnTo}`);
      res.redirect(returnTo);
    } else {
      next();
    }
  },
  async (req: any, res: Response) => {
    const {
      query: { code },
    } = req;
    const user = await getOAuthToken(req.user, code);
    req.user.canvasOauthToken = user.canvasOauthToken;
    req.user.canvasOauthExpire = user.canvasOauthExpire;
    req.user.isCanvasOptIn = user.isCanvasOptIn;
    req.user.refreshToken = user.refreshToken;
    setUserSession(user, req);
    const returnTo = returnUrl(req);
    logger.debug(`/canvas/auth redirecting to: ${returnTo}`);
    res.redirect(returnTo);
  },
);
app.get('/canvas/refresh', Auth.ensureAuthenticated, async (req: Request, res: Response) => {
  req.user = await getRefreshToken(req.user);
  const returnTo = returnUrl(req);
  logger.debug(`/canvas/refresh redirecting to: ${returnTo}`);
  res.redirect(returnTo);
});

app.use('/api', ApiRouter);

// Start Server
// Don't capture code coverage for the following block
/* istanbul ignore next */
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => logger.info(`Server listening with PORT=${PORT}`));
}

export default app;
