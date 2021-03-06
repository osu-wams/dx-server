[![codecov](https://codecov.io/gh/osu-wams/dx-server/branch/master/graph/badge.svg)](https://codecov.io/gh/osu-wams/dx-server)

## Dependencies

- [Docker](https://docs.docker.com/install/)
- [NVM](https://github.com/nvm-sh/nvm#installation-and-update)
- [Yarn (install via NPM)](https://yarnpkg.com/en/docs/install#alternatives-stable)

## Development Setup

### OSX MAC install truncate (via homebrew)

    $ brew install truncate

### Find `local.ts` and copy into `config` directory

_`local.ts` contains overrides for environment variables that contain authentication keys and other secrets. The WAMS group stores a protected copy of this file in Keeper._

### Copy the default docker-compose.override.yml into place

    $ cp docker-compose.override.example.yml docker-compose.override.yml

### Set a Github Npm Registry token

[Create a personal access token](https://help.github.com/en/github/managing-packages-with-github-packages/configuring-npm-for-use-with-github-packages#authenticating-with-a-personal-access-token) the set an environment variable `GITHUB_NPM_TOKEN` to enable access and installing the `@osu-wams/*` package dependencies. Typically you would set the environment variable in a `~/.bashrc` or `~/.zshrc` (or similar configuration).

    $ export GITHUB_NPM_TOKEN=xxxxxxxxxxxxxx

### Install the node modules

    $ yarn

### Start the DynamoDb and Redis Queue

    $ docker-compose up

### Create the tables in DynamoDb

_This step is only required the first time you start development and/or if you wipe the docker volumes for this project._

    $ yarn ts-node -T src/db/scripts/create_table.ts user
    $ yarn ts-node -T src/db/scripts/create_table.ts favorite
    $ yarn ts-node -T src/db/scripts/create_table.ts trending

### Run the server for local development

To run without SAML authentication, in a separate terminal window run:

    $ yarn start

To run with SAML authentication, in a separate terminal window run:

    $ yarn saml

### Create a 'refresh' JWT for use with mobile application development

Create (and replace existing) refresh token for the user id provided. This user must have a full record in the local database.

    $ yarn ts-node support/jwt.ts create <OSUID>

Read (decrypt and decode) any jwt token to see its contents.

    $ yarn ts-node support/jwt.ts read <TOKEN>

# Localhost Tips

## Scan all records from a table

Query all of the data from a table and save it as a JSON file. _Beware, this could take a long time and will become impractical for very large tables._

    $ yarn ts-node -T src/db/scripts/scan_table.ts [favorite | trending] [output_filename]

## List all tables

Query a list of all of the DynamoDb tables.

    $ yarn ts-node -T src/db/scripts/list_tables.ts

## Sync a User record from the cloud to localhost

To perform a _full masquerade_ of a user, a record in the local DynamoDB Users table must exist. A _full masquerade_ provides the user record to the front-end and enables it to filter resources and a user experience to most closely match what an end user would see.

Syncing a user from the cloud DynamoDB requires a setting in `config/local.ts`;

    // find the AWS configuration and set it like this
    aws: {
      dynamodbCloud: {
        endpoint: 'https://dynamodb.us-west-2.amazonaws.com',
        apiVersion: '2012-08-10',
        tablePrefix: 'development',
      },
      dynamodb: {
        endpoint: 'http://localhost:8000',
      },
    }

Execute a utility script to fetch the user, providing thier osuID in place of the _##########_ below, and persist them locally;

    $ yarn ts-node -T src/db/scripts/sync_user.ts #########

# Admin Functions

## [Inspect a JWT token](support/README.md)

## Authenticate on the CLI

Key based authentication exists to facilitate automation and to enable administrative
tooling for performing functions that aren't otherwise exposed through the front-end. An
approach to performing these functions is to use `curl` to login and call subsequent actions.

Capture cookies send from the server and use cookies provided by the server happens when a `-b` and `-c` parameter is included with the `curl` command.

`curl -b cookie.txt -c cookie.txt ...`

## First, login using an API key

**A valid DX users `osuId` must be provided along with a valid API key (find this in the dx-infrastructure configurations or the ENV in the server service in ECS).**

    curl -b cookie.txt -c cookie.txt https://dev.my.oregonstate.edu/login?osuId=#########&key=########

### Fetch the latest application metrics.

This will return a large JSON payload of the application metrics listed below. Using a tool like
`jq` will format the output of this API and make consuming the data easier.

- Total Users Count
- Users by Affiliation Count (dynamic, but currently employee vs student)
- Users by Theme Count (dynamic, but currently light vs dark)
- Users Count Grouped by LastLogin Date (number of people who’s last date of login was that date)
- Favorited Resources Count
- Unfavorited Resources Count (first marked as favorite, then explicitly unmarked as favorite)
- Trending Resources (past 30 days) Total Clicks
- Trending Resources (past 30 days) Clicks by Affiliation (employee vs student)
- Trending Resources (past 30 days) Clicks for each Campus
- Trending Resources (past 30 days) Clicks per day
- Trending Resources (past 30 days) Top 10 resources clicked by Affiliation (employee vs student)
- Page Views (past 30 days) Count of Top 20 urls visited in application
- Active Users Count of Unique Users with at least 1 session in the past 1 day
- Active Users Count of Unique Users with at least 1 session in the past 7 days
- Active Users Count of Unique Users with at least 1 session in the past 14 days
- Active Users Count of Unique Users with at least 1 session in the past 30 days

Fetch data;

    curl -b cookie.txt -c cookie.txt https://dev.my.oregonstate.edu/api/admin/metrics
    // or
    // curl -b cookie.txt -c cookie.txt https://dev.my.oregonstate.edu/api/admin/metrics | jq

### Take a look at the deployed configurations (except sensitive values).

This will return a JSON payload of the deployed configurations except for sensitive values like API keys, IDs, certs, and the like. If you have the commandline
tool `jq`, pipe the output from the command to `jq` to get a formatted display.

    curl -b cookie.txt -c cookie.txt https://dev.my.oregonstate.edu/api/admin/config
    // or
    // curl -b cookie.txt -c cookie.txt https://dev.my.oregonstate.edu/api/admin/config | jq

### Reset all API caches?

This feature will clear all of the external API caches in the case that some data changes need to flow out to the front-end ASAP.

    curl -b cookie.txt -c cookie.txt https://dev.my.oregonstate.edu/api/admin/reset-api-cache

### Reset all user sessions?

This feature is intended to be used infrequently and will cause all users to have to "opt-in" to Canvas OAuth. **use sparingly!**

    curl -b cookie.txt -c cookie.txt https://dev.my.oregonstate.edu/api/admin/reset-sessions
