import { Request, Response } from 'express'; // eslint-disable-line no-unused-vars
import { GROUPS } from '../../api/models/user';
import parseSamlResult, { setLoginSession } from '../auth';

const mockedDone = jest.fn();
const mockSaml = {
  'urn:oid:1.3.6.1.4.1.5016.2.1.2.1': '123456789',
  'urn:oid:1.3.6.1.4.1.5923.1.1.1.6': 'test@test.com',
  'urn:oid:1.3.6.1.4.1.5923.1.1.1.5': 'employee',
  nameID: 'somelongnameid',
  nameIDFormat: 'somelongnameidformat',
  'urn:oid:2.5.4.42': 'Bob',
  'urn:oid:2.5.4.4': 'Ross',
  'urn:oid:1.3.6.1.4.1.5923.1.1.1.7': [GROUPS.admin, GROUPS.masquerade],
  'urn:oid:1.3.6.1.4.1.5923.1.1.1.1': ['member', 'employee'],
};
const mockUser = {
  affiliations: ['member', 'employee'],
  email: 'test@test.com',
  firstName: 'Bob',
  groups: ['admin', 'masquerade'],
  isAdmin: true,
  lastName: 'Ross',
  nameID: 'somelongnameid',
  nameIDFormat: 'somelongnameidformat',
  osuId: 123456789,
  primaryAffiliation: 'employee',
};
const mockedSession = jest.fn();
const mockedQuery = jest.fn();

const mockRequest = (): Request => {
  const res: any = {};
  res.session = mockedSession();
  res.query = mockedQuery();
  return res;
};

describe('parseSamlResult', () => {
  it('parses the Saml result', async () => {
    parseSamlResult(mockSaml, mockedDone);
    expect(mockedDone).toBeCalledWith(null, mockUser);
  });
  it('parses a Saml result without masquerade', async () => {
    parseSamlResult(
      { ...mockSaml, 'urn:oid:1.3.6.1.4.1.5923.1.1.1.7': [GROUPS.admin] },
      mockedDone,
    );
    expect(mockedDone).toBeCalledWith(null, { ...mockUser, groups: ['admin'] });
  });
  it('parses a Saml result without admin', async () => {
    parseSamlResult(
      { ...mockSaml, 'urn:oid:1.3.6.1.4.1.5923.1.1.1.7': [GROUPS.masquerade] },
      mockedDone,
    );
    expect(mockedDone).toBeCalledWith(null, {
      ...mockUser,
      isAdmin: false,
      groups: ['masquerade'],
    });
  });
});

describe('setLoginSession', () => {
  beforeEach(() => {
    mockedSession.mockReturnValue({});
    mockedQuery.mockReturnValue({});
  });
  it('returns a url', () => {
    mockedQuery.mockReturnValue({ returnTo: '/bob-ross' });
    setLoginSession(mockRequest(), {} as Response, () => {});
    expect(mockedSession()).toStrictEqual({ returnUrl: '/bob-ross' });
  });
  it('returns a valid return uri', () => {
    mockedQuery.mockReturnValue({ redirectUri: 'osu-dx://test' });
    setLoginSession(mockRequest(), {} as Response, () => {});
    expect(mockedSession()).toStrictEqual({ mobileAuth: true, returnUrl: 'osu-dx://test' });
  });
  it('returns the default for invalid redirect uris', () => {
    mockedQuery.mockReturnValue({ redirectUri: 'http://badbad.bad' });
    setLoginSession(mockRequest(), {} as Response, () => {});
    expect(mockedSession()).toStrictEqual({ returnUrl: '/' });
  });
  it('returns the default when no query params are passed ', () => {
    setLoginSession(mockRequest(), {} as Response, () => {});
    expect(mockedSession()).toStrictEqual({ returnUrl: '/' });
  });
});
