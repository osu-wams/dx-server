import { Request, Response } from 'express'; // eslint-disable-line no-unused-vars
import { setSessionReturnUrl } from '../routing';

const mockedSession = jest.fn();
const mockedQuery = jest.fn();

const mockRequest = (): Request => {
  const res: any = {};
  res.session = mockedSession();
  res.query = mockedQuery();
  return res;
};

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
