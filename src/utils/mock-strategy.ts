import { Request } from 'express';
import { Strategy } from 'passport';
import mockUser from './mock-user';
import logger from '../logger';

export default class MockStrategy extends Strategy {
  constructor(name: string) {
    super();
    this.name = name;
  }

  public authenticate(req: Request) {
    return this.success(mockUser());
  }

  public logout(req: Request, cb: any) {
    logger().debug('mockStrategy logout');
  }
}
