import { Request } from 'express'; // eslint-disable-line no-unused-vars
import { Strategy } from 'passport';
import mockUser from './mock-user';

export default class MockStrategy extends Strategy {
  constructor(name: string) {
    super();
    this.name = name;
  }

  // eslint-disable-next-line no-unused-vars
  public authenticate(req: Request) {
    return this.success(mockUser());
  }
}
