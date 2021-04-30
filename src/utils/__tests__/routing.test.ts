import { Request, Response, NextFunction } from 'express'; // eslint-disable-line no-unused-vars
import {
  setSessionReturnUrl,
  isMobileRedirect,
  isAppUrl,
  redirectReturnUrl,
  setJwtUserSession,
  jwtUserHasToken,
} from '../routing';
import { mockUser } from '../../api/models/__mocks__/user';
import { issueJWT } from '../auth';
import { ENCRYPTION_KEY, JWT_KEY } from '../../constants'; // eslint-disable-line no-unused-vars

const mockedSession = jest.fn();
const mockedQuery = jest.fn();
const mockedRedirect = jest.fn();
const mockedStatus = jest.fn();
const mockedSend = jest.fn();
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
  res.status = mockedStatus;
  res.send = mockedSend;
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
    mockedQuery.mockReturnValue({ return: '/bob-ross' });
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
    await redirectReturnUrl(mockRequest(), mockResponse(), mockUser);
    expect(mockedRedirect.mock.calls[0][0].match(/exp:\/\/blah\?token=.*/g)).toBeTruthy();
  });
  it('redirects', async () => {
    mockedSession.mockReturnValue({ returnUrl: '/blah' });
    await redirectReturnUrl(mockRequest(), mockResponse(), mockUser);
    expect(mockedRedirect).toBeCalledWith('/blah');
  });
});

describe('setJwtUserSession', () => {
  beforeEach(async () => {
    const token = await issueJWT(mockUser, ENCRYPTION_KEY, JWT_KEY);
    mockedHeaders.mockReturnValue({ authorization: token });
  });

  it('calls next when a token is not provided', async () => {
    mockedHeaders.mockReturnValue({ authorization: undefined });
    await setJwtUserSession(mockRequest(), mockResponse(), mockNext);
    expect(mockedSession().jwtAuth).toBe(undefined);
    expect(mockNext).toBeCalled();
  });
  it('calls next when a token is provided but a user has been set previously', async () => {
    mockedUser.mockReturnValue(mockUser);
    mockedSession.mockReturnValue({});
    await setJwtUserSession(mockRequest(), mockResponse(), mockNext);
    expect(mockedSession().jwtAuth).toBe(undefined);
    expect(mockNext).toBeCalled();
  });
  it('sets jwt auth and user based on the jwt token', async () => {
    mockedUser.mockReturnValue(undefined);
    mockedSession.mockReturnValue({});
    await setJwtUserSession(mockRequest(), mockResponse(), mockNext);
    expect(mockedSession().jwtAuth).toBe(true);
    expect(mockNext).toBeCalled();
  });
});

describe('jwtUserHasToken', () => {
  beforeEach(async () => {
    const token = await issueJWT(mockUser, ENCRYPTION_KEY, JWT_KEY);
    mockedHeaders.mockReturnValue({ authorization: token });
  });

  it('calls next when the request is not of jwtAuth type', async () => {
    mockedSession.mockReturnValue({ jwtAuth: false });
    jwtUserHasToken('api')(mockRequest(), mockResponse(), mockNext);
    expect(mockNext).toBeCalled();
  });
  it('calls next when a token is provided and matches the required scope', async () => {
    mockedSession.mockReturnValue({ jwtAuth: true });
    jwtUserHasToken('api')(mockRequest(), mockResponse(), mockNext);
    expect(mockNext).toBeCalled();
  });
  it('returns error when the token does not match the required scope', async () => {
    mockedSession.mockReturnValue({ jwtAuth: true });
    mockedStatus.mockReturnValue(mockResponse());
    jwtUserHasToken('refresh')(mockRequest(), mockResponse(), mockNext);
    expect(mockNext).not.toBeCalled();
    expect(mockedStatus).toBeCalledWith(500);
    expect(mockedSend).toBeCalledWith({ error: 'Invalid token scope to access endpoint.' });
  });
  it('returns error when no authorization header exists', async () => {
    mockedSession.mockReturnValue({ jwtAuth: true });
    mockedHeaders.mockReturnValue({});
    mockedStatus.mockReturnValue(mockResponse());
    jwtUserHasToken('api')(mockRequest(), mockResponse(), mockNext);
    expect(mockNext).not.toBeCalled();
    expect(mockedStatus).toBeCalledWith(500);
    expect(mockedSend).toBeCalledWith({ error: 'Missing authorization header.' });
  });
});
