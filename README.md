[![codecov](https://codecov.io/gh/osu-wams/dx-server/branch/master/graph/badge.svg)](https://codecov.io/gh/osu-wams/dx-server)

## Dependencies

- [Docker](https://docs.docker.com/install/)
- [NVM](https://github.com/nvm-sh/nvm#installation-and-update)
- [Yarn (install via NPM)](https://yarnpkg.com/en/docs/install#alternatives-stable)

## Development Setup

### OSX MAC install truncate (via homebrew)

    $ brew install truncate

### Find `local.ts` and copy into place

_`local.ts` contains overrides for environment variables that contain authentication keys and other secrets. The WAMS group stores a protected copy of this file in Keeper. Place a copy of this file in `config/`._

### Copy the default docker-compose.override.yml into place

    $ cp docker-compose.override.example.yml docker-compose.override.yml

### Install the node modules

    $ yarn

### Start the DynamoDb and Redis Queue

    $ docker-compose up

### Create the Users table in DynamoDb

_This step is only required the first time you start development and/or if you wipe the docker volumes for this project._

    $ yarn exec ts-node src/db/scripts/create_users_table.ts

### Run the server for local development

To run without SAML authentication, in a separate terminal window run:

    $ yarn start

To run with SAML authentication, in a separate terminal window run:

    $ yarn saml

# Admin Functions

Key based authentication exists to facilitate automation and to enable administrative
tooling for performing functions that aren't otherwise exposed through the front-end. An
approach to performing these functions is to use `curl` to login and call subsequent actions.

Capture cookies send from the server and use cookies provided by the server happens when a `-b` and `-c` parameter is included with the `curl` command.

`curl -b cookie.txt -c cookie.txt ...`

## First, login using an API key

**A valid DX users `osuId` must be provided along with a valid API key (find this in the dx-infrastructure configurations or the ENV in the server service in ECS).**

    curl -b cookie.txt -c cookie.txt http://dev.my.oregonstate.edu/login?osuId=#########&key=########

## Then, take a look at the deployed configurations (except sensitive values).

This will return a JSON payload of the deployed configurations except for sensitive values like API keys, IDs, certs, and the like. If you have the commandline
tool `jq`, pipe the output from the command to `jq` to get a formatted display.

    curl -b cookie.txt -c cookie.txt http://dev.my.oregonstate.edu/api/admin/config
    // or
    // curl -b cookie.txt -c cookie.txt http://dev.my.oregonstate.edu/api/admin/config | jq

## Then, reset all API caches?

This feature will clear all of the external API caches in the case that some data changes need to flow out to the front-end ASAP.

    curl -b cookie.txt -c cookie.txt http://dev.my.oregonstate.edu/api/admin/reset-api-cache

## Then, reset all user sessions?

This feature is intended to be used infrequently and will cause all users to have to "opt-in" to Canvas OAuth. **use sparingly!**

    curl -b cookie.txt -c cookie.txt http://dev.my.oregonstate.edu/api/admin/reset-sessions
