import configsForApi from '../config';

describe('configsForApi', () => {
  it('returns an empty config if a non-admin user somehow accesses this even though they should not be able to', () => {
    expect(configsForApi(false)).toStrictEqual({});
  });
  it('returns a config for an admin', () => {
    const keys = [
      'appVersion',
      'aws',
      'canvasApi',
      'canvasOauth',
      'dxApi',
      'env',
      'localist',
      'logLevel',
      'osuApi',
      'raveApi',
      'redis',
      'saml',
    ];
    expect(Object.keys(configsForApi(true))).toStrictEqual(keys);
  });
});
