import supertest from 'supertest';
import app, { useMocks } from '../../index';
import User from '../models/user';
import { mockUser } from '../models/__mocks__/user';

const mockRequestOAuthToken = jest.fn();

jest.mock('../modules/canvas', () => ({
  ...jest.requireActual('../modules/canvas'),
  refreshOAuthToken: () => mockRequestOAuthToken,
}));

jest.mock('../models/user');
const mockUserModel = User as jest.Mocked<any>;

let request: supertest.SuperTest<supertest.Test>;

beforeAll(async () => {
  request = supertest.agent(app);
});

describe('/healthcheck', () => {
  it('returns success', async () => {
    await request.get('/healthcheck').expect(200, {
      version: 'test-123',
      useMocks,
    });
  });
});

describe('/login', () => {
  it('redirects the user to /', async () => {
    await request.get('/login').then((res) => {
      expect(res.header.location).toBe('/');
    });
  });
});

describe('/login with local api key', () => {
  it('redirects the user to /', async () => {
    mockUserModel.find.mockImplementationOnce(() => Promise.resolve(mockUser));
    await request.get('/login?username=123456&password=blah').then((res) => {
      expect(res.header.location).toBe('/');
    });
  });
});

describe('/logout', () => {
  it('redirects the user to / if no user was logged in', async () => {
    await request.get('/logout').then((res) => {
      expect(res.header.location).toBe('/');
    });
  });
  it('logs a user out', async () => {
    await request.get('/login');
    await request.get('/logout').then((res) => {
      expect(res.header.location).toBe('/');
    });
  });
});

describe('/logout/saml', () => {
  it('redirects the user to / if no user was logged in', async () => {
    await request.get('/logout/saml').then((res) => {
      expect(res.header.location).toBe('/');
    });
  });
  it('logs a user out', async () => {
    await request.get('/login');
    await request.get('/logout/saml').then((res) => {
      expect(res.header.location).toBe('/');
    });
  });
});

describe('/canvas/refresh', () => {
  it('returns unauthorized for a user who has not logged in', async () => {
    await request.get('/canvas/refresh').expect(401);
  });
  it('redirects logged in user to /', async () => {
    await request.get('/login');
    await request.get('/canvas/refresh').then((res) => {
      mockRequestOAuthToken.mockReturnValue(mockUser);
      expect(res.status).toBe(302);
      expect(res.header.location).toBe('/');
    });
  });
});

describe('/canvas/auth', () => {
  it('redirects browser to main page', async () => {
    await request.get('/login');
    await request.get('/canvas/auth').then((res) => {
      expect(res.status).toBe(302);
      expect(res.header.location).toBe('/');
    });
  });
});

describe('/canvas/login', () => {
  it('redirects browser to oauth2 login', async () => {
    await request.get('/login');
    await request.get('/canvas/login').then((res) => {
      expect(res.status).toBe(302);
      expect(res.header.location).toContain('/login/oauth2/auth?');
    });
  });
});
