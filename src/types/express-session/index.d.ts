import 'express-session';

declare module 'express-session' {
  // eslint-disable-next-line no-unused-vars
  interface SessionData {
    returnUrl: string;
    isMobile: boolean;
    isMasquerade?: boolean;
    mobileLogin: boolean;
    passport: any;
    jwtAuth: boolean;
  }
}
