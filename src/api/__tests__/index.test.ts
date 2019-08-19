import supertest from 'supertest';
import app from '../../index';
import * as canvas from '../modules/canvas';

jest.mock('../modules/canvas');
const mockCanvas = canvas as jest.Mocked<any>;

let request: supertest.SuperTest<supertest.Test>;

beforeAll(async () => {
  request = supertest.agent(app);
});

describe('/healthcheck', () => {
  it('returns success', async () => {
    await request.get('/healthcheck').expect(200);
  });
});

describe('/login', () => {
  it('redirects the user to /', async () => {
    await request.get('/login').then(res => {
      expect(res.header.location).toBe('/');
    });
  });
});

describe('/logout', () => {
  it('redirects the user to / if no user was logged in', async () => {
    await request.get('/logout').then(res => {
      expect(res.header.location).toBe('/');
    });
  });
  it('logs a user out', async () => {
    await request.get('/login');
    await request.get('/logout').then(res => {
      expect(res.header.location).toBe('/');
    });
  });
});

describe('/logout/saml', () => {
  it('redirects the user to / if no user was logged in', async () => {
    await request.get('/logout/saml').then(res => {
      expect(res.header.location).toBe('/');
    });
  });
  it('logs a user out', async () => {
    await request.get('/login');
    await request.get('/logout/saml').then(res => {
      expect(res.header.location).toBe('/');
    });
  });
});

describe('/canvas/refresh', () => {
  it('returns unauthorized for a user who has not logged in', async () => {
    await request.get('/canvas/refresh').expect(401);
  });
  it('redirects logged in user to /', async () => {
    mockCanvas.getOAuthToken = jest.fn();
    await request.get('/login');
    await request.get('/canvas/refresh').then(res => {
      expect(res.status).toBe(302);
      expect(res.header.location).toBe('/');
    });
  });
});

describe('/canvas/auth', () => {
  it('redirects browser to oauth2 login', async () => {
    await request.get('/login');
    await request.get('/canvas/auth').then(res => {
      expect(res.status).toBe(302);
      expect(res.header.location).toContain('/login/oauth2/auth?')
    });
  });
});

describe('/canvas/login', () => {
  it('redirects browser to oauth2 login', async () => {
    await request.get('/login');
    await request.get('/canvas/login').then(res => {
      expect(res.status).toBe(302);
      expect(res.header.location).toContain('/login/oauth2/auth?')
    });
  });
});
