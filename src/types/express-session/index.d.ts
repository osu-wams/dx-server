import 'express-session';

declare module 'express-session' {
  interface SessionData {
    returnUrl: string;
    isMobile: boolean;
    isMasquerade?: boolean;
    mobileLogin: boolean;
    passport: any;
    jwtAuth: boolean;
  }
}
