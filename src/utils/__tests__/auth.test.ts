import { GROUPS } from '../../api/models/user';
import parseSamlResult from '../auth';

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
};
const mockUser = {
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
