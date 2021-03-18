import { User } from '../../api/models/user';

declare module 'express-serve-static-core' {
  // eslint-disable-next-line no-unused-vars
  interface Request {
    user: User & {
      masqueradeId?: number;
      masqueradeReason?: string;
      masquerade?: User & { classification?: any };
      classification?: any;
    };
  }
  // eslint-disable-next-line no-unused-vars
  interface Response {
    user: User & {
      masqueradeId?: number;
      masqueradeReason?: string;
      masquerade?: User & { classification?: any };
      classification?: any;
    };
  }
}
