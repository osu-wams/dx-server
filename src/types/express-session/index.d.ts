import 'express-session';
import 'express';
import { User } from '../../api/models/user';

declare module 'express-session' {
  // eslint-disable-next-line no-unused-vars
  interface SessionData {
    returnUrl: string;
    isMobile: boolean;
    mobileLogin: boolean;
    passport: any;
    jwtAuth: boolean;
  }
}

declare module 'express' {
  // eslint-disable-next-line no-unused-vars
  interface Request {
    user: User;
  }
}
