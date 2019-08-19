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

### Run the server

In a separate terminal window run:

    $ yarn start

## OAuth Testing (Running locally in Production)

- Copy `.env.example` to `.env` and change NODE_ENV to production
- Execute `docker-compose up`
