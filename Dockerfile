FROM node:14-alpine

# RUN apk add --no-cache yarn
RUN npm install -g yarn@1.22.4 --force

ENV appDir /var/www/app/current

# Set the work directory
RUN mkdir -p /var/www/app/current
WORKDIR ${appDir}

# Github NPM Registry Access
ARG GITHUB_NPM_TOKEN
ENV GITHUB_NPM_TOKEN=$GITHUB_NPM_TOKEN

# Add our package.json and install *before* adding our application files
ADD ./package.json ./
ADD ./yarn.lock ./
ADD ./.npmrc ./
RUN yarn install
RUN yarn global add ts-node typescript

# Now add application files
ADD . ./

# Expose the port
EXPOSE 4000

# Default to development unless NODE_ENV is specified
ARG NODE_ENV=development
ENV NODE_ENV=$NODE_ENV

# Default to development unless APP_VERSION is specified
ARG APP_VERSION=development
ENV APP_VERSION=$APP_VERSION

CMD [ "sh", "-c", "ts-node src/index.ts" ]
