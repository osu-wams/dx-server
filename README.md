[![CircleCI](https://circleci.com/gh/osu-wams/dx-server/tree/master.svg?style=svg)](https://circleci.com/gh/osu-wams/dx-server/tree/master)[![codecov](https://codecov.io/gh/osu-wams/dx-server/branch/master/graph/badge.svg)](https://codecov.io/gh/osu-wams/dx-server)

## Dependencies

- Docker
- /etc/hosts entry

      127.0.0.1 dev.my.oregonstate.edu

## Development Setup

### Copy the default docker-compose.override.yml into place

    $ cp docker-compose.override.example.yml docker-compose.override.yml

### Install the node modules

    $ yarn

### Start the DynamoDb and Redis Queue

    $ docker-compose up

### Create the Users table in DynamoDb

_This step is only required the first time you start development and/or if you wipe the docker volumes for this project._

    $ yarn exec ts-node src/db/scripts/create_users_table.ts

### OSX MAC install truncate (via homebrew)

    $ brew install truncate

### Install PM2 Typescript module

    $ yarn run pm2 install typescript

### Run the server in Development mode (no CAS authentication)

In a separate terminal window run:

    $ yarn start

### Run the server in Production mode (including CAS authentication)

In a separate terminal window run:

    $ yarn prod

# Admin Functions

Key based authentication exists to facilitate automation and to enable administrative
tooling for performing functions that aren't otherwise exposed through the front-end. An
approach to performing these functions is to use `curl` to login and call subsequent actions.

Capture cookies send from the server and use cookies provided by the server happens when a `-b` and `-c` parameter is included with the `curl` command.

`curl -b cookie.txt -c cookie.txt ...`

## First, login using an API key

**A valid DX users `osuId` must be provided along with a valid API key (find this in the dx-infrastructure configurations or the ENV in the server service in ECS).**

    curl -b cookie.txt -c cookie.txt http://dev.my.oregonstate.edu/login?osuId=#########&key=########

## Then, reset all API caches?

This feature will clear all of the external API caches in the case that some data changes need to flow out to the front-end ASAP.

    curl -b cookie.txt -c cookie.txt http://dev.my.oregonstate.edu/api/admin/reset-api-cache

## Then, reset all user sessions?

This feature is intended to be used infrequently and will cause all users to have to "opt-in" to Canvas OAuth. **use sparingly!**

    curl -b cookie.txt -c cookie.txt http://dev.my.oregonstate.edu/api/admin/reset-sessions
