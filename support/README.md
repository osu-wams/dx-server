# Inspect a JWT

A utility was created to inspect, for troubleshooting purposes, an existing JWT token to inspect the encoded data.

```bash
$ yarn ts-node support/jwt.ts <encrypted JWT token>


USAGE:
yarn ts-node support/jwt.ts <encrypted jwt token>


--Decrypted JWT--
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvc3VJZCI6MTExMTExMTExLCJlbWFpbCI6Im5vcmVwbHlAb3JlZ29uc3RhdGUuZWR1IiwicHJpbWFyeUFmZmlsaWF0aW9uIjoiZW1wbG95ZWUiLCJpYXQiOjE1MTYyMzkwMjJ9.jD_tmbgHJqX9wQobjjE4zzMLxwLmYSV1We6IQ1rWe3c


--User from JWT--
{ osuId: 111111111,
  email: 'noreply@oregonstate.edu',
  primaryAffiliation: 'employee',
  nameID: 'some-id-here',
  nameIDFormat: 'urn:oasis:names:tc:SAML:2.0:nameid-format:transient',
  firstName: 'Bob',
  lastName: 'Ross',
  groups: [ 'admin', 'masquerade' ],
  affiliations: [ 'employee', 'member' ],
  isAdmin: true,
  refreshToken: 'refresh-token-here',
  canvasOauthToken: 'oauth-token-here',
  canvasOauthExpire: 1580942924,
  isCanvasOptIn: true,
  iat: 1580939324 }
```

# Server Load and Scenario Testing

An [Artillery](http://artillery.io) configuration is included to perform tests on logging in and performing various scenarios against the server API endpoints. Before executing the scenarios, Artillery must be installed as a global node module.

    $ yarn global add artillery@latest

Set environment variables for a valid Administrators OSU ID (probably your own) and an API Key (which you can find in the dx-infrastructure configs in Keeper).

    $ export ARTILLERY_API_OSUID=#########
    $ export ARTILLERY_API_KEY=#########

Run the scenarios for `development`, `stage`, or `production` to gather summary reports.

    $ artillery run -e development support/artillery.tests.yml

# Testing External API Endpoints

Using VSCode along with a very handy extension [REST Client](https://github.com/Huachao/vscode-restclient) makes testing the DX external APIs a breeze. [Install the extension](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) before using the steps below.

Open files with the `.http` extension found in the `support/` folder to execute individual API calls. Some calls might require fetching a current API token prior to executing additional calls, as well as potentially setting a valid OSU ID. For instance, processing a test in `support/osuApi.http` would work as follows;

#

### support/osuApi.http details

1. Set environment variables (before starting VSCode, or restarting VSCode after setting these)

```
$ export OSU_API_CLIENT_ID=the_valid_client_id_goes_here
$ export OSU_API_CLIENT_SECRET=the_valid_client_secret_goes_here
```

2. Open `support/osuApi.http` file
3. Set a valid `@osuId`
4. Click `Send Request` on the `getToken` request to fetch the token
5. Click `Send Request` on one of the following API requests to fetch the data
