const mockUser = () => ({
  email: 'fake-email@oregonstate.edu',
  firstName: 'Test',
  lastName: 'User',
  permissions: [
    'urn:mace:oregonstate.edu:entitlement:dx:dx-admin',
    'urn:mace:oregonstate.edu:entitlement:dx:dx-masquerade',
  ],
  osuId: 111111111,
  isAdmin: true,
  groups: ['admin', 'masquerade'],
  isCanvasOptIn: true,
  refreshToken: 'token',
  canvasOauthExpire: Date.now() + 1000 * 60 * 60 * 24,
  canvasOauthToken: 'token',
});

export default mockUser;
