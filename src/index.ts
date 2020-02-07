/* eslint-disable no-console */
import express, { Application, Request, Response, NextFunction } from 'express'; // eslint-disable-line no-unused-vars
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import session from 'express-session';
import redis from 'connect-redis';
import { isNullOrUndefined } from 'util';
import { APP_VERSION, ENV, REDIS_HOST, REDIS_PORT, SESSION_SECRET, USE_MOCKS } from './constants';
import Auth from './auth';
import { redirectReturnUrl, setSessionReturnUrl, setJWTSessionUser } from './utils/routing';
import logger, { expressLogger, sessionLogger } from './logger';
import ApiRouter from './api';
import { findOrUpsertUser, updateOAuthData } from './api/modules/user-account';
import { refreshOAuthToken, getOAuthToken } from './api/modules/canvas';
import User from './api/models/user'; // eslint-disable-line no-unused-vars

const RedisStore = redis(session);
// const ENV = config.get('env');

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
  secret: SESSION_SECRET,
  saveUninitialized: false,
  resave: false,
  rolling: true,
  cookie: {
    httpOnly: false,
    maxAge: 1000 * 60 * 60,
  },
};

console.log(`Server started with ENV=${ENV}, VERSION=${APP_VERSION}`);

if (['production', 'stage', 'development', 'localhost'].includes(ENV)) {
  sessionOptions.store = new RedisStore({
    host: REDIS_HOST,
    port: REDIS_PORT,
    logErrors: true,
  });
}

app.use(session(sessionOptions));

// Set JWT Session User prior to sessionLogger to add default logging
app.use(setJWTSessionUser);
app.use(setSessionReturnUrl);

app.use(sessionLogger);

// Configure Passport
app.use(passport.initialize());
app.use(passport.session());
passport.use(Auth.passportStrategy);
passport.use(Auth.oAuth2Strategy);
passport.use(Auth.localStrategy);
passport.use(Auth.jwtStrategy);
passport.serializeUser(Auth.serializeUser);
passport.deserializeUser(Auth.deserializeUser);

app.get('/login', Auth.login);
app.get('/logout', Auth.logout);

// Health Check (path configured in cloudformation template)
app.get('/healthcheck', (req, res) => {
  logger().debug('Health Check Request');
  res.send({
    version: APP_VERSION,
    useMocks: USE_MOCKS,
  });
});

app.post('/login/saml', passport.authenticate('saml'), async (req, res) => {
  const { user, isNew } = await findOrUpsertUser(req.user);
  if (isNew && user.isStudent()) {
    res.redirect('/canvas/login');
  } else if (user.isCanvasOptIn) {
    if (!isNullOrUndefined(user.refreshToken)) req.user.refreshToken = user.refreshToken;
    req.session.save((err) => {
      if (err) {
        logger().error(`/login/saml session failed: ${err.message}`);
      }
      res.redirect('/canvas/refresh');
    });
  } else {
    logger().debug(`/login/saml redirecting to: ${req.session.returnUrl}`);
    redirectReturnUrl(req, res, user);
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
      logger().debug(`/canvas/auth error in OAuth redirecting to: ${req.session.returnUrl}`);
      req.session.save((err) => {
        if (err) {
          logger().error(`/canvas/auth error session failed: ${err.message}`);
        }
        redirectReturnUrl(req, res, req.user);
      });
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
    logger().debug(`/canvas/auth redirecting to: ${req.session.returnUrl}`);
    req.session.save((err) => {
      if (err) {
        logger().error(`/canvas/auth session failed: ${err.message}`);
      }
      redirectReturnUrl(req, res, req.user);
    });
  },
);
app.get('/canvas/refresh', Auth.ensureAuthenticated, async (req: Request, res: Response) => {
  const user = await refreshOAuthToken(req.user);
  req.user.canvasOauthToken = user.canvasOauthToken;
  req.user.canvasOauthExpire = user.canvasOauthExpire;
  req.user.isCanvasOptIn = user.isCanvasOptIn;
  req.user.refreshToken = user.refreshToken;
  logger().debug(`/canvas/refresh redirecting to: ${req.session.returnUrl}`);
  req.session.save((err) => {
    if (err) {
      logger().error(`/canvas/refresh session failed: ${err.message}`);
    }
    redirectReturnUrl(req, res, req.user);
  });
});

app.use('/api', ApiRouter);

// Start Server
// Don't capture code coverage for the following block
/* istanbul ignore next */
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`Server listening with PORT=${PORT}`);
  });
}

export default app;
