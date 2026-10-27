import { User } from '../../api/models/user';

declare module 'express-serve-static-core' {
  interface Request {
    user: User & {
      masqueradeId?: number;
      masqueradeReason?: string;
      masquerade?: User & { classification?: any };
      classification?: any;
    };
  }
  interface Response {
    user: User & {
      masqueradeId?: number;
      masqueradeReason?: string;
      masquerade?: User & { classification?: any };
      classification?: any;
    };
  }
}
