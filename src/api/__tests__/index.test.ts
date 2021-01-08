import supertest from 'supertest';
import nock from 'nock';
import app from '../../index';
import { USE_MOCKS } from '../../constants';
import { mockUser } from '../models/__mocks__/user';
import { BASE_URL } from '../modules/ready-education';
import mockedStudent from '../../mocks/ready-education/student.data';

const mockRequestOAuthToken = jest.fn();

jest.mock('../modules/canvas', () => ({
  ...jest.requireActual('../modules/canvas'),
  refreshOAuthToken: () => mockRequestOAuthToken,
}));

const mockFindReturn = jest.fn();

jest.mock('../models/user', () => ({
  ...jest.requireActual('../models/user'),
  find: () => mockFindReturn(),
}));

let request: supertest.SuperTest<supertest.Test>;

beforeAll(async () => {
  request = supertest.agent(app);
});

describe('/healthcheck', () => {
  it('returns success', async () => {
    const response = await request.get('/healthcheck');

    /**
     * Tests run in test or development locally usually but in test mode in CI
     * We check for both so we don't have to change environments in local dev
     */
    const testResponse = {
      version: 'test-123',
      useMocks: USE_MOCKS,
    };
    const devResponse = {
      version: 'development-123',
      useMocks: USE_MOCKS,
    };

    const resArray = [testResponse, devResponse];
    expect(resArray).toEqual(expect.arrayContaining([response.body]));
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
    await request.get('/login?username=123456&password=blah').then((res) => {
      expect(res.header.location).toBe('/');
    });
  });
});

describe('/login with ready education provided token', () => {
  const mockToken = 'abc';
  beforeEach(() => {
    nock(BASE_URL).get(`/public/v1/user/?user_token=${mockToken}`).reply(200, mockedStudent);
    mockFindReturn.mockReturnValue(mockUser);
  });

  it('redirects the user to /', async () => {
    await request.get(`/login?u=x&t=${mockToken}`).then((res) => {
      expect(res.header.location).toBe('/');
    });
  });
  it('redirects the user to some-page', async () => {
    await request.get(`/login?returnUrl=some-page&u=x&t=${mockToken}`).then((res) => {
      expect(res.header.location).toBe('some-page');
    });
  });
});

describe('/logout', () => {
  xit('redirects the user to / if no user was logged in', async () => {
    await request.get('/logout').then((res) => {
      expect(res.header.location).toBe('/');
    });
  });
  xit('logs a user out', async () => {
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
