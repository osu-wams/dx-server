import parseSamlResult, { encrypt, decrypt, issueJWT, userFromJWT, lastLogin } from '../auth';
import { ENCRYPTION_KEY, GROUPS, JWT_KEY } from '../../constants';
import { mockUser as modelMockUser } from '../../api/models/__mocks__/user';

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
  'urn:oid:0.9.2342.19200300.100.1.1': 'rossb',
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
  onid: 'rossb',
  lastLogin: lastLogin(),
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
  it('parses a Saml result with other as primaryAffiliation and affiliations', async () => {
    parseSamlResult(
      {
        ...mockSaml,
        'urn:oid:1.3.6.1.4.1.5923.1.1.1.5': 'other',
        'urn:oid:1.3.6.1.4.1.5923.1.1.1.1': ['other'],
      },
      mockedDone,
    );
    expect(mockedDone).toBeCalledWith(null, {
      ...mockUser,
      primaryAffiliation: 'employee',
      affiliations: ['employee'],
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
  it('creates an encrypted JWT', async () => {
    const jwt = await issueJWT(mockUser, ENCRYPTION_KEY, JWT_KEY);
    expect(jwt).not.toBe(null);
  });
  it('fails to decrypt the text with a bad key', async () => {
    const jwt = await issueJWT(mockUser, undefined, undefined);
    expect(jwt).toBe(null);
  });
});

describe('userFromJWT', () => {
  let jwt;
  let encrypted;
  beforeEach(async () => {
    encrypted = await issueJWT(mockUser, ENCRYPTION_KEY, JWT_KEY);
    jwt = decrypt(encrypted, ENCRYPTION_KEY);
  });
  it('gets the user from the JWT', async () => {
    const user = await userFromJWT(jwt, JWT_KEY);
    expect(user.osuId).toBe(modelMockUser.osuId);
  });
  it('fails to get the user with a bad key', async () => {
    jwt = decrypt(encrypted, undefined);
    expect(await userFromJWT(jwt, undefined)).toBe(undefined);
  });
});
