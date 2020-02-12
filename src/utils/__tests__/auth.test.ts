import User from '../../api/models/user'; // eslint-disable-line no-unused-vars
import parseSamlResult, { encrypt, decrypt, issueJWT, userFromJWT } from '../auth';
import { ENCRYPTION_KEY, GROUPS, JWT_KEY } from '../../constants';

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
const mockedSetAsync = jest.fn();
const mockedGetCache = jest.fn();

jest.mock('../../api/modules/cache.ts', () => ({
  ...jest.requireActual('../../api/modules/cache.ts'),
  setAsync: () => mockedSetAsync(),
  selectDbAsync: () => jest.fn(),
  getCache: () => mockedGetCache(),
}));

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

describe('encrypt', () => {
  it('encrypts the text', async () => {
    expect(encrypt('test', ENCRYPTION_KEY)).not.toEqual('test');
  });
  it('fails to encrypt the text with a bad key', async () => {
    expect(encrypt('test', undefined)).toBe(null);
  });
});

describe('decrypt', () => {
  it('decrypts the text', async () => {
    const encrypted = encrypt('test', ENCRYPTION_KEY);
    expect(decrypt(encrypted, ENCRYPTION_KEY)).toEqual('test');
  });
  it('fails to decrypt the text with a bad key', async () => {
    expect(decrypt('test', undefined)).toBe(null);
  });
});

describe('issueJWT', () => {
  beforeEach(() => {
    mockedSetAsync.mockReturnValue(true);
  });
  it('creates an encrypted JWT', async () => {
    const jwt = await issueJWT(mockUser as User, ENCRYPTION_KEY, JWT_KEY);
    expect(jwt).not.toBe(null);
  });
  it('fails to decrypt the text with a bad key', async () => {
    const jwt = await issueJWT(mockUser as User, undefined, undefined);
    expect(jwt).toBe(null);
  });
  it('fails to cache the text', async () => {
    mockedSetAsync.mockReturnValue(false);
    const jwt = await issueJWT(mockUser as User, ENCRYPTION_KEY, JWT_KEY);
    expect(jwt).toBe(null);
  });
});

describe('userFromJWT', () => {
  let jwt;
  let encrypted;
  beforeEach(async () => {
    mockedSetAsync.mockReturnValue(true);
    mockedGetCache.mockReturnValue(true);
    encrypted = await issueJWT(mockUser as User, ENCRYPTION_KEY, JWT_KEY);
    jwt = decrypt(encrypted, ENCRYPTION_KEY);
  });
  it('gets the user from the JWT', async () => {
    const user = await userFromJWT(jwt, JWT_KEY);
    expect(user).toMatchObject(mockUser);
  });
  it('fails to get the user with a bad key', async () => {
    jwt = decrypt(encrypted, undefined);
    expect(await userFromJWT(jwt, undefined)).toBe(null);
  });
  it('fails to find an expected jwt from cache', async () => {
    mockedGetCache.mockReturnValue(false);
    jwt = decrypt(encrypted, ENCRYPTION_KEY);
    expect(await userFromJWT(jwt, JWT_KEY)).toBe(null);
  });
});
