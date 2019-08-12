[![CircleCI](https://circleci.com/gh/osu-wams/dx-server/tree/master.svg?style=svg)](https://circleci.com/gh/osu-wams/dx-server/tree/master)[![codecov](https://codecov.io/gh/osu-wams/dx-server/branch/master/graph/badge.svg)](https://codecov.io/gh/osu-wams/dx-server)

## Dependencies

- Docker
- /etc/hosts entry

      127.0.0.1 dev.my.oregonstate.edu

## Development Setup

### Copy the default docker-compose.override.yml into place

    $ cp docker-compose.override.example.yml docker-compose.override.yml

### Start the Database and Redis Queue

    $ docker-compose up

### Run the server

In a separate terminal window run:

    $ yarn start

### Run the migrations

In a separate terminal window run the migrations:

    $ yarn db:migrate up

## OAuth Testing (Running locally in Production)

- Copy `.env.example` to `.env` and change NODE_ENV to production
- Execute `docker-compose up`
