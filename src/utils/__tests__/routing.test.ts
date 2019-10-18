import { returnUrl } from '../routing';

const mockRequest = {
  session: {},
  query: {}
};
describe('Routing helper', () => {
  describe('returnUrl', () => {
    beforeEach(() => {
      mockRequest.session = {};
      mockRequest.query = {};
    });
    it('returns a url from the session', () => {
      mockRequest.session = { returnUrl: 'bob-ross' };
      expect(returnUrl(mockRequest)).toBe('bob-ross');
    });
    it('returns a url from the query string', () => {
      mockRequest.query = { returnTo: 'rick-ross' };
      expect(returnUrl(mockRequest)).toBe('rick-ross');
    });
    it('returns the root url', () => {
      expect(returnUrl(mockRequest)).toBe('/');
    });
  });
});
