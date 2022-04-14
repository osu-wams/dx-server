// Mock Saml User for API testing with supertest, this ties into the mock-strategy for
// test user authentication
const mockUser = () => ({
  email: 'fake-email@oregonstate.edu',
  firstName: 'Test',
  lastName: 'User',
  permissions: [
    'urn:mace:oregonstate.edu:entitlement:dx:dxAdmin',
    'urn:mace:oregonstate.edu:entitlement:dx:dxMasquerade',
  ],
  osuId: 111111111,
  onid: 'bobross',
  isAdmin: true,
  groups: ['admin', 'masquerade', 'successFactors'],
  colleges: [],
  canvasOptIn: true,
  canvasRefreshToken: 'token',
  canvasOauthExpire: Date.now() + 1000 * 60 * 60 * 24,
  canvasOauthToken: 'token',
});

export default mockUser;
