export default {
  msTeamsHook: 'https://outlook.office.com/webhook/blahblahblah',
  env: 'test',
  sessionSecret: 'bobross',
  encryptionKey: 'thisoneis32characterslong1234567',
  jwtKey: 'this16characters',
  apiKeys: '[{"key":"blah","isAdmin":false}]',
  appVersion: 'test-123',
  google: {
    analyticsViewId: '22202',
    _privateKeyComment:
      'Hey l33t hackers, this is not a valid key, it only exists for the purpose of facilitating the tests.',
    privateKey:
      '-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQC/AHfqQbUnOnVF\nAih4korTGf8AFl8HHox8bR9+8czJHRQhEs6LQcZD0+GRstuXmdH+bJOu5Uz1tua0\nxeFvWRESY+kZnXJnluJwRenRbOBv1NDDo0aMkq/ujl12oc63kdZm9PSqxyfzhuZ+\nfnLBHBqiivtDoEFWvlEEb3FY8lLBPd0FkcdW4V/Vq5vtcZZp+c+P5pj2+kCJf+rE\nqwqym9eYwmQvvFYrv9hECLqJhj5IClhWmhRP3a5w7XebagzVdye/hmJUnH8Q43tQ\nkvXZJUF4YWpomi+j83r70hkcNd8sDhQYjE1bjRTK1SmTZvvrWKS+9CPbCIQDqUv/\nb87xd1tRAgMBAAECggEABq0yo+PI3C6PEZrYFRHjTCqLF0LQ7s/mr4VFffOgGdIc\nRWUxxtylXHLcPlJzGl8oP+Vl+q29hVPPx/coUJL7lancKLbwHDaiIvRQrm9Iv6P/\n6azMDyckAvnjQr24ewJ8LQRoRo14ZCr9pOOQ6Zbsx+yFiLlB+3Ei5h2qp8Ytth8+\n1pasztaILjwC11b9FJUiSvGFGGQv/MeNhzkr86mf0XMTccIz+WCT1o7pPNz8FraL\nwTy0HcqnMml5kzrFEUP4cI0ACVEjLgkoA+l8inbCKa9V97JKwNoCGl/snfoh2Iqx\nj2pol3oTT4WTFN8rDzBukyF9gPLZW1viSzdROljngQKBgQDwZNrxQZXUMpefbDit\nowVAJINOXufgXbOQXsNOffSml2Sx/4C2XRCmou9pJWFIn3JDDdmrTOErrRhIQ3di\nq6w7YtuPn4WHbVKO8+XjlsO6SUnr+q2G9RahnNoei58WWjUb90d24EkUEnVbDrMq\ngjSFYuJbDwVdhecHzioohhLeQQKBgQDLZsHwVBZWZsE6ji0WQCK9bEZbvkWY/Akc\nBqVZ+FQqQBUO1O66084U/iSV2RA/70mR68vPlSZyBgKVeNjU7kTRLU6UX2NDcL09\nUMnoUUs0zeY87Xu+VQQpU1gG3jnNXjK/RB+quyqo6uWkFpM5K5/+RnselYYZNkFc\nwHbeAnJZEQKBgHHPHcSIS1nZ1eS5BKBYBJ1Ya/3HernDQsa/xnE7un7AQADxOMud\nhcuOag/6jXMnYZ4TSZEK5bOa0Fst7bB+HB1FcTMuz7XM8QASwiycbO+d0OxykoLJ\nN7ytmKpLabbYYDpsOJ40EwT4tCy26eXfHORla0q28tBTG4ybc2QaDYbBAoGATZJY\n8HEBO95gXxaN92hqV1eN1btRC7FDQB8AvLlKT/q0jT2D9liExdjO1x87ZUa7Bh2p\nUveM+/tyzNKTz1E3iZb/2vIuBzBd256OAj3Ossq7vgzMHqCJv8D7V1M1NC9ypyMx\n+Ij9EgLTpaq+ZxVOJUl39wgLZl4cu2TjcHP6bCECgYAY65s4XptdTCi/NSsJDjEa\ntpfSQhJw0F4DnKB+bG7WavkjZ1pz/15Tulisne5YLWMxdQzPy0/2m7lRbxNsQ0Rv\nkwwee0EImOpps14RSKECm3CghT/mRqxRBG41RrHLjsa4OqdcbK+S85havyFbRLto\nePzL8yPSTl3uDIYLkyxbIQ==\n-----END PRIVATE KEY-----\n',
    serviceAccountEmail: 'bobross',
  },
  canvasOauth: {
    id: '8675309',
    secret: 'jenny',
  },
  aws: {
    dynamodb: {
      endpoint: 'http://localhost:8000',
    },
  },
  readyEducationApi: {
    token: 'bobross',
  },
  grouper: {
    host: 'fake.grouper.host',
    username: 'blahblah',
    password: 'secretblahblah',
    groups: {
      'covidvac-student': 'blahgroupblah',
    },
  },
};
