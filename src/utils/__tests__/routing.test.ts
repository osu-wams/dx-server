import { Request, Response, NextFunction } from 'express'; // eslint-disable-line no-unused-vars
import {
  setSessionReturnUrl,
  isMobileRedirect,
  isAppUrl,
  redirectReturnUrl,
  setJWTSessionUser,
} from '../routing';
import { mockUser } from '../../api/models/__mocks__/user';
import { issueJWT } from '../auth';
import { ENCRYPTION_KEY, JWT_KEY } from '../../constants'; // eslint-disable-line no-unused-vars

const mockedSession = jest.fn();
const mockedQuery = jest.fn();
const mockedRedirect = jest.fn();
const mockedHeaders = jest.fn();
const mockedUser = jest.fn();

const mockRequest = (): Request => {
  const req: any = {};
  req.headers = mockedHeaders();
  req.session = mockedSession();
  req.query = mockedQuery();
  req.user = mockedUser();
  return req;
};

const mockResponse = (): Response => {
  const res: any = {};
  res.redirect = mockedRedirect;
  return res;
};

const mockNext: NextFunction = jest.fn();

afterEach(() => {
  jest.clearAllMocks();
});

describe('setSessionReturnUrl', () => {
  beforeEach(() => {
    mockedSession.mockReturnValue({});
    mockedQuery.mockReturnValue({});
  });
  it('returns a url', () => {
    mockedQuery.mockReturnValue({ returnTo: '/bob-ross' });
    setSessionReturnUrl(mockRequest(), {} as Response, () => {});
    expect(mockedSession()).toStrictEqual({ returnUrl: '/bob-ross' });
  });
  it('returns a valid return uri', () => {
    mockedQuery.mockReturnValue({ redirectUri: 'osu-dx://test' });
    setSessionReturnUrl(mockRequest(), {} as Response, () => {});
    expect(mockedSession()).toStrictEqual({
      mobileLogin: true,
      returnUrl: 'osu-dx://test',
    });
  });
  it('returns the default for invalid redirect uris', () => {
    mockedQuery.mockReturnValue({ redirectUri: 'http://badbad.bad' });
    setSessionReturnUrl(mockRequest(), {} as Response, () => {});
    expect(mockedSession()).toStrictEqual({ returnUrl: '/' });
  });
  it('returns the default when no query params are passed ', () => {
    setSessionReturnUrl(mockRequest(), {} as Response, () => {});
    expect(mockedSession()).toStrictEqual({ returnUrl: '/' });
  });
});

describe('isMobileRedirect', () => {
  it('detects osu-dx scheme', async () => {
    expect(isMobileRedirect('osu-dx://login')).toBeTruthy();
  });
  it('detects exp scheme', async () => {
    expect(isMobileRedirect('exp://123.123.123.123:19000')).toBeTruthy();
  });
  it('detects a non mobile redirect', async () => {
    expect(isMobileRedirect('https://blah')).toBeFalsy();
  });
});

describe('isAppUrl', () => {
  it('detects a dx web application url', async () => {
    expect(isAppUrl('https://local.my.oregonstate.edu/profile')).toBeTruthy();
  });
  it('detects relative url', async () => {
    expect(isAppUrl('/profile')).toBeTruthy();
  });
  it('detects a mobile url', async () => {
    expect(isAppUrl('exp://123.123.123.123:19000')).toBeFalsy();
  });
});

describe('redirectReturnUrl', () => {
  it('includes a jwt token in the redirect', async () => {
    mockedSession.mockReturnValue({ returnUrl: 'exp://blah', mobileLogin: true });
    redirectReturnUrl(mockRequest(), mockResponse(), mockUser);
    const token = issueJWT(mockUser, ENCRYPTION_KEY, JWT_KEY);
    expect(mockedRedirect).toBeCalledWith(`exp://blah?token=${token}`);
  });
  it('redirects', async () => {
    mockedSession.mockReturnValue({ returnUrl: '/blah' });
    redirectReturnUrl(mockRequest(), mockResponse(), mockUser);
    expect(mockedRedirect).toBeCalledWith('/blah');
  });
});

describe('setJWTSessionUser', () => {
  it('calls next when a token is not provided', async () => {
    mockedHeaders.mockReturnValue({ authorization: undefined });
    setJWTSessionUser(mockRequest(), mockResponse(), mockNext);
    expect(mockedSession().jwtAuth).toBe(undefined);
    expect(mockNext).toBeCalled();
  });
  it('calls next when a token is provided but a user has been set previously', async () => {
    const token = issueJWT(mockUser, ENCRYPTION_KEY, JWT_KEY);
    mockedUser.mockReturnValue(mockUser);
    mockedSession.mockReturnValue({});
    mockedHeaders.mockReturnValue({ authorization: token });
    setJWTSessionUser(mockRequest(), mockResponse(), mockNext);
    expect(mockedSession().jwtAuth).toBe(undefined);
    expect(mockNext).toBeCalled();
  });
  it('sets jwt auth and user based on the jwt token', async () => {
    const token = issueJWT(mockUser, ENCRYPTION_KEY, JWT_KEY);
    mockedUser.mockReturnValue(undefined);
    mockedSession.mockReturnValue({});
    mockedHeaders.mockReturnValue({ authorization: token });
    setJWTSessionUser(mockRequest(), mockResponse(), mockNext);
    expect(mockedSession().jwtAuth).toBe(true);
    expect(mockNext).toBeCalled();
  });
});
