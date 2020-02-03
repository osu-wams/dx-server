import { Request, Response } from 'express'; // eslint-disable-line no-unused-vars
import handleReturnRequest from '../routing';

const mockedSession = jest.fn();
const mockedQuery = jest.fn();

const mockRequest = (): Request => {
  const res: any = {};
  res.session = mockedSession();
  res.query = mockedQuery();
  return res;
};

describe('Routing helper', () => {
  describe('handleReturnRequest', () => {
    beforeEach(() => {
      mockedSession.mockReturnValue({});
      mockedQuery.mockReturnValue({});
    });
    it('returns a url', () => {
      mockedQuery.mockReturnValue({ returnTo: '/bob-ross' });
      handleReturnRequest(mockRequest(), {} as Response, () => {});
      expect(mockedSession()).toStrictEqual({ returnUrl: '/bob-ross' });
    });
    it('returns a valid return uri', () => {
      mockedQuery.mockReturnValue({ redirectUri: 'osu-dx://test' });
      handleReturnRequest(mockRequest(), {} as Response, () => {});
      expect(mockedSession()).toStrictEqual({ returnUrl: 'osu-dx://test' });
    });
    it('returns a valid return expo uri', () => {
      mockedQuery.mockReturnValue({ redirectUri: 'exp://test' });
      handleReturnRequest(mockRequest(), {} as Response, () => {});
      expect(mockedSession()).toStrictEqual({ returnUrl: 'exp://test' });
    });
    it('returns the default for invalid redirect uris', () => {
      mockedQuery.mockReturnValue({ redirectUri: 'http://badbad.bad' });
      handleReturnRequest(mockRequest(), {} as Response, () => {});
      expect(mockedSession()).toStrictEqual({ returnUrl: '/' });
    });
    it('returns the default when no query params are passed ', () => {
      handleReturnRequest(mockRequest(), {} as Response, () => {});
      expect(mockedSession()).toStrictEqual({ returnUrl: '/' });
    });
  });
});
