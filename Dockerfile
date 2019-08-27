FROM node:10.15.0-alpine

RUN apk add yarn

ENV appDir /var/www/app/current

# Set the work directory
RUN mkdir -p /var/www/app/current
WORKDIR ${appDir}

# Add our package.json and install *before* adding our application files
ADD ./package.json ./
ADD ./yarn.lock ./
RUN yarn install
RUN yarn global add nodemon ts-node typescript pm2
RUN pm2 install typescript

# Now add application files
ADD . ./

# Expose the port
EXPOSE 4000

# Default to production unless NODE_ENV is specified
ENV NODE_ENV=${NODE_ENV:-production}

CMD [ "sh", "-c", "pm2-runtime start pm2.config.js --env ${NODE_ENV}" ]
